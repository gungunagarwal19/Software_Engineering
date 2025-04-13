# Groot Installation Guide

This guide provides instructions for installing and running the Groot API component.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation Steps

1. **Navigate to the Groot directory**:
   ```bash
   cd Software_Engineering/Groot
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

   If you encounter any dependency conflicts, try installing the packages individually:
   ```bash
   pip install python-dotenv==1.0.0
   pip install requests==2.31.0
   pip install pinecone-client==2.2.4
   pip install fastapi>=0.115.2
   pip install uvicorn==0.27.1
   pip install gradio==4.19.2
   pip install numpy>=1.22.0
   pip install pandas>=1.0.0
   pip install colorama>=0.4.6
   pip install python-multipart>=0.0.18
   pip install typing-extensions>=4.0.0
   pip install pydantic>=2.0.0
   pip install websockets>=10.0
   pip install aiofiles>=22.0
   pip install python-dateutil>=2.8.2
   ```

## Running the Groot API

Start the API server:
```bash
python -m uvicorn api:app --host 0.0.0.0 --port 3001
```

## Testing the API

You can test if the API is working by sending a request:
```bash
curl -X POST "http://localhost:3001/chat" -H "Content-Type: application/json" -H "x-api-key: sk-groot-api-key-2024" -d "{\"message\":\"Hello\", \"unrestricted\":true}"
```

## Troubleshooting

If you encounter dependency conflicts:

1. Try creating a new virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. Install dependencies in the virtual environment:
   ```bash
   pip install -r requirements.txt
   ```

4. If issues persist, try installing packages one by one in the order listed above.
