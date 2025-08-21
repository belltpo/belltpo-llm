from django.db import models
from django.utils import timezone
import uuid


class UserContact(models.Model):
    """Model to store user contact information from prechat form"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'user_contacts'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.name} ({self.email})"


class ChatSession(models.Model):
    """Model to track chat sessions and integration with AnythingLLM"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_contact = models.ForeignKey(UserContact, on_delete=models.CASCADE, related_name='chat_sessions')
    
    # Session management
    session_token = models.CharField(max_length=255, unique=True)
    jwt_token = models.TextField()  # Store JWT token for AnythingLLM integration
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # AnythingLLM integration
    anythingllm_session_id = models.CharField(max_length=255, blank=True, null=True)
    workspace_slug = models.CharField(max_length=255, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    last_activity = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'chat_sessions'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Session {self.session_token[:8]} - {self.user_contact.name}"
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def mark_completed(self):
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()


class FormSubmission(models.Model):
    """Model to track form submission attempts and validation"""
    
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('validation_error', 'Validation Error'),
        ('rate_limited', 'Rate Limited'),
        ('server_error', 'Server Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_contact = models.ForeignKey(UserContact, on_delete=models.CASCADE, related_name='submissions', blank=True, null=True)
    
    # Submission data
    submitted_data = models.JSONField()  # Store raw form data
    validation_errors = models.JSONField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    
    # Request metadata
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    referer = models.URLField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'form_submissions'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Submission {self.id} - {self.status}"


class IntegrationLog(models.Model):
    """Model to log integration events with AnythingLLM"""
    
    LOG_LEVELS = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('debug', 'Debug'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat_session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='logs', blank=True, null=True)
    
    # Log details
    level = models.CharField(max_length=10, choices=LOG_LEVELS)
    event_type = models.CharField(max_length=100)  # e.g., 'token_generation', 'session_validation', 'chat_initiation'
    message = models.TextField()
    data = models.JSONField(blank=True, null=True)  # Additional context data
    
    # Request context
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    
    # Timestamp
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'integration_logs'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.level.upper()}: {self.event_type} - {self.message[:50]}"
