# Use the official Go image as the builder
FROM golang:latest AS builder

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download all dependencies
RUN go mod download

# Copy the source code and the Sample folder into the container
COPY . .

# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -o drive-app .

# Start a new stage from scratch
FROM alpine:latest

# Set the Current Working Directory inside the container
WORKDIR /root/

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/drive-app .

# Copy the Sample folder into the container
COPY --from=builder /app/Sample ./Sample

# Expose port 8080
EXPOSE 8080

# Command to run the executable
CMD ["./drive-app"]
