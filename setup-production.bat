@echo off
echo ========================================
echo Production Deployment Guide
echo Domain: llm.belltpo.com
echo ========================================

echo.
echo STEP 1: Server Requirements
echo ========================
echo - Ubuntu 20.04+ or CentOS 8+ server
echo - Minimum 4GB RAM, 2 CPU cores
echo - 50GB+ storage space
echo - Docker and Docker Compose installed
echo - Port 80, 443, 3001, 9000 open
echo.

echo STEP 2: Domain Setup
echo ===================
echo 1. Point llm.belltpo.com A record to your server IP
echo 2. Ensure DNS propagation is complete
echo 3. Test: ping llm.belltpo.com
echo.

echo STEP 3: Server Setup Commands
echo ============================
echo Run these commands on your production server:
echo.
echo # Update system
echo sudo apt update && sudo apt upgrade -y
echo.
echo # Install Docker
echo curl -fsSL https://get.docker.com -o get-docker.sh
echo sudo sh get-docker.sh
echo sudo usermod -aG docker $USER
echo.
echo # Install Docker Compose
echo sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
echo sudo chmod +x /usr/local/bin/docker-compose
echo.
echo # Install Nginx and Certbot
echo sudo apt install nginx certbot python3-certbot-nginx -y
echo.

echo STEP 4: Upload Project Files
echo ===========================
echo 1. Create directory: mkdir -p /opt/anythingllm
echo 2. Upload your project files to /opt/anythingllm/
echo 3. Set permissions: sudo chown -R $USER:$USER /opt/anythingllm
echo.

echo STEP 5: Production Environment Setup
echo ===================================
echo Copy and edit the production files created:
echo - docker-compose.production.yml
echo - nginx.conf
echo - .env.production
echo.

echo STEP 6: SSL Certificate
echo ======================
echo sudo certbot --nginx -d llm.belltpo.com
echo.

echo STEP 7: Start Services
echo ====================
echo cd /opt/anythingllm
echo docker-compose -f docker-compose.production.yml up -d
echo.

echo STEP 8: Verify Deployment
echo ========================
echo - Check containers: docker ps
echo - Check logs: docker-compose logs -f
echo - Test URL: https://llm.belltpo.com
echo.

echo ========================================
echo Production files are being created...
echo ========================================

pause
