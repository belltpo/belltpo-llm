#!/bin/bash

# AnythingLLM Docker Build Script
set -e

echo "🚀 Building AnythingLLM Docker Container"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Set image name and tag
IMAGE_NAME="anythingllm"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

echo "📦 Building Docker image: ${FULL_IMAGE_NAME}"

# Build the Docker image
docker build -t ${FULL_IMAGE_NAME} .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo "📋 Image details:"
    docker images | grep ${IMAGE_NAME}
    
    echo ""
    echo "🎯 Next steps:"
    echo "1. Copy .env.docker to .env and configure your settings"
    echo "2. Run: docker-compose up -d"
    echo "3. Access AnythingLLM at http://localhost:3001"
    echo ""
    echo "🔧 Quick start commands:"
    echo "  cp .env.docker .env"
    echo "  docker-compose up -d"
    echo ""
else
    echo "❌ Docker build failed!"
    exit 1
fi
