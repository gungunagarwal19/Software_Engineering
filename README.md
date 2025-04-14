CineVibe   
Movie Ticket Booking Made Fun!  

Experience the thrill of cinema from your screen!  
CineVibe lets you explore movies, find theaters, and book tickets—with flair.  
Whether it’s a rom-com or an action-packed blockbuster, CineVibe makes booking exciting.

-------------------------------------
Technologies Used

- Express.js  
- MySQL  
- Trakt API, Fanart API  
- Overpass & Nominatim APIs  
- NodeMailer (SMTP)  
- Vanilla JavaScript + Tailwind CSS  

-------------------------------------

Project Setup Guide

1. Backend Setup

cd backend
npm install express cors axios geolib dotenv nodemailer bcrypt jsonwebtoken mysql2 init
MySQL Setup
Start MySQL server

2. Create a new database

3. Create tables:

users

tickets

movies

4. Add .env in backend/ folder:

JWT_KEY=your_jwt_secret_key  
DB_HOST=your_db_host  
DB_USER=your_db_user  
DB_PASSWORD=your_db_password  
DB_NAME=your_database_name  

5.Start Backend Server

npm run dev
Runs at: http://localhost:3000

---------------------------------------

1. Frontend Setup

cd frontend
npm install
npm run dev
Runs at: http://localhost:5173

2. Groot: CineVibe’s Intelligent Chatbot

-What is RAG?
Retrieval-Augmented Generation =
Retrieve info from knowledge base + Generate natural responses via LLM.
Groot uses this for smarter, personalized help.

-Capabilities
-Movie recommendations
-Booking guidance
-Theater info & FAQs
-Architecture
-LLM: Gemini 2.0 Flash
-Embedding: text-embedding-004
-Vector DB: Pinecone
-API: FastAPI

3.Installation

cd Software_Engineering/Groot
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

4..env File

API_KEY=sk-groot-api-key-2024  
GEMINI_API_KEY=AIza...  
GEMINI_MODEL=gemini-2.0-flash  
PINECONE_API_KEY=pcsk_...  
PINECONE_INDEX=clnevibeindex  
PINECONE_ENVIRONMENT=us-east-1  

5.Run Groot API

python -m uvicorn api:app --host 0.0.0.0 --port 3001
Test Groot

curl -X POST http://localhost:3001/chat \
     -H "Content-Type: application/json" \
     -H "x-api-key: sk-groot-api-key-2024" \
     -d '{"message":"Hello", "unrestricted":true}'

 6.QR Code Generator
Python API to generate ticket QR codes.

Requirements
Python 3.8+

7.Install dependencies:

cd qr_generator
pip install -r requirements.txt

8.Run the API

python -m uvicorn qr_api:app --host 0.0.0.0 --port 3002

-------------------------------------------------------

Endpoints
1. JSON QR Code
POST /generate-qr

{
  "movie": "Movie Title",
  "theater": "Theater Name",
  "seats": ["A1", "A2"],
  "date": "2023-05-15",
  "time": "18:30",
  "price": "300",
  "ticket_id": "123",
  "user_id": "456"
}
Returns:

qr_code: base64 image

ticket_data: original data

2. PNG QR Image
POST /generate-qr-image
(Same request body, response = PNG image)

Security Considerations
QR API accessible only via backend

Encrypt sensitive ticket data in production

Use auth keys for all internal API calls

Testing the Full Application
Visit: http://localhost:5173

Register/Login as:

User: Book movies, view tickets

Cinema Owner: Add/manage movies, view reports

-----------------------------------------------------

Features
Dashboard for both roles

Token-based login using localStorage

Real-time seat booking

Email confirmations via NodeMailer

----------------------------

Troubleshooting
1. Backend Issues
Check if MySQL is running

Verify .env variables

Ensure tables are created correctly

2. Frontend Issues
Confirm backend is running on port 3000

Refresh localhost:5173 after login

3.Groot Issues
Check for FastAPI startup errors

Fix dependency conflicts with virtual environment

Validate Pinecone keys/index

4.QR Code Issues
Ensure QR API runs at port 3002

Validate incoming ticket JSON
-----------------------------------------

License
This project is part of the CineVibe Movie Ticket Booking Platform.
All rights reserved © 2025

----------------------------------------------------------------

Your CineVibe application should now be running with both frontend and backend fully functional.







