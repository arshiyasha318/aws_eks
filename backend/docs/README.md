# API Documentation

This directory contains the API documentation for the Doctor Booking System.

## Accessing the API Documentation

1. **Local Development**:
   - Start the backend server
   - Open your browser and navigate to `http://localhost:8080/swagger`
   - This will redirect you to the Swagger UI interface

2. **Production**:
   - The Swagger UI is available at `/swagger` path of your backend server
   - Example: `https://your-api-domain.com/swagger`

## Updating the Documentation

The API documentation is generated from the `swagger.json` file in this directory. To update the documentation:

1. Update the `swagger.json` file with your API changes
2. The Swagger UI will automatically reflect the changes when you refresh the page

## API Base URL

- **Development**: `http://localhost:8080/api/v1`
- **Production**: `https://your-api-domain.com/api/v1`

## Authentication

Most endpoints require authentication. To authenticate:

1. Use the `/auth/login` endpoint to get a JWT token
2. Click the "Authorize" button in the Swagger UI
3. Enter your token in the format: `Bearer <your-jwt-token>`
4. Click "Authorize" to enable authenticated requests

## Models

Refer to the "Schemas" section in the Swagger UI for detailed information about request and response models.
