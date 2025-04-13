from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import os
from dotenv import load_dotenv
import json
import logging
from pathlib import Path
import uvicorn

# Import Groot functions
from Groot import (
    generateResponse, 
    queryDatabase, 
    processSample, 
    reset_chat_history,
    get_required_env
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
load_dotenv()

# Get API configuration
try:
    API_KEY = get_required_env("API_KEY", "default_api_key_for_development")
    PORT = int(get_required_env("UVICORN_PORT", "3000"))
    DEBUG = get_required_env("FLASK_DEBUG", "True").lower() == "true"
except ValueError as e:
    logging.error(f"Configuration error: {str(e)}")
    raise

# Initialize FastAPI app
app = FastAPI(
    title="Groot API", 
    description="RAG-Powered Chatbot API",
    version="1.0.0"
)

# API key validation
async def validate_api_key(x_api_key: str = Header(..., description="API Key for authentication")):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

# Request models
class ChatRequest(BaseModel):
    message: str = Field(..., description="User message to process")
    unrestricted: bool = Field(False, description="Whether to allow restricted sources")

class ChatResponse(BaseModel):
    response: str = Field(..., description="Groot's response to the user message")
    reference_used: bool = Field(..., description="Whether reference information was used")

class ProfileRecommendationRequest(BaseModel):
    user_interests: List[str] = Field(..., description="List of user interests")
    watch_history: Optional[List[str]] = Field(None, description="User's watch history")
    favorite_genres: Optional[List[str]] = Field(None, description="User's favorite genres")
    preferred_language: Optional[str] = Field(None, description="User's preferred language")

class FAQRequest(BaseModel):
    question: str = Field(..., description="FAQ question to answer")
    user_id: Optional[str] = Field(None, description="User ID for context")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context for the question")

class FAQResponse(BaseModel):
    answer: str = Field(..., description="Answer to the FAQ question")
    context_used: bool = Field(..., description="Whether user context was used")
    has_reference: bool = Field(..., description="Whether reference information was used")

class FileUploadRequest(BaseModel):
    file_path: str = Field(..., description="Path to the file to process")
    unrestricted: bool = Field(False, description="Whether to mark the content as unrestricted")

class FileUploadResponse(BaseModel):
    success: bool = Field(..., description="Whether the file was processed successfully")
    message: str = Field(..., description="Status message")
    file_name: str = Field(..., description="Name of the processed file")

# API endpoints
@app.post("/chat", response_model=ChatResponse, dependencies=[Depends(validate_api_key)])
async def groot_chat(request: ChatRequest):
    """
    Process a chat message and return Groot's response.
    """
    try:
        # Get relevant chunks from Pinecone
        similar_chunks = queryDatabase(request.message, request.unrestricted)

        # print("similar_chunks = ", similar_chunks)
        
        # Generate response using Groot's logic
        response = generateResponse(
            referenceGranted=bool(similar_chunks),
            similarChunks=similar_chunks,
            prompt=request.message
        )
        
        return {
            "response": response,
            "reference_used": bool(similar_chunks)
        }
    except Exception as e:
        logging.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/cinevibe/profile/faq", response_model=FAQResponse, dependencies=[Depends(validate_api_key)])
async def profile_faq(request: FAQRequest):
    """
    Process a FAQ question and return a response.
    """
    try:
        # Construct a context-aware prompt for FAQ
        context_str = ""
        if request.context:
            context_str = f"""
            User Context:
            - User ID: {request.user_id if request.user_id else 'Anonymous'}
            - Additional Context: {json.dumps(request.context)}
            """
        
        prompt = f"""
        {context_str}
        Question: {request.question}
        
        Please provide a helpful and accurate response to this FAQ question.
        If the question is about Cinevibe's features, policies, or general information,
        use the reference information provided to give the most accurate answer.
        """
        
        # Get relevant chunks from Pinecone
        similar_chunks = queryDatabase(prompt, True)  # Using unrestricted mode for FAQ
        
        # Generate response
        response = generateResponse(
            referenceGranted=bool(similar_chunks),
            similarChunks=similar_chunks,
            prompt=prompt
        )
        
        return {
            "answer": response,
            "context_used": bool(context_str),
            "has_reference": bool(similar_chunks)
        }
    except Exception as e:
        logging.error(f"Error in FAQ endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing FAQ: {str(e)}")

@app.post("/upload", response_model=FileUploadResponse, dependencies=[Depends(validate_api_key)])
async def upload_file(request: FileUploadRequest):
    """
    Upload and process a file for the RAG system.
    """
    try:
        file_path = Path(request.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        with open(file_path, "r", encoding="utf-8") as f:
            data = f.read()
        
        processSample(data, file_path.name, request.unrestricted)
        
        return {
            "success": True,
            "message": f"File processed successfully: {file_path.name}",
            "file_name": file_path.name
        }
    except Exception as e:
        logging.error(f"Error in file upload endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/reset", dependencies=[Depends(validate_api_key)])
async def reset_chat():
    """
    Reset the chat history.
    """
    try:
        reset_chat_history()
        return {"success": True, "message": "Chat history reset successfully"}
    except Exception as e:
        logging.error(f"Error resetting chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error resetting chat history: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(
        "api:app", 
        host="0.0.0.0", 
        port=PORT, 
        reload=DEBUG
    )