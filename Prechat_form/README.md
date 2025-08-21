# Django-AnythingLLM PreChat Form Integration

A comprehensive Django application that provides a secure, modern prechat form integration for AnythingLLM. This solution replaces the default AnythingLLM prechat form with a Django-hosted form that provides full control over form logic, validation, data persistence, and user session management.

## 🚀 Features

- **Modern UI**: Beautiful, responsive form with Tailwind CSS and smooth animations
- **Secure Authentication**: JWT-based token system for secure session management
- **Data Persistence**: Complete user contact information and chat session tracking
- **Rate Limiting**: Built-in protection against spam and abuse
- **Real-time Validation**: Client-side and server-side form validation
- **Session Management**: Secure token-based authentication between Django and AnythingLLM
- **Admin Interface**: Django admin for managing users and sessions
- **API Endpoints**: RESTful APIs for form submission and session validation
- **Comprehensive Logging**: Detailed integration logs for debugging and monitoring

## 📋 Requirements

- Python 3.8+
- Django 4.2+
- Redis (for caching and sessions)
- AnythingLLM instance

## 🛠️ Installation

### 1. Clone and Setup

```bash
cd c:\Users\Gokul\Documents\Prechat_form
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
copy .env.example .env
```

Edit `.env` with your specific configuration:

```env
# Django Configuration
SECRET_KEY=your-unique-secret-key-here
DEBUG=False  # Set to False in production
ALLOWED_HOSTS=yourdomain.com,localhost

# Database (PostgreSQL recommended for production)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=prechat_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# Redis Configuration
REDIS_URL=redis://localhost:6379/1

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_EXPIRATION_DELTA=3600

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://youranythingllm.com,http://localhost:3001

# AnythingLLM Integration
ANYTHINGLLM_BASE_URL=https://youranythingllm.com
ANYTHINGLLM_API_KEY=your-anythingllm-api-key
```

### 3. Database Setup

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 4. Static Files

```bash
python manage.py collectstatic
```

### 5. Run Development Server

```bash
python manage.py runserver
```

## 🔧 Configuration

### Django Settings

Key settings in `prechat_project/settings.py`:

- **CORS_ALLOWED_ORIGINS**: Add your AnythingLLM domain
- **JWT_EXPIRATION_DELTA**: Token expiration time (default: 1 hour)
- **ANYTHINGLLM_BASE_URL**: Your AnythingLLM instance URL
- **RATELIMIT_ENABLE**: Enable/disable rate limiting

### AnythingLLM Integration

To integrate with AnythingLLM, you'll need to modify the embed widget:

1. **Replace PreChatForm Component**: Redirect users to your Django form
2. **Handle JWT Tokens**: Accept and validate Django-generated tokens
3. **Session Management**: Use Django sessions for user context

## 📡 API Endpoints

### Form Submission
```http
POST /api/prechat/submit/
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "country": "US",
    "message": "Hello, I need help",
    "workspace_slug": "default"
}
```

### Session Validation
```http
POST /api/prechat/validate-session/
Content-Type: application/json

{
    "session_token": "session-token-here"
}
```

### Chat Initiation
```http
POST /api/prechat/initiate-chat/
Content-Type: application/json

{
    "session_token": "session-token-here"
}
```

### Health Check
```http
GET /api/health/
```

## 🔒 Security Features

- **CSRF Protection**: Django's built-in CSRF protection
- **Rate Limiting**: IP-based rate limiting (5 requests per 5 minutes)
- **JWT Tokens**: Secure, time-limited authentication tokens
- **Input Validation**: Comprehensive server-side validation
- **SQL Injection Protection**: Django ORM prevents SQL injection
- **XSS Protection**: Template auto-escaping and CSP headers

## 📊 Database Models

### UserContact
Stores user contact information from the prechat form.

### ChatSession
Tracks chat sessions and JWT tokens for AnythingLLM integration.

### FormSubmission
Logs all form submission attempts for analytics and debugging.

### IntegrationLog
Comprehensive logging of integration events and errors.

## 🎨 UI Components

The form includes:
- **Responsive Design**: Works on all device sizes
- **Modern Styling**: Tailwind CSS with custom animations
- **Real-time Validation**: Instant feedback on form fields
- **Loading States**: Visual feedback during form submission
- **Error Handling**: User-friendly error messages
- **Success Flow**: Smooth transition to chat interface

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**:
   ```env
   DEBUG=False
   SECRET_KEY=production-secret-key
   ALLOWED_HOSTS=yourdomain.com
   ```

2. **Database**: Use PostgreSQL for production
3. **Redis**: Configure Redis for caching and sessions
4. **Static Files**: Use WhiteNoise or CDN for static file serving
5. **SSL**: Enable HTTPS with proper SSL certificates
6. **Security Headers**: Configure security middleware

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["gunicorn", "prechat_project.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location /static/ {
        alias /path/to/staticfiles/;
    }
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔍 Monitoring

### Logging

The application provides comprehensive logging:
- Form submissions and validation errors
- Session creation and validation
- JWT token generation and validation
- Integration events with AnythingLLM
- Rate limiting events

### Admin Interface

Access the Django admin at `/admin/` to:
- View and manage user contacts
- Monitor chat sessions
- Review form submissions
- Check integration logs

## 🧪 Testing

Run the test suite:

```bash
python manage.py test
```

The test suite covers:
- Model functionality
- API endpoints
- JWT token management
- Form validation
- Session management

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure AnythingLLM domain is in `CORS_ALLOWED_ORIGINS`
2. **JWT Token Expired**: Check `JWT_EXPIRATION_DELTA` setting
3. **Rate Limiting**: Adjust rate limits in `utils.py`
4. **Database Connection**: Verify database settings in `.env`
5. **Redis Connection**: Ensure Redis is running and accessible

### Debug Mode

Enable debug mode for development:
```env
DEBUG=True
```

Check logs in the Django admin under "Integration Logs" for detailed error information.

## 📞 Support

For issues and questions:
1. Check the integration logs in Django admin
2. Review the troubleshooting section
3. Verify environment configuration
4. Test API endpoints individually

## 🔄 Integration Flow

1. **User Access**: User visits Django prechat form
2. **Form Submission**: User fills and submits form
3. **Validation**: Server validates and stores user data
4. **Session Creation**: Django creates chat session with JWT token
5. **Token Generation**: JWT token contains user context
6. **Redirect**: User redirected to AnythingLLM with token
7. **Chat Initiation**: AnythingLLM validates token and starts chat

## 📈 Performance

- **Caching**: Redis-based caching for sessions and rate limiting
- **Database Optimization**: Indexed fields for fast queries
- **Static Files**: Efficient static file serving with WhiteNoise
- **Async Ready**: Compatible with Django's async views

## 🔐 Security Best Practices

1. Use HTTPS in production
2. Regularly rotate JWT secret keys
3. Monitor rate limiting logs
4. Keep dependencies updated
5. Use strong database passwords
6. Configure proper CORS settings
7. Enable Django security middleware
