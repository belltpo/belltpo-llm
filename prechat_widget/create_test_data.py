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

def create_test_data():
    """Create test data for prechat submissions and chat conversations"""
    
    # Create test prechat submissions
    test_users = [
        {
            'name': 'John Doe',
            'email': 'john.doe@example.com',
            'mobile': '+1234567890',
            'region': 'North America',
            'session_token': str(uuid.uuid4())
        },
        {
            'name': 'Jane Smith',
            'email': 'jane.smith@example.com',
            'mobile': '+1987654321',
            'region': 'Europe',
            'session_token': str(uuid.uuid4())
        },
        {
            'name': 'Mike Johnson',
            'email': 'mike.johnson@example.com',
            'mobile': '+1122334455',
            'region': 'Asia',
            'session_token': str(uuid.uuid4())
        }
    ]
    
    # Delete existing data first
    PrechatSubmission.objects.all().delete()
    ChatConversation.objects.all().delete()
    print("Cleared existing data")
    
    # Create prechat submissions
    submissions = []
    for user_data in test_users:
        submission = PrechatSubmission.objects.create(**user_data)
        print(f"Created prechat submission for {user_data['name']}")
        submissions.append(submission)
    
    # Create test chat conversations
    test_conversations = [
        # John Doe's conversation
        [
            {'role': 'user', 'message': 'Hello, I need help with my account'},
            {'role': 'ai', 'message': 'Hello John! I\'d be happy to help you with your account. What specific issue are you experiencing?'},
            {'role': 'user', 'message': 'I can\'t log in to my dashboard'},
            {'role': 'ai', 'message': 'I understand you\'re having trouble logging in. Let me help you troubleshoot this. Have you tried resetting your password?'},
        ],
        # Jane Smith's conversation
        [
            {'role': 'user', 'message': 'Hi, I have a question about pricing'},
            {'role': 'ai', 'message': 'Hi Jane! I\'m here to help with any pricing questions you have. What would you like to know?'},
            {'role': 'user', 'message': 'What are the different subscription tiers?'},
            {'role': 'ai', 'message': 'We offer three main subscription tiers: Basic ($9/month), Pro ($19/month), and Enterprise ($49/month). Each tier includes different features and usage limits.'},
        ],
        # Mike Johnson's conversation
        [
            {'role': 'user', 'message': 'I need technical support'},
            {'role': 'ai', 'message': 'Hello Mike! I\'m ready to provide technical support. What technical issue can I help you with today?'},
            {'role': 'user', 'message': 'The API is returning 500 errors'},
            {'role': 'ai', 'message': 'I see you\'re experiencing 500 errors with our API. This typically indicates a server-side issue. Let me check our system status and help you resolve this.'},
            {'role': 'user', 'message': 'It started happening this morning'},
            {'role': 'ai', 'message': 'Thank you for that information. I can see there was a brief service disruption this morning that has since been resolved. Please try your API calls again and let me know if you continue to experience issues.'},
        ]
    ]
    
    # Create chat conversations for each submission
    for i, submission in enumerate(submissions):
        if i < len(test_conversations):
            for msg_data in test_conversations[i]:
                conversation, created = ChatConversation.objects.get_or_create(
                    submission=submission,
                    role=msg_data['role'],
                    message=msg_data['message'],
                    defaults={'timestamp': timezone.now()}
                )
                if created:
                    print(f"Created conversation message for {submission.name}: {msg_data['role']}")
    
    print(f"\nTest data creation completed!")
    print(f"Total prechat submissions: {PrechatSubmission.objects.count()}")
    print(f"Total chat conversations: {ChatConversation.objects.count()}")

if __name__ == '__main__':
    create_test_data()
