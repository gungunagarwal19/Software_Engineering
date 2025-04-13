from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import qrcode
from io import BytesIO
import base64
import json
import uvicorn
import uuid
from datetime import datetime

app = FastAPI(title="Ticket QR Code Generator")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class TicketData(BaseModel):
    movie: str
    theater: str
    seats: list
    date: str
    time: str
    price: str
    ticket_id: str = None
    user_id: str = None
    timestamp: str = None
    title: str = None

@app.get("/")
async def root():
    return {"message": "Ticket QR Code Generator API is running"}

@app.post("/generate-qr")
async def generate_qr(ticket: TicketData):
    try:
        # Validate required fields
        if not ticket.movie or not ticket.theater or not ticket.seats or not ticket.date or not ticket.time or not ticket.price:
            raise HTTPException(status_code=400, detail="Missing required ticket information")

        # Create a dictionary with ticket data
        ticket_dict = {
            "movie": ticket.movie,
            "theater": ticket.theater,
            "seats": ticket.seats,
            "date": ticket.date,
            "time": ticket.time,
            "price": ticket.price,
            # Add a unique identifier and timestamp for each QR code
            "qr_uuid": str(uuid.uuid4()),
            "generated_at": datetime.now().isoformat()
        }

        # Add optional fields if they exist
        if ticket.ticket_id:
            ticket_dict["ticket_id"] = ticket.ticket_id
        if ticket.user_id:
            ticket_dict["user_id"] = ticket.user_id
        if ticket.timestamp:
            ticket_dict["timestamp"] = ticket.timestamp
        if ticket.title:
            ticket_dict["title"] = ticket.title

        # Convert to JSON string
        ticket_json = json.dumps(ticket_dict)

        # Generate QR code with higher error correction for better phone scanning
        qr = qrcode.QRCode(
            version=4,  # Higher version for more data capacity
            error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction
            box_size=10,
            border=4,
        )

        # Create a simple text format that's easy to scan
        movie_name = ticket.movie.replace(' ', '_')
        seats_text = ",".join([str(s) for s in ticket.seats])

        # Format: CINEVIBE-TICKET: Movie | Theater | Date | Time | Seats
        simple_text = f"CINEVIBE-TICKET: {movie_name} | {ticket.theater} | {ticket.date} | {ticket.time} | {seats_text}"

        # Add ticket ID if available
        if ticket.ticket_id:
            simple_text += f" | ID:{ticket.ticket_id}"

        qr.add_data(simple_text)
        qr.make(fit=True)

        # Create an image from the QR Code
        img = qr.make_image(fill_color="black", back_color="white")

        # Save the image to a bytes buffer
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        # Convert to base64 for easy embedding in HTML/JSON
        img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return {
            "qr_code": img_str,
            "ticket_data": ticket_dict
        }
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error generating QR code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating QR code: {str(e)}")

@app.post("/generate-qr-image")
async def generate_qr_image(ticket: TicketData):
    try:
        # Validate required fields
        if not ticket.movie or not ticket.theater or not ticket.seats or not ticket.date or not ticket.time or not ticket.price:
            raise HTTPException(status_code=400, detail="Missing required ticket information")

        # Create a dictionary with ticket data
        ticket_dict = {
            "movie": ticket.movie,
            "theater": ticket.theater,
            "seats": ticket.seats,
            "date": ticket.date,
            "time": ticket.time,
            "price": ticket.price,
            # Add a unique identifier and timestamp for each QR code
            "qr_uuid": str(uuid.uuid4()),
            "generated_at": datetime.now().isoformat()
        }

        # Add optional fields if they exist
        if ticket.ticket_id:
            ticket_dict["ticket_id"] = ticket.ticket_id
        if ticket.user_id:
            ticket_dict["user_id"] = ticket.user_id
        if ticket.timestamp:
            ticket_dict["timestamp"] = ticket.timestamp
        if ticket.title:
            ticket_dict["title"] = ticket.title

        # Convert to JSON string
        ticket_json = json.dumps(ticket_dict)

        # Generate QR code with higher error correction for better phone scanning
        qr = qrcode.QRCode(
            version=4,  # Higher version for more data capacity
            error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction
            box_size=10,
            border=4,
        )

        # Create a simple text format that's easy to scan
        movie_name = ticket.movie.replace(' ', '_')
        seats_text = ",".join([str(s) for s in ticket.seats])

        # Format: CINEVIBE-TICKET: Movie | Theater | Date | Time | Seats
        simple_text = f"CINEVIBE-TICKET: {movie_name} | {ticket.theater} | {ticket.date} | {ticket.time} | {seats_text}"

        # Add ticket ID if available
        if ticket.ticket_id:
            simple_text += f" | ID:{ticket.ticket_id}"

        qr.add_data(simple_text)
        qr.make(fit=True)

        # Create an image from the QR Code
        img = qr.make_image(fill_color="black", back_color="white")

        # Save the image to a bytes buffer
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        # Return the image directly
        return Response(content=buffer.getvalue(), media_type="image/png")
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error generating QR code image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating QR code: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("qr_api:app", host="0.0.0.0", port=3002, reload=True)
