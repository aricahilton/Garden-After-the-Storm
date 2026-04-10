from fastapi import FastAPI, APIRouter, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from emergentintegrations.payments.stripe.checkout import StripeCheckout


import stripe

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe setup
stripe.api_key = os.environ['STRIPE_API_KEY']

# Fixed product packages (prices defined server-side only)
PRODUCTS = {
    "album_limited": {"name": "Deluxe Limited Edition Album", "price": 975.00, "currency": "usd"},
    "album_standard": {"name": "Garden After the Storm - Standard Edition", "price": 44.99, "currency": "usd"},
    "book": {"name": "BOUNDLESS Poetry Book", "price": 50.00, "currency": "usd"},
    "digital_album": {"name": "Digital Album - Full Download", "price": 19.99, "currency": "usd"},
    "digital_single_garden": {"name": "Garden After the Storm - Single", "price": 3.99, "currency": "usd"},
    "digital_single_oak": {"name": "I Heard an Oak Tree - Single", "price": 3.99, "currency": "usd"},
}

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Mount static files directory under /api prefix for proper routing through ingress
static_dir = ROOT_DIR / "static"
if static_dir.exists():
    api_router_static = APIRouter(prefix="/api")
    app.mount("/api/static", StaticFiles(directory=str(static_dir)), name="static")

# Mount uploads directory for audio tracks
uploads_dir = ROOT_DIR / "uploads"
if uploads_dir.exists():
    app.mount("/api/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


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

# Checkout request model
class CheckoutCreateRequest(BaseModel):
    product_id: str
    origin_url: str

# Stripe Checkout Routes
@api_router.post("/checkout/create")
async def create_checkout(request_body: CheckoutCreateRequest, http_request: Request):
    product_id = request_body.product_id
    origin_url = request_body.origin_url

    if product_id not in PRODUCTS:
        raise HTTPException(status_code=400, detail="Invalid product")

    product = PRODUCTS[product_id]

    success_url = f"{origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = origin_url

    amount_in_cents = int(product["price"] * 100)

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": product["currency"],
                "product_data": {
                    "name": product["name"],
                },
                "unit_amount": amount_in_cents,
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"product_id": product_id, "product_name": product["name"]}
    )

    # Store transaction in MongoDB
    transaction = {
        "session_id": session.id,
        "product_id": product_id,
        "product_name": product["name"],
        "amount": product["price"],
        "currency": product["currency"],
        "payment_status": "initiated",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction)

    return {"url": session.url, "session_id": session.id}


@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    session = stripe.checkout.Session.retrieve(session_id)

    payment_status = session.payment_status
    status = session.status

    # Update transaction in MongoDB
    existing = await db.payment_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    if existing and existing.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": payment_status,
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )

    return {
        "status": status,
        "payment_status": payment_status,
        "amount_total": session.amount_total,
        "currency": session.currency,
        "metadata": dict(session.metadata) if session.metadata else {}
    }


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.json()
    
    event_type = body.get("type", "")
    session_data = body.get("data", {}).get("object", {})
    session_id = session_data.get("id", "")
    payment_status = session_data.get("payment_status", "")

    if event_type == "checkout.session.completed" and payment_status == "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": "paid",
                "status": "complete",
                "event_type": event_type,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )

    return {"status": "ok"}


# Include the router in the main app
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