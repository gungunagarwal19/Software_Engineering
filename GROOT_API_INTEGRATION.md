# Groot API Integration

This document explains how to use the Groot API with the CineVibe frontend chatbot.

## Overview

The Groot API provides natural language processing capabilities to the CineVibe chatbot. It allows users to ask questions about movies, bookings, and the CineVibe platform.

## Starting the Groot API

To start the Groot API:

1. Open a command prompt
2. Navigate to the Groot directory
3. Run the following command:
   ```
   python -m uvicorn api:app --host 0.0.0.0 --port 3001
   ```

### API Key Authentication

The Groot API uses API key authentication. The API key is `sk-groot-api-key-2024` as defined in the `.env` file. This key must be included in the `x-api-key` header of all requests to the API.

If you want to use a different API key, you can modify the `API_KEY` value in the `.env` file before starting the API.

## API Endpoint

The Groot API exposes a single endpoint:

- **URL**: `http://localhost:3001/chat`
- **Method**: POST
- **Headers**:
  - `Content-Type: application/json`
  - `x-api-key: sk-groot-api-key-2024` (the value from the .env file)
- **Request Body**:
  ```json
  {
    "message": "Your question here",
    "unrestricted": true
  }
  ```
- **Response**:
  ```json
  {
    "response": "The answer to your question",
    "reference_used": true|false
  }
  ```

## Integration with CineVibe

The CineVibe frontend communicates with the Groot API through the backend server. The backend server acts as a proxy to the Groot API.

### Backend Endpoint

- **URL**: `http://localhost:3000/api/groot/chat`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "message": "Your question here",
    "userId": "optional_user_id"
  }
  ```
- **Response**: Same as the Groot API response

### Frontend Component

The frontend includes a Chatbot component that:

1. Displays a chat interface
2. Sends user messages to the backend
3. Displays responses from the Groot API

## Starting the Application

### Step 1: Start the Groot API

First, you need to start the Groot API separately:

1. Open a command prompt
2. Navigate to the Groot directory
3. Run the following command:
   ```
   python -m uvicorn api:app --host 0.0.0.0 --port 3001
   ```
4. Wait until you see a message indicating that the Groot API is running on http://localhost:3001

### Step 2: Start the Backend Server

After the Groot API is running, start the backend server:

1. Open another command prompt
2. Navigate to the backend directory
3. Run the following command:
   ```
   npm start
   ```
4. This will start the backend server on port 3000

### Step 3: Start the Frontend Application

Finally, start the frontend application:

1. Open another command prompt
2. Navigate to the frontend directory
3. Run the following command:
   ```
   npm run dev
   ```
4. This will start the frontend application on port 5173

## Using the Chatbot

1. Open your browser and navigate to http://localhost:5173
2. Log in to the application
3. Go to the Profile page
4. Use the chatbot on the right side of the page to ask questions about movies, bookings, or CineVibe

## Troubleshooting

If the chatbot is not working properly:

1. Make sure the Groot API is running on http://localhost:3001
2. Check the browser console for any error messages
3. Check the backend server console for any error messages
4. Try restarting the Groot API and the backend server

### Common Issues

#### 401 Unauthorized Errors

If you see 401 Unauthorized errors in the Groot API logs, it means the API key is incorrect. Make sure:

1. The backend is sending the correct API key in the `x-api-key` header
2. The API key matches the one expected by the Groot API (`sk-groot-api-key-2024` as defined in the .env file)
3. If you've modified the API key in the .env file, make sure the backend is using the same key

To fix this issue:

1. Check the API key in `Software_Engineering\backend\server.js`
2. Make sure it matches the API key in `Software_Engineering\Groot\.env`
3. Restart both the Groot API and the backend server after making changes

## Notes

- The Groot API must be started separately before using the chatbot
- The backend server will show a warning message if the Groot API is not running
- The chatbot uses the original Groot API with its RAG (Retrieval-Augmented Generation) implementation without any modifications
