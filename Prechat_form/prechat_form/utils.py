import jwt
import secrets
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from .models import ChatSession, IntegrationLog


class JWTManager:
    """Utility class for JWT token management"""
    
    @staticmethod
    def generate_session_token():
        """Generate a unique session token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def create_jwt_token(user_contact, session_token, workspace_slug=None):
        """Create JWT token for AnythingLLM integration"""
        payload = {
            'user_id': str(user_contact.id),
            'session_token': session_token,
            'name': user_contact.name,
            'email': user_contact.email,
            'workspace_slug': workspace_slug,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(seconds=settings.JWT_EXPIRATION_DELTA)
        }
        
        token = jwt.encode(
            payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        
        return token
    
    @staticmethod
    def validate_jwt_token(token):
        """Validate and decode JWT token"""
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload, None
        except jwt.ExpiredSignatureError:
            return None, "Token has expired"
        except jwt.InvalidTokenError as e:
            return None, f"Invalid token: {str(e)}"


class SessionManager:
    """Utility class for session management"""
    
    @staticmethod
    def create_chat_session(user_contact, workspace_slug=None, request=None):
        """Create a new chat session with JWT token"""
        session_token = JWTManager.generate_session_token()
        jwt_token = JWTManager.create_jwt_token(user_contact, session_token, workspace_slug)
        
        # Set expiration time
        expires_at = timezone.now() + timedelta(seconds=settings.JWT_EXPIRATION_DELTA)
        
        # Extract request metadata
        ip_address = None
        user_agent = None
        if request:
            ip_address = SessionManager.get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        chat_session = ChatSession.objects.create(
            user_contact=user_contact,
            session_token=session_token,
            jwt_token=jwt_token,
            expires_at=expires_at,
            workspace_slug=workspace_slug,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Log session creation
        IntegrationLog.objects.create(
            chat_session=chat_session,
            level='info',
            event_type='session_created',
            message=f'Chat session created for user {user_contact.email}',
            data={
                'user_id': str(user_contact.id),
                'session_token': session_token,
                'workspace_slug': workspace_slug
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return chat_session
    
    @staticmethod
    def validate_session(session_token):
        """Validate session token and return session if valid"""
        try:
            chat_session = ChatSession.objects.get(
                session_token=session_token,
                status__in=['pending', 'active']
            )
            
            if chat_session.is_expired():
                chat_session.status = 'expired'
                chat_session.save()
                return None, "Session has expired"
            
            # Update last activity
            chat_session.last_activity = timezone.now()
            chat_session.save()
            
            return chat_session, None
            
        except ChatSession.DoesNotExist:
            return None, "Invalid session token"
    
    @staticmethod
    def get_client_ip(request):
        """Extract client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ValidationUtils:
    """Utility class for form validation"""
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_phone(phone):
        """Validate phone number format"""
        if not phone:
            return True  # Phone is optional
        
        import re
        # Remove all non-digit characters
        digits_only = re.sub(r'\D', '', phone)
        # Check if it has 10-15 digits
        return 10 <= len(digits_only) <= 15
    
    @staticmethod
    def sanitize_input(text, max_length=None):
        """Sanitize text input"""
        if not text:
            return text
        
        # Strip whitespace
        text = text.strip()
        
        # Truncate if max_length specified
        if max_length and len(text) > max_length:
            text = text[:max_length]
        
        return text


class RateLimitUtils:
    """Utility class for rate limiting"""
    
    @staticmethod
    def is_rate_limited(ip_address, limit=5, window=300):
        """Check if IP address is rate limited"""
        from django.core.cache import cache
        
        cache_key = f"rate_limit:{ip_address}"
        current_count = cache.get(cache_key, 0)
        
        if current_count >= limit:
            return True
        
        # Increment counter
        cache.set(cache_key, current_count + 1, window)
        return False
