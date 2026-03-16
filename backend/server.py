from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import aiofiles
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'garden_storm')]

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # 'user' or 'assistant'
    content: str
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_name: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    session_id: str
    message: str
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_name: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class SubscribeRequest(BaseModel):
    email: str

# Initialize chat instances per session
chat_instances = {}

def get_chat_instance(session_id: str) -> LlmChat:
    if session_id not in chat_instances:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat_instances[session_id] = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message="""You are a friendly AI assistant for "Garden After the Storm" - a poetry and music album by Erich Fritz and Arica Hilton. 

The album features 10 tracks of poetry and music exploring themes of transformation, love, passion, and peace.

Key information:
- Artists: Erich Fritz (composer, @darko_vaughn) and Arica Hilton (poet, pen name Sophia Jolie)
- The album cover features Van Gogh's "Wheat fields with Cypresses" which brought the artists together
- Tracks include: Garden After the Storm, I Heard an Oak Tree, Sunstorm of Passion, Deeper Than Love, The Music of Our Becoming II
- Available on Spotify, YouTube, SoundCloud
- Release: Spring 2026

Be helpful, warm, and knowledgeable about the album and artists. If users share files or images, acknowledge them and respond appropriately."""
        ).with_model("gemini", "gemini-2.5-flash")
    return chat_instances[session_id]

@api_router.get("/")
async def root():
    return {"message": "Garden After the Storm API"}

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file and return its URL"""
    try:
        # Generate unique filename
        file_ext = Path(file.filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Determine file type
        content_type = file.content_type or ""
        if content_type.startswith("image/"):
            file_type = "image"
        elif content_type.startswith("video/"):
            file_type = "video"
        elif content_type.startswith("audio/"):
            file_type = "audio"
        else:
            file_type = "document"
        
        # Save file in chunks to handle large files without freezing
        async with aiofiles.open(file_path, 'wb') as out_file:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                await out_file.write(chunk)
        
        logger.info(f"File uploaded: {unique_filename}, type: {file_type}")
        
        return {
            "url": f"/api/uploads/{unique_filename}",
            "file_type": file_type,
            "file_name": file.filename,
            "size": os.path.getsize(file_path)
        }
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded files"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message to the AI assistant"""
    try:
        chat_instance = get_chat_instance(request.session_id)
        
        # Store user message in DB
        user_msg = ChatMessage(
            session_id=request.session_id,
            role="user",
            content=request.message,
            file_url=request.file_url,
            file_type=request.file_type,
            file_name=request.file_name
        )
        user_doc = user_msg.model_dump()
        user_doc['timestamp'] = user_doc['timestamp'].isoformat()
        await db.chat_messages.insert_one(user_doc)
        
        # Prepare message for AI
        message_text = request.message
        file_contents = []
        
        # If there's a file, try to include it
        if request.file_url and request.file_type:
            # Extract filename from URL
            filename = request.file_url.split('/')[-1]
            file_path = UPLOAD_DIR / filename
            
            if file_path.exists():
                # Map file types to mime types
                ext = file_path.suffix.lower()
                mime_map = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp',
                    '.mp4': 'video/mp4',
                    '.mov': 'video/quicktime',
                    '.avi': 'video/x-msvideo',
                    '.pdf': 'application/pdf',
                    '.txt': 'text/plain',
                    '.csv': 'text/csv',
                }
                mime_type = mime_map.get(ext, 'application/octet-stream')
                
                try:
                    file_content = FileContentWithMimeType(
                        file_path=str(file_path),
                        mime_type=mime_type
                    )
                    file_contents.append(file_content)
                    message_text = f"[User attached a {request.file_type}: {request.file_name}]\n\n{request.message}"
                except Exception as fe:
                    logger.warning(f"Could not attach file to AI: {fe}")
                    message_text = f"[User attached a {request.file_type}: {request.file_name}, but I cannot view it directly]\n\n{request.message}"
        
        # Create user message
        if file_contents:
            user_message = UserMessage(text=message_text, file_contents=file_contents)
        else:
            user_message = UserMessage(text=message_text)
        
        # Get AI response
        response_text = await chat_instance.send_message(user_message)
        
        # Store assistant message in DB
        assistant_msg = ChatMessage(
            session_id=request.session_id,
            role="assistant",
            content=response_text
        )
        assistant_doc = assistant_msg.model_dump()
        assistant_doc['timestamp'] = assistant_doc['timestamp'].isoformat()
        await db.chat_messages.insert_one(assistant_doc)
        
        return ChatResponse(response=response_text, session_id=request.session_id)
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    messages = await db.chat_messages.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    return {"messages": messages}

@api_router.delete("/chat/history/{session_id}")
async def clear_chat_history(session_id: str):
    """Clear chat history for a session"""
    await db.chat_messages.delete_many({"session_id": session_id})
    if session_id in chat_instances:
        del chat_instances[session_id]
    return {"status": "cleared"}

@api_router.post("/subscribe")
async def subscribe(request: SubscribeRequest):
    """Subscribe to newsletter"""
    try:
        doc = {
            "id": str(uuid.uuid4()),
            "email": request.email,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.subscribers.insert_one(doc)
        return {"status": "success", "message": "Thank you for subscribing!"}
    except Exception as e:
        logger.error(f"Subscribe error: {str(e)}")
        raise HTTPException(status_code=500, detail="Subscription failed")

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
