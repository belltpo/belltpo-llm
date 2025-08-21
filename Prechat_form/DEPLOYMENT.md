# Deployment Guide

## Quick Start

### 1. Local Development Setup

```bash
# Clone and navigate to project
cd c:\Users\Gokul\Documents\Prechat_form

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
copy .env.example .env
# Edit .env with your settings

# Database setup
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### 2. AnythingLLM Integration

#### Option A: Replace PreChatForm Component

Modify your AnythingLLM embed widget:

```javascript
// In your AnythingLLM embed/src/App.jsx
// Replace the PreChatForm logic with:

useEffect(() => {
  // Check for Django token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    // Validate token with Django backend
    validateDjangoToken(token).then(isValid => {
      if (isValid) {
        setHasSubmitted(true);
        // Initialize chat with token context
      } else {
        // Redirect to Django form
        window.location.href = 'http://localhost:8000/?workspace=' + workspaceSlug;
      }
    });
  } else {
    // Redirect to Django form
    window.location.href = 'http://localhost:8000/?workspace=' + workspaceSlug;
  }
}, []);

async function validateDjangoToken(token) {
  try {
    const response = await fetch('http://localhost:8000/api/prechat/validate-session/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_token: token })
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}
```

#### Option B: API Integration

Keep AnythingLLM form but send data to Django:

```javascript
// In your existing PreChatForm component
const handleSubmit = async (formData) => {
  try {
    const response = await fetch('http://localhost:8000/api/prechat/submit/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    if (result.success) {
      // Use Django session token
      setSessionToken(result.data.session_token);
      setHasSubmitted(true);
    }
  } catch (error) {
    console.error('Form submission failed:', error);
  }
};
```

## Production Deployment

### 1. Environment Configuration

```env
# Production .env
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# PostgreSQL Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=prechat_production
DB_USER=prechat_user
DB_PASSWORD=secure-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS for production
CORS_ALLOWED_ORIGINS=https://youranythingllm.com,https://www.youranythingllm.com

# AnythingLLM
ANYTHINGLLM_BASE_URL=https://youranythingllm.com
ANYTHINGLLM_API_KEY=your-production-api-key

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
```

### 2. Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.9-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "prechat_project.wsgi:application"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
    depends_on:
      - db
      - redis
    volumes:
      - static_volume:/app/staticfiles

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: prechat_production
      POSTGRES_USER: prechat_user
      POSTGRES_PASSWORD: secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - static_volume:/app/staticfiles
    depends_on:
      - web

volumes:
  postgres_data:
  static_volume:
```

### 3. Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream django {
        server web:8000;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    server {
        listen 443 ssl;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

        location /static/ {
            alias /app/staticfiles/;
        }

        location / {
            proxy_pass http://django;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Testing Integration

### 1. Test Form Submission

```bash
curl -X POST http://localhost:8000/api/prechat/submit/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "Test message"
  }'
```

### 2. Test Session Validation

```bash
curl -X POST http://localhost:8000/api/prechat/validate-session/ \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "your-session-token-here"
  }'
```

### 3. Integration Flow Test

1. Visit `http://localhost:8000/`
2. Fill out the form
3. Submit and verify redirect
4. Check Django admin for created records
5. Verify JWT token in chat URL

## Monitoring & Maintenance

### 1. Health Checks

```bash
# API health check
curl http://localhost:8000/api/health/

# Database check
python manage.py check --database default

# Run tests
python manage.py test
```

### 2. Log Monitoring

Check integration logs in Django admin:
- Navigate to `/admin/`
- Go to "Integration Logs"
- Monitor for errors or unusual activity

### 3. Performance Monitoring

```python
# Add to settings.py for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/prechat.log',
        },
    },
    'loggers': {
        'prechat_form': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   ```bash
   # Check CORS settings
   python manage.py shell
   >>> from django.conf import settings
   >>> print(settings.CORS_ALLOWED_ORIGINS)
   ```

2. **Database Connection**
   ```bash
   python manage.py dbshell
   ```

3. **Redis Connection**
   ```bash
   python manage.py shell
   >>> from django.core.cache import cache
   >>> cache.set('test', 'value')
   >>> print(cache.get('test'))
   ```

4. **JWT Token Issues**
   ```bash
   python manage.py shell
   >>> from prechat_form.utils import JWTManager
   >>> # Test token generation and validation
   ```

### Debug Commands

```bash
# Check migrations
python manage.py showmigrations

# Validate models
python manage.py check

# Test email configuration
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test', 'Message', 'from@example.com', ['to@example.com'])

# Clear cache
python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()
```

## Security Checklist

- [ ] HTTPS enabled in production
- [ ] Strong SECRET_KEY and JWT_SECRET_KEY
- [ ] Database credentials secured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Regular dependency updates
- [ ] Backup strategy implemented
- [ ] Log monitoring setup
- [ ] Error tracking configured
