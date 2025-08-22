from django.urls import path
from .api_views import (
    PrechatSubmissionListView,
    PrechatSubmissionDetailView,
    user_conversations
)

urlpatterns = [
    # GET /api/users/ - List all users
    path('users/', PrechatSubmissionListView.as_view(), name='user-list'),
    
    # GET /api/users/<id>/ - Get specific user details
    path('users/<int:pk>/', PrechatSubmissionDetailView.as_view(), name='user-detail'),
    
    # GET /api/users/<id>/conversations/ - Get user's chat conversations
    path('users/<int:pk>/conversations/', user_conversations, name='user-conversations'),
]
