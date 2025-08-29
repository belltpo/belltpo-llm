#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prechat_widget.settings')
django.setup()

from prechat.models import PrechatSubmission, ChatConversation

def check_data():
    """Check existing data in the database"""
    
    print("=== Prechat Submissions ===")
    submissions = PrechatSubmission.objects.all()
    print(f"Total prechat users: {submissions.count()}")
    
    for submission in submissions:
        print(f"ID: {submission.id}")
        print(f"Name: {submission.name}")
        print(f"Email: {submission.email}")
        print(f"Mobile: {submission.mobile}")
        print(f"Region: {submission.region}")
        print(f"Session Token: {submission.session_token}")
        print(f"Created: {submission.created_at}")
        print("-" * 50)
    
    print("\n=== Chat Conversations ===")
    conversations = ChatConversation.objects.all()
    print(f"Total conversations: {conversations.count()}")
    
    for conv in conversations:
        print(f"User: {conv.submission.name}")
        print(f"Role: {conv.role}")
        print(f"Message: {conv.message[:50]}...")
        print(f"Timestamp: {conv.timestamp}")
        print("-" * 30)

if __name__ == '__main__':
    check_data()
