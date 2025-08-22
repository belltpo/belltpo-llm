from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from .models import PrechatSubmission, ChatConversation
from .serializers import (
    PrechatSubmissionSerializer, 
    PrechatSubmissionListSerializer, 
    ChatConversationSerializer
)


class PrechatSubmissionListView(generics.ListAPIView):
    """
    GET /api/users/ - Return list of all PrechatSubmission records
    """
    queryset = PrechatSubmission.objects.all().order_by('-created_at')
    serializer_class = PrechatSubmissionListSerializer


class PrechatSubmissionDetailView(generics.RetrieveAPIView):
    """
    GET /api/users/<id>/ - Return details of a specific PrechatSubmission
    """
    queryset = PrechatSubmission.objects.all()
    serializer_class = PrechatSubmissionSerializer


@api_view(['GET'])
def user_conversations(request, pk):
    """
    GET /api/users/<id>/conversations/ - Return all ChatConversation records for that user
    """
    try:
        submission = get_object_or_404(PrechatSubmission, pk=pk)
        conversations = ChatConversation.objects.filter(submission=submission).order_by('timestamp')
        serializer = ChatConversationSerializer(conversations, many=True)
        
        return Response({
            'user': {
                'id': submission.id,
                'name': submission.name,
                'email': submission.email
            },
            'conversations': serializer.data,
            'total_conversations': conversations.count()
        })
    except PrechatSubmission.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
