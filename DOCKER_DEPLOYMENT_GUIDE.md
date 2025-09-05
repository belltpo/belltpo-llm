# AnythingLLM Docker Deployment Guide

This guide provides step-by-step instructions to containerize and deploy your AnythingLLM project using Docker.

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- At least 4GB RAM available for the container
- 10GB free disk space

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)

**Windows:**
```cmd
docker-deploy.bat
```

**Linux/macOS:**
```bash
chmod +x docker-deploy.sh
./docker-deploy.sh
```

### Option 2: Manual Deployment

1. **Configure Environment**
   ```bash
   cp .env.docker .env
   # Edit .env with your API keys and settings
   ```

2. **Build and Deploy**
   ```bash
   docker-compose up -d
   ```

3. **Access Application**
   - Frontend: http://localhost:3001
   - Collector API: http://localhost:8888

## 🔧 Configuration

### Required Environment Variables

Edit your `.env` file with these essential settings:

```env
# LLM Provider (Required)
LLM_PROVIDER=openai
OPEN_AI_KEY=your-openai-api-key-here

# Security (Recommended)
JWT_SECRET=your-unique-jwt-secret
AUTH_TOKEN=your-auth-token

# Embedding Provider
EMBEDDING_ENGINE=openai
EMBEDDING_MODEL_PREF=text-embedding-ada-002
```

### Optional Configurations

```env
# Multi-user mode
MULTI_USER_MODE=true

# Vector Database (alternatives)
VECTOR_DB=pinecone
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX=your-index-name

# Speech-to-Text
WHISPER_PROVIDER=openai
WHISPER_MODEL_PREF=whisper-1

# Text-to-Speech
TTS_PROVIDER=elevenlabs
ELEVEN_LABS_API_KEY=your-elevenlabs-key
```

## 🏗️ Architecture

The Docker container includes:

- **Server**: Main API server (Port 3001)
- **Collector**: Document processing service (Port 8888)
- **Frontend**: React application (served by server)
- **Database**: SQLite database with Prisma ORM
- **Supervisor**: Process manager for multi-service coordination

## 📁 Volume Mounts

- `anythingllm_storage`: Persistent storage for documents, database, and cache
- `anythingllm_logs`: Application and supervisor logs

## 🛠️ Management Commands

### View Logs
```bash
docker-compose logs -f
docker-compose logs -f anythingllm  # Specific service
```

### Restart Services
```bash
docker-compose restart
```

### Stop Services
```bash
docker-compose down
```

### Update Application
```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

### Backup Data
```bash
docker run --rm -v anythingllm_storage:/data -v $(pwd):/backup alpine tar czf /backup/anythingllm-backup.tar.gz /data
```

### Restore Data
```bash
docker run --rm -v anythingllm_storage:/data -v $(pwd):/backup alpine tar xzf /backup/anythingllm-backup.tar.gz -C /
```

## 🔍 Troubleshooting

### Container Won't Start

1. **Check Docker Resources**
   ```bash
   docker system df
   docker system prune  # Clean up if needed
   ```

2. **Verify Environment File**
   ```bash
   cat .env | grep -v "^#" | grep -v "^$"
   ```

3. **Check Logs**
   ```bash
   docker-compose logs anythingllm
   ```

### Collector Service Issues

1. **Verify Collector Health**
   ```bash
   curl http://localhost:8888/
   ```

2. **Check Collector Logs**
   ```bash
   docker-compose exec anythingllm tail -f /var/log/supervisor/collector.out.log
   ```

### Database Issues

1. **Reset Database**
   ```bash
   docker-compose down
   docker volume rm anythingllm_storage
   docker-compose up -d
   ```

2. **Manual Database Migration**
   ```bash
   docker-compose exec anythingllm sh -c "cd /app/server && npx prisma migrate deploy"
   ```

### Performance Issues

1. **Increase Docker Resources**
   - Docker Desktop → Settings → Resources
   - Increase CPU and Memory allocation

2. **Monitor Resource Usage**
   ```bash
   docker stats anythingllm
   ```

## 🔐 Security Considerations

### Production Deployment

1. **Change Default Secrets**
   ```env
   JWT_SECRET=your-production-jwt-secret
   AUTH_TOKEN=your-production-auth-token
   ```

2. **Enable HTTPS** (with reverse proxy)
   ```yaml
   # docker-compose.override.yml
   services:
     anythingllm:
       environment:
         - HTTPS=true
         - SSL_CERT_PATH=/certs/cert.pem
         - SSL_KEY_PATH=/certs/key.pem
       volumes:
         - ./certs:/certs:ro
   ```

3. **Network Security**
   ```yaml
   # Restrict external access to collector
   services:
     anythingllm:
       ports:
         - "3001:3001"
         # Remove: - "8888:8888"
   ```

### Multi-User Setup

1. **Enable Multi-User Mode**
   ```env
   MULTI_USER_MODE=true
   ```

2. **Create Admin User**
   ```bash
   docker-compose exec anythingllm sh -c "cd /app/server && node scripts/create-admin.js"
   ```

## 📊 Monitoring

### Health Checks

The container includes built-in health checks:
```bash
docker-compose ps  # Shows health status
```

### Log Monitoring

```bash
# Real-time logs
docker-compose logs -f

# Specific service logs
docker-compose exec anythingllm tail -f /var/log/supervisor/server.out.log
docker-compose exec anythingllm tail -f /var/log/supervisor/collector.out.log
```

## 🔄 Updates and Maintenance

### Regular Maintenance

1. **Weekly**: Check logs for errors
2. **Monthly**: Update Docker images
3. **Quarterly**: Backup data and test restore

### Update Process

```bash
# 1. Backup current data
./backup-data.sh

# 2. Pull latest changes
git pull origin main

# 3. Rebuild and deploy
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 4. Verify deployment
curl http://localhost:3001/api/ping
```

## 🆘 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Change ports in docker-compose.yml |
| Out of disk space | Run `docker system prune -a` |
| Memory issues | Increase Docker memory limit |
| API key errors | Verify .env configuration |

### Getting Help

1. Check logs: `docker-compose logs -f`
2. Verify configuration: `cat .env`
3. Test connectivity: `curl http://localhost:3001/api/ping`
4. Check GitHub issues for similar problems

---

## 📝 Quick Reference

### Essential Commands
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Update
docker-compose pull && docker-compose up -d
```

### Important URLs
- Application: http://localhost:3001
- Collector API: http://localhost:8888
- Health Check: http://localhost:3001/api/ping

### File Locations
- Configuration: `.env`
- Compose: `docker-compose.yml`
- Data: Docker volume `anythingllm_storage`
- Logs: Docker volume `anythingllm_logs`
