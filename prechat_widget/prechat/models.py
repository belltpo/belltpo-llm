from django.db import models

class PrechatSubmission(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()  # Remove unique constraint to allow multiple submissions
    mobile = models.CharField(max_length=20)
    region = models.CharField(max_length=50)
    session_token = models.CharField(max_length=255, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.email}"
    
    class Meta:
        db_table = 'prechat_submissions'


class ChatConversation(models.Model):
    ROLE_CHOICES = (
        ("user", "User"),
        ("ai", "AI")
    )
    
    submission = models.ForeignKey(
        PrechatSubmission, 
        on_delete=models.CASCADE, 
        related_name="conversations"
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.submission.name} - {self.role}: {self.message[:50]}..."
    
    class Meta:
        ordering = ['timestamp']
