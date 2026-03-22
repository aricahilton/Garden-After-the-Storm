
from fastapi import FastAPI, APIRouter

from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import FileResponse

from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict

from typing import List
import uuid
from datetime import datetime, timezone

from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import aiofiles
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix

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



# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app

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

# Merch Products (fixed prices - server-side only)
MERCH_PRODUCTS = {
    "album_limited": {"name": "Limited Edition Album - Signed & Numbered", "price": 650.00, "type": "physical"},
    "album_standard": {"name": "Garden After the Storm - Standard Edition", "price": 44.99, "type": "physical"},
    "book": {"name": "Garden After the Storm 2026 - Poetry Book", "price": 50.00, "type": "physical"},
    "digital_album": {"name": "Digital Album - Full Download", "price": 19.99, "type": "digital", "files": ["track_01_garden_after_the_storm.wav", "track_02_i_heard_an_oak_tree.wav", "track_03_sunstorm_of_passion.wav", "track_04_deeper_than_love.wav", "track_05_rivers_in_me.wav", "track_06_the_music_of_our_becoming.wav", "track_07_distance.wav", "track_08_same_moon_between_us.wav"]},
    "digital_single_garden": {"name": "Garden After the Storm - Single", "price": 3.99, "type": "digital", "files": ["track_01_garden_after_the_storm.wav"]},
    "digital_single_oak": {"name": "I Heard an Oak Tree - Single", "price": 3.99, "type": "digital", "files": ["track_02_i_heard_an_oak_tree.wav"]}
}

class CheckoutRequest(BaseModel):
    product_id: str
    origin_url: str

class PaymentStatusRequest(BaseModel):
    session_id: str

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

# Stripe Payment Endpoints
@api_router.post("/checkout/create")
async def create_checkout(request: CheckoutRequest, http_request: Request):
    """Create a Stripe checkout session for merch purchase"""
    try:
        # Validate product exists
        if request.product_id not in MERCH_PRODUCTS:
            raise HTTPException(status_code=400, detail="Invalid product")
        
        product = MERCH_PRODUCTS[request.product_id]
        amount = product["price"]
        
        # Build URLs from frontend origin
        success_url = f"{request.origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{request.origin_url}/#merch"
        
        # Initialize Stripe
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=float(amount),
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "product_id": request.product_id,
                "product_name": product["name"],
                "source": "garden_storm_merch"
            }
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction in database
        transaction = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "product_id": request.product_id,
            "product_name": product["name"],
            "amount": amount,
            "currency": "usd",
            "status": "initiated",
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        logger.info(f"Checkout session created: {session.session_id}")
        return {"url": session.url, "session_id": session.session_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, http_request: Request):
    """Get the status of a checkout session"""
    try:
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction in database
        update_data = {
            "status": status.status,
            "payment_status": status.payment_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
        
    except Exception as e:
        logger.error(f"Status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook event
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "event_type": webhook_response.event_type,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        logger.info(f"Webhook processed: {webhook_response.event_type}")
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Webhook failed: {str(e)}")

@api_router.get("/download/{session_id}")
async def get_download_links(session_id: str, http_request: Request):
    """Get download links for digital purchases after successful payment"""
    try:
        # Check payment status first
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        if status.payment_status != "paid":
            raise HTTPException(status_code=403, detail="Payment not completed")
        
        # Get transaction from database
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        product_id = transaction.get("product_id")
        if product_id not in MERCH_PRODUCTS:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product = MERCH_PRODUCTS[product_id]
        if product.get("type") != "digital":
            raise HTTPException(status_code=400, detail="Not a digital product")
        
        # Generate download links
        base_url = str(http_request.base_url).rstrip('/')
        download_links = []
        for file in product.get("files", []):
            download_links.append({
                "filename": file,
                "url": f"{base_url}api/uploads/{file}"
            })
        
        return {
            "product_name": product["name"],
            "downloads": download_links
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

# Include the router

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
