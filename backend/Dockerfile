# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod and sum files
COPY go.mod go.sum ./


# Download all dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/main .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app/

# Copy the binary from builder
COPY --from=builder /app/main /usr/local/bin/main

# Copy the .env file
COPY --from=builder /app/.env .

# Copy the docs directory for Swagger UI
COPY --from=builder /app/docs /app/docs

# Make the binary executable
RUN chmod +x /usr/local/bin/main

# Expose port
EXPOSE 8080

# Command to run the executable
CMD ["main"]
