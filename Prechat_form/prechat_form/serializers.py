from rest_framework import serializers
from .models import UserContact, ChatSession, FormSubmission
from .utils import ValidationUtils


class UserContactSerializer(serializers.ModelSerializer):
    """Serializer for UserContact model"""
    
    class Meta:
        model = UserContact
        fields = ['id', 'name', 'email', 'phone', 'country', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate_email(self, value):
        """Validate email format"""
        if not ValidationUtils.validate_email(value):
            raise serializers.ValidationError("Invalid email format")
        return value.lower().strip()
    
    def validate_phone(self, value):
        """Validate phone number"""
        if value and not ValidationUtils.validate_phone(value):
            raise serializers.ValidationError("Invalid phone number format")
        return ValidationUtils.sanitize_input(value)
    
    def validate_name(self, value):
        """Validate and sanitize name"""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long")
        return ValidationUtils.sanitize_input(value, max_length=255)
    
    def validate_country(self, value):
        """Validate and sanitize country"""
        if value:
            return ValidationUtils.sanitize_input(value, max_length=100)
        return value
    
    def validate_message(self, value):
        """Validate and sanitize message"""
        if value:
            return ValidationUtils.sanitize_input(value, max_length=1000)
        return value


class PrechatFormSerializer(serializers.Serializer):
    """Serializer for prechat form submission"""
    
    name = serializers.CharField(max_length=255, required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, required=False, allow_blank=True)
    message = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    workspace_slug = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    def validate_email(self, value):
        """Validate email format"""
        if not ValidationUtils.validate_email(value):
            raise serializers.ValidationError("Invalid email format")
        return value.lower().strip()
    
    def validate_phone(self, value):
        """Validate phone number"""
        if value and not ValidationUtils.validate_phone(value):
            raise serializers.ValidationError("Invalid phone number format")
        return ValidationUtils.sanitize_input(value)
    
    def validate_name(self, value):
        """Validate and sanitize name"""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long")
        return ValidationUtils.sanitize_input(value, max_length=255)


class ChatSessionSerializer(serializers.ModelSerializer):
    """Serializer for ChatSession model"""
    
    user_contact = UserContactSerializer(read_only=True)
    
    class Meta:
        model = ChatSession
        fields = [
            'id', 'user_contact', 'session_token', 'status', 
            'workspace_slug', 'created_at', 'expires_at', 'last_activity'
        ]
        read_only_fields = ['id', 'session_token', 'created_at', 'expires_at', 'last_activity']


class SessionValidationSerializer(serializers.Serializer):
    """Serializer for session validation requests"""
    
    session_token = serializers.CharField(max_length=255, required=True)
    
    def validate_session_token(self, value):
        """Validate session token format"""
        if not value or len(value) < 10:
            raise serializers.ValidationError("Invalid session token format")
        return value.strip()


class ChatInitiationSerializer(serializers.Serializer):
    """Serializer for chat initiation response"""
    
    success = serializers.BooleanField()
    message = serializers.CharField()
    data = serializers.DictField(required=False)
    
    def to_representation(self, instance):
        """Custom representation for chat initiation response"""
        if isinstance(instance, dict):
            return instance
        return super().to_representation(instance)
