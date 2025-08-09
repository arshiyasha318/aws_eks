#!/bin/bash

# Set the API base URL
API_URL="http://localhost:8080/api/v1"

# Function to make API requests
make_request() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4
    
    echo "\nTesting $method $endpoint"
    echo "----------------------------------------"
    
    if [ -z "$token" ]; then
        if [ -z "$data" ]; then
            curl -X $method "$API_URL$endpoint" -i
        else
            curl -X $method "$API_URL$endpoint" -H "Content-Type: application/json" -d "$data" -i
        fi
    else
        if [ -z "$data" ]; then
            curl -X $method "$API_URL$endpoint" -H "Authorization: Bearer $token" -i
        else
            curl -X $method "$API_URL$endpoint" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "$data" -i
        fi
    fi
    
    echo "\n"
    sleep 1
}

# Test public endpoints
make_request "GET" "/health"

# Register test users
echo "Registering test users..."

# Register admin user
make_request "POST" "/auth/register" "" '{"name":"Admin User","email":"admin@example.com","password":"admin123","role":"admin"}'

# Register doctor user
make_request "POST" "/auth/register" "" '{"name":"Doctor User","email":"doctor@example.com","password":"doctor123","role":"doctor"}'

# Login as admin
ADMIN_TOKEN=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"admin123"}' | jq -r '.token')

# Login as doctor
DOCTOR_TOKEN=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"doctor@example.com","password":"doctor123"}' | jq -r '.token')

# Login as patient
PATIENT_TOKEN=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}' | jq -r '.token')

# Test admin endpoints
echo "Testing admin endpoints..."
make_request "GET" "/admin/users" "$ADMIN_TOKEN"

# Test doctor endpoints
echo "Testing doctor endpoints..."
make_request "GET" "/doctors/dashboard" "$DOCTOR_TOKEN"
make_request "GET" "/doctors/appointments" "$DOCTOR_TOKEN"

# Test patient endpoints
echo "Testing patient endpoints..."
make_request "GET" "/patients/doctors" "$PATIENT_TOKEN"
make_request "GET" "/patients/appointments" "$PATIENT_TOKEN"

# Test public doctor listing
make_request "GET" "/doctors" ""

# Test user profile
make_request "GET" "/users/profile" "$PATIENT_TOKEN"
