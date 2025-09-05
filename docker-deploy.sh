#!/bin/bash

# AnythingLLM Docker Deployment Script
set -e

echo "🚀 Deploying AnythingLLM with Docker"
echo "===================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.docker .env
    echo "⚠️  Please edit .env file with your configuration before proceeding."
    echo "   Required: Set your OpenAI API key and other provider credentials."
    read -p "Press Enter after configuring .env file..."
fi

# Check if image exists, build if not
if ! docker images | grep -q "anythingllm"; then
    echo "📦 AnythingLLM image not found. Building..."
    docker build -t anythingllm:latest .
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Start the application
echo "🚀 Starting AnythingLLM..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ AnythingLLM is running!"
    echo ""
    echo "🌐 Access your application:"
    echo "   Frontend: http://localhost:3001"
    echo "   Collector API: http://localhost:8888"
    echo ""
    echo "📊 Service status:"
    docker-compose ps
    echo ""
    echo "📝 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
else
    echo "❌ Failed to start services. Check logs:"
    docker-compose logs
    exit 1
fi
