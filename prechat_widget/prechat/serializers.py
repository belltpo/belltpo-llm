from rest_framework import serializers
from .models import PrechatSubmission, ChatConversation


class ChatConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatConversation
        fields = ['id', 'role', 'message', 'timestamp']


class PrechatSubmissionSerializer(serializers.ModelSerializer):
    conversations = ChatConversationSerializer(many=True, read_only=True)
    
    class Meta:
        model = PrechatSubmission
        fields = ['id', 'name', 'email', 'mobile', 'region', 'session_token', 'created_at', 'conversations']


class PrechatSubmissionListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list view without conversations"""
    class Meta:
        model = PrechatSubmission
        fields = ['id', 'name', 'email', 'region', 'created_at']
