# Ticket QR Code Generator

This is a Python-based API for generating QR codes for movie tickets in the CineVibe application.

## Overview

The QR Code Generator API provides endpoints for generating QR codes that contain ticket information. These QR codes can be used for ticket validation at the cinema.

## Installation

1. Make sure you have Python 3.8+ installed
2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Starting the API

To start the QR Code Generator API:

1. Open a command prompt
2. Navigate to the qr_generator directory
3. Run the following command:
   ```
   python -m uvicorn qr_api:app --host 0.0.0.0 --port 3002
   ```
4. The API will be available at http://localhost:3002

## API Endpoints

### 1. Generate QR Code (JSON Response)

- **URL**: `/generate-qr`
- **Method**: POST
- **Request Body**:
  ```json
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
  ```
- **Response**:
  ```json
  {
    "qr_code": "base64_encoded_image_data",
    "ticket_data": {
      "movie": "Movie Title",
      "theater": "Theater Name",
      "seats": ["A1", "A2"],
      "date": "2023-05-15",
      "time": "18:30",
      "price": "300",
      "ticket_id": "123",
      "user_id": "456"
    }
  }
  ```

### 2. Generate QR Code (Image Response)

- **URL**: `/generate-qr-image`
- **Method**: POST
- **Request Body**: Same as `/generate-qr`
- **Response**: PNG image

## Integration with CineVibe

The QR Code Generator API is integrated with the CineVibe application in the following ways:

1. When a user books a ticket, the backend sends the ticket details to the QR Code Generator API
2. The generated QR code is included in the confirmation email sent to the user
3. The QR code is also displayed on the ticket page in the frontend
4. The QR code contains all the ticket information in JSON format

## Security Considerations

- The API should only be accessible from the backend server
- In a production environment, proper authentication should be implemented
- Sensitive information should be encrypted in the QR code

## Troubleshooting

If the QR code generation is not working:

1. Make sure the QR Code Generator API is running on http://localhost:3002
2. Check the console for any error messages
3. Verify that the ticket data is being sent correctly
4. Try restarting the API
