import os
from dotenv import load_dotenv
import json
import requests
from pinecone import Pinecone, ServerlessSpec  # Add ServerlessSpec import
import logging
import time
from typing import List, Dict, Any, Optional, Union
from pathlib import Path

from google import genai
from google.genai import types

# Load environment variables
load_dotenv()


# Get API keys and configuration from environment variables with validation
def get_required_env(key: str, default: Optional[str] = None) -> str:
    value = os.environ.get(key, default)
    if not value:
        raise ValueError(f"Missing required environment variable: {key}")
    return value

try:
    # API Configuration
    api_timeout = int(get_required_env("API_TIMEOUT", "30"))
    api_retry_count = int(get_required_env("API_RETRY_COUNT", "3"))
    
    # DeepSeek Configuration
    deepseek_api_key = get_required_env("DEEPSEEK_API_KEY")
    deepseek_model = get_required_env("DEEPSEEK_MODEL", "deepseek-chat")
    deepseek_embedding_model = get_required_env("DEEPSEEK_EMBEDDING_MODEL", "deepseek-embedding")

    gemini_api_key = get_required_env("GEMINI_API_KEY")
    gemini_model = get_required_env("GEMINI_MODEL", "gemini-2.0-flash")
    gemini_embedding_model = get_required_env("GEMINI_EMBEDDING_MODEL", "text-embedding-004")
    
    # Pinecone Configuration
    pinecone_api_key = get_required_env("PINECONE_API_KEY")
    pinecone_index_name = get_required_env("PINECONE_INDEX_NAME", "hack-iiitv-index")
    pinecone_environment = get_required_env("PINECONE_ENVIRONMENT", "us-west-2")
except ValueError as e:
    logging.error(str(e))
    raise

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('groot.log'),
        logging.StreamHandler()
    ]
)

# Initialize chat history
chat = [
    {"role": "system", "content": "You are Groot, a RAG enhanced Large Language Model. You are like a virtual professor that can regularly learn new things. You are now not restricted to your training dataset. The RAG system will provide you with the reference information you need to answer question which are beyond your knowledge. If you get a Reference Information Along with the prompt, you need to use the given information along with your existing knowledge base (more emphasis on the provided reference). Your purpose is to provide the most accurate and relevant information to the student and help them in their learning journey."},
]

# Initialize Pinecone with retry mechanism
def initialize_pinecone(max_retries: int = api_retry_count, delay: int = 2) -> Pinecone:
    for attempt in range(max_retries):
        try:
            pc = Pinecone(
                api_key=pinecone_api_key
            )
            logging.info("Pinecone initialized successfully")
            return pc
        except Exception as e:
            if attempt == max_retries - 1:
                logging.error(f"Failed to initialize Pinecone after {max_retries} attempts: {str(e)}")
                raise
            logging.warning(f"Attempt {attempt + 1} failed, retrying in {delay} seconds...")
            time.sleep(delay)

# Initialize Pinecone client
pc = initialize_pinecone()

# Load source mapping with proper error handling
def load_source_mapping() -> Dict[str, str]:
    try:
        os.makedirs("Dataset", exist_ok=True)
        mapping_file = Path("Dataset/SourceMapping.json")
        if mapping_file.exists():
            with open(mapping_file, "r") as f:
                source_mapping = json.load(f)
            logging.info("Source mapping loaded successfully")
            return source_mapping
        else:
            logging.warning("SourceMapping.json not found, creating empty mapping")
            source_mapping = {}
            with open(mapping_file, "w") as f:
                json.dump({}, f)
            return source_mapping
    except Exception as e:
        logging.error(f"Error loading source mapping: {str(e)}")
        raise

sourceMapping = load_source_mapping()

def getChunks(data: str, size: int = 500) -> List[str]:
    """Split data into chunks of specified size"""
    if not data:
        return []
    chunks = [data[i:i+size] for i in range(0, len(data), size)]
    return chunks

def embedText(chunk: str, max_retries: int = api_retry_count) -> List[float]:
    """Create embeddings for text using DeepSeek API"""
    for attempt in range(1):
        try:

            # headers = {
            #     "Authorization": f"Bearer {deepseek_api_key}",
            #     "Content-Type": "application/json"
            # }
            
            # data = {
            #     "input": chunk,
            #     "model": deepseek_embedding_model
            # }
            
            # response = requests.post(
            #     "https://api.deepseek.com/v1/embeddings",
            #     headers=headers,
            #     json=data,
            #     timeout=api_timeout
            # )

            # print("**********chunk = ", chunk)

            client = genai.Client(api_key = gemini_api_key)
            
            response = client.models.embed_content(
                model=gemini_embedding_model,
                contents=chunk
            )
            
            
            if not response:
                logging.error(f"DeepSeek API error: {response.text}")
                raise Exception(f"DeepSeek API error: {response.text}")
            
            
                
            result = response.embeddings[0].values

            if not result:
                raise Exception("No embedding data received from Gemini API")

            return result
        
        except Exception as e:
            if attempt == max_retries - 1:
                logging.error(f"Error creating embedding after {max_retries} attempts: {str(e)}")
                raise
            logging.warning(f"Embedding attempt {attempt + 1} failed, retrying...")
            time.sleep(1)

def storeEmbeddings(embeddings: List[List[float]], chunks: List[str], file: str, unrestricted: bool) -> None:
    """Store embeddings in Pinecone"""
    if not embeddings or not chunks:
        logging.warning("No embeddings or chunks to store")
        return
        
    vectors = []
    file = file.split(".")[0]
    
    # Get the last chunk ID or start from 0
    try:
        lastChunkID = int(str(list(sourceMapping.keys())[-1])[-1]) if sourceMapping else 0
    except (IndexError, ValueError):
        lastChunkID = 0
    
    # Create index if it doesn't exist
    try:
        if pinecone_index_name in pc.list_indexes().names():
            pc.delete_index(pinecone_index_name)
            logging.info(f"Deleted existing Pinecone index: {pinecone_index_name}")
            time.sleep(5)  # Wait for deletion to complete
            
        pc.create_index(
            name=pinecone_index_name,
            dimension=768,  # Match Gemini's embedding dimension
            metric='cosine',
            spec=ServerlessSpec(
                cloud='aws',
                region=pinecone_environment
            )
        )
        logging.info(f"Created new Pinecone index: {pinecone_index_name}")
        # Wait for index to be ready
        time.sleep(5)
    except Exception as e:
        logging.error(f"Error managing Pinecone index: {str(e)}")
        raise
    
    # Get index
    try:
        index = pc.Index(pinecone_index_name)
    except Exception as e:
        logging.error(f"Error accessing Pinecone index: {str(e)}")
        raise
    
    # Prepare vectors for upsert
    for i, embedding in enumerate(embeddings):
        chunk_id = f"{file.lower()}_chunk_{lastChunkID+i+1}"
        row = {
            'id': chunk_id,
            'values': embedding,
            "metadata": {"restricted": not unrestricted}
        }
        vectors.append(row)
    
    # Update source mapping
    for i, chunk in enumerate(chunks):
        sourceMapping[f"{file.lower()}_chunk_{lastChunkID+i+1}"] = chunk
    
    # Save source mapping
    try:
        with open("Dataset/SourceMapping.json", "w") as f:
            json.dump(sourceMapping, f)
        logging.info("Source mapping updated successfully")
    except Exception as e:
        logging.error(f"Error saving source mapping: {str(e)}")
        raise
    
    # Upsert vectors to Pinecone
    try:
        index.upsert(vectors=vectors)
        logging.info(f"Upserted {len(vectors)} embeddings to Pinecone")
    except Exception as e:
        logging.error(f"Error upserting to Pinecone: {str(e)}")
        raise

def processSample(data: str, file: str, unrestricted: bool) -> None:
    """Process a sample of data and store embeddings"""
    if not data:
        logging.warning("No data to process")
        return
        
    chunks = getChunks(data)
    if not chunks:
        logging.warning("No chunks generated from data")
        return
        
    try:
        embeddings = [embedText(chunk) for chunk in chunks]
        storeEmbeddings(embeddings, chunks, file, unrestricted)
    except Exception as e:
        logging.error(f"Error processing sample: {str(e)}")
        raise

def queryDatabase(prompt: str, unrestricted: bool) -> List[str]:
    """Query the database for relevant chunks"""
    if not prompt:
        logging.warning("Empty prompt provided")
        return []
        
    try:
        embeddings = embedText(prompt)
        
        # Get index
        try:
            index = pc.Index(pinecone_index_name)
        except Exception as e:
            logging.error(f"Error accessing Pinecone index: {str(e)}")
            return []
        
        # Query Pinecone
        if unrestricted:
            result = index.query(
                vector=embeddings, 
                filter={"restricted": False},
                top_k=5
            )
        else:
            result = index.query(
                vector=embeddings,
                top_k=5
            )
        
        # Extract matches
        matches = []
        # print("**********sourceMapping = ", sourceMapping)
        for chunk in result.get("matches", []):
            chunk_id = chunk.get("id")
            if chunk_id in sourceMapping:
                matches.append(sourceMapping[chunk_id])
        
        return matches
    except Exception as e:
        logging.error(f"Error querying database: {str(e)}")
        return []

def generateResponse(referenceGranted: bool, similarChunks: List[str], prompt: str) -> str:
    """Generate a response using DeepSeek API"""
    if not prompt:
        return "I'm sorry, but I didn't receive a question to answer."
        
    try:

        # Prepare the message with reference information if available
        if referenceGranted and similarChunks: 
            formatedReference = "".join(similarChunks)
            chat.append({
                "role": "user", 
                "content": f"""
                Reference Information: {formatedReference}
                
                Prompt: {prompt}
                """
            })
        else:
            chat.append({"role": "user", "content": prompt})
        
        # Maintain chat history (keep last 4 exchanges)
        if len(chat) >= 9:
            chat.remove(chat[1])
            chat.remove(chat[1])

        
        # Generate response using DeepSeek API
        # headers = {
        #     "Authorization": f"Bearer {deepseek_api_key}",
        #     "Content-Type": "application/json"
        # }

        
        # data = {
        #     "model": deepseek_model,
        #     "messages": chat,
        #     "temperature": 0.7,
        #     "max_tokens": 1000
        # }
        
        # response = requests.post(
        #     "https://api.deepseek.com/v1/chat/completions",
        #     headers=headers,
        #     json=data,
        #     timeout=api_timeout
        # )
        # print(chat[1]['content'])

        client = genai.Client(api_key = gemini_api_key)

        response = client.models.generate_content(
            model=gemini_model,
            contents = types.Content(
                role='user',
                parts=[types.Part.from_text(text=chat[-1]['content'])]
            ),
            config=types.GenerateContentConfig(
                system_instruction=chat[0]['content'],
                temperature=0.3
            )
        )

        if not response:
            logging.error(f"DeepSeek API error: {response.text}")
            raise Exception(f"DeepSeek API error: {response.text}")
        
        result = response.text
        # response_text = result["choices"][0]["message"]["content"]
        
        chat.append({"role": "assistant", "content": result})
        return result
        
    except Exception as e:
        logging.error(f"Error generating response: {str(e)}")
        return "I apologize, but I encountered an error while generating the response. Please try again."

def reset_chat_history() -> None:
    """Reset the chat history to its initial state"""
    global chat
    chat = [
        {"role": "system", "content": "You are Groot, a RAG enhanced Large Language Model. You are like a virtual professor that can regularly learn new things. You are now not restricted to your training dataset. The RAG system will provide you with the reference information you need to answer question which are beyond your knowledge. If you get a Reference Information Along with the prompt, you need to use the given information along with your existing knowledge base (more emphasis on the provided reference). Your purpose is to provide the most accurate and relevant information to the student and help them in their learning journey."},
    ]
    logging.info("Chat history reset")
