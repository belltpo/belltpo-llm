#!/usr/bin/env python
import os
import sys
import django
from django.utils import timezone
import uuid

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prechat_widget.settings')
django.setup()

from prechat.models import PrechatSubmission, ChatConversation

# Clear existing data
PrechatSubmission.objects.all().delete()
ChatConversation.objects.all().delete()

# Create simple test users with mobile numbers
users = [
    {'name': 'John Doe', 'email': 'john@example.com', 'mobile': '+1234567890', 'region': 'US', 'session_token': str(uuid.uuid4())},
    {'name': 'Jane Smith', 'email': 'jane@example.com', 'mobile': '+9876543210', 'region': 'UK', 'session_token': str(uuid.uuid4())},
    {'name': 'Bob Wilson', 'email': 'bob@example.com', 'mobile': '+5555555555', 'region': 'CA', 'session_token': str(uuid.uuid4())},
]

for user in users:
    submission = PrechatSubmission.objects.create(**user)
    print(f"Created: {submission.name} - {submission.email} - {submission.mobile}")
    
    # Add some conversations
    ChatConversation.objects.create(submission=submission, role='user', message='Hello, I need help')
    ChatConversation.objects.create(submission=submission, role='ai', message='Hi! How can I help you today?')

print(f"\nTotal users created: {PrechatSubmission.objects.count()}")
print(f"Total conversations created: {ChatConversation.objects.count()}")

# Verify data
for user in PrechatSubmission.objects.all():
    print(f"User: {user.name}, Mobile: {user.mobile}, Token: {user.session_token}")
