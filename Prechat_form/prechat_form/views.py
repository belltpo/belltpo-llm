from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.views.decorators.clickjacking import xframe_options_sameorigin
import json
import jwt
import logging
from datetime import datetime, timedelta
from django.conf import settings

from .models import UserContact, ChatSession, FormSubmission, IntegrationLog
from .serializers import (
    PrechatFormSerializer, 
    ChatSessionSerializer, 
    SessionValidationSerializer,
    ChatInitiationSerializer
)
from .utils import SessionManager, JWTManager, RateLimitUtils

logger = logging.getLogger(__name__)


@xframe_options_sameorigin
def prechat_form_view(request):
    """Render the prechat form page - allow iframe embedding"""
    workspace_slug = request.GET.get('workspace', 'default')
    return_url = request.GET.get('return_url', '')
    
    context = {
        'anythingllm_base_url': settings.ANYTHINGLLM_BASE_URL,
        'form_title': 'Start Your Chat',
        'form_subtitle': 'Please provide your details to begin the conversation',
        'workspace_slug': workspace_slug,
        'return_url': return_url
    }
    return render(request, 'prechat_form/form.html', context)


class PrechatFormSubmitView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Handle prechat form submission and create chat session"""
        
        # Get client IP for rate limiting
        client_ip = SessionManager.get_client_ip(request)
    
        
        # Check rate limiting
        if RateLimitUtils.is_rate_limited(client_ip):
            # Log rate limit attempt
            IntegrationLog.objects.create(
                level='warning',
                event_type='rate_limit_exceeded',
                message=f'Rate limit exceeded for IP: {client_ip}',
                ip_address=client_ip,
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'success': False,
                'message': 'Too many requests. Please try again later.',
                'error_code': 'RATE_LIMITED'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        try:
            # Validate form data
            serializer = PrechatFormSerializer(data=request.data)
        
            
            # Create form submission record
            form_submission = FormSubmission.objects.create(
                submitted_data=request.data,
                status='validation_error' if not serializer.is_valid() else 'success',
                validation_errors=serializer.errors if not serializer.is_valid() else None,
                ip_address=client_ip,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                referer=request.META.get('HTTP_REFERER', '')
            )
        
            
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': 'Form validation failed',
                    'errors': serializer.errors,
                    'error_code': 'VALIDATION_ERROR'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            validated_data = serializer.validated_data
        
            
            # Create or get user contact
            user_contact, created = UserContact.objects.get_or_create(
                email=validated_data['email'],
                defaults={
                    'name': validated_data['name'],
                    'phone': validated_data.get('phone', ''),
                    'country': validated_data.get('country', ''),
                    'message': validated_data.get('message', ''),
                    'ip_address': client_ip,
                    'user_agent': request.META.get('HTTP_USER_AGENT', '')
                }
            )
        
            
            # Update form submission with user contact
            form_submission.user_contact = user_contact
            form_submission.save()
        
            
            # If user exists, update their information
            if not created:
                user_contact.name = validated_data['name']
                user_contact.phone = validated_data.get('phone', user_contact.phone)
                user_contact.country = validated_data.get('country', user_contact.country)
                if validated_data.get('message'):
                    user_contact.message = validated_data['message']
                user_contact.save()
        
            
            # Create chat session
            workspace_slug = validated_data.get('workspace_slug', 'default')
            chat_session = SessionManager.create_chat_session(
                user_contact=user_contact,
                workspace_slug=workspace_slug,
                request=request
            )
        
            
            # Handle return URL for AnythingLLM integration
            return_url = request.data.get('return_url', '')
            if return_url:
                # Parse return URL and add session token
                from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
                parsed_url = urlparse(return_url)
                query_params = parse_qs(parsed_url.query)
                query_params['token'] = [chat_session.session_token]
                new_query = urlencode(query_params, doseq=True)
                chat_url = urlunparse((parsed_url.scheme, parsed_url.netloc, parsed_url.path, 
                                     parsed_url.params, new_query, parsed_url.fragment))
            else:
                chat_url = f"{settings.ANYTHINGLLM_BASE_URL}/embed/{workspace_slug}?token={chat_session.session_token}"

            
            # Prepare response data
            response_data = {
                'success': True,
                'message': 'Form submitted successfully',
                'data': {
                    'session_token': chat_session.session_token,
                    'jwt_token': chat_session.jwt_token,
                    'user_id': str(user_contact.id),
                    'chat_url': chat_url,
                    'expires_at': chat_session.expires_at.isoformat(),
                    'user_info': {
                        'name': user_contact.name,
                        'email': user_contact.email
                    }
                }
            }
        
            
            # Log successful submission
            IntegrationLog.objects.create(
                chat_session=chat_session,
                level='info',
                event_type='form_submitted',
                message=f'Prechat form submitted successfully for {user_contact.email}',
                data=response_data['data'],
                ip_address=client_ip,
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error processing prechat form: {str(e)}")
            
            # Log error
            IntegrationLog.objects.create(
                level='error',
                event_type='form_submission_error',
                message=f'Error processing prechat form: {str(e)}',
                data={'error': str(e), 'request_data': request.data},
                ip_address=client_ip,
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # Update form submission status
            if 'form_submission' in locals():
                form_submission.status = 'server_error'
                form_submission.save()
            
            return Response({
                'success': False,
                'message': 'An error occurred while processing your request',
                'error_code': 'SERVER_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SessionValidationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Validate chat session token"""
        
        serializer = SessionValidationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid request data',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        session_token = serializer.validated_data['session_token']
        
        try:
            chat_session, error_message = SessionManager.validate_session(session_token)
            
            if not chat_session:
                return Response({
                    'success': False,
                    'message': error_message,
                    'error_code': 'INVALID_SESSION'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Validate JWT token as well
            jwt_payload, jwt_error = JWTManager.validate_jwt_token(chat_session.jwt_token)
            
            if not jwt_payload:
                chat_session.status = 'expired'
                chat_session.save()
                
                return Response({
                    'success': False,
                    'message': jwt_error,
                    'error_code': 'TOKEN_EXPIRED'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Update session status to active
            if chat_session.status == 'pending':
                chat_session.status = 'active'
                chat_session.save()
            
            response_data = {
                'success': True,
                'message': 'Session is valid',
                'data': {
                    'session_id': str(chat_session.id),
                    'user_info': {
                        'name': chat_session.user_contact.name,
                        'email': chat_session.user_contact.email,
                        'user_id': str(chat_session.user_contact.id)
                    },
                    'workspace_slug': chat_session.workspace_slug,
                    'expires_at': chat_session.expires_at.isoformat(),
                    'status': chat_session.status
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error validating session: {str(e)}")
            
            return Response({
                'success': False,
                'message': 'An error occurred while validating session',
                'error_code': 'SERVER_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChatInitiationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Initiate chat with AnythingLLM using validated session"""
        
        session_token = request.data.get('session_token')
        if not session_token:
            return Response({
                'success': False,
                'message': 'Session token is required',
                'error_code': 'MISSING_TOKEN'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            chat_session, error_message = SessionManager.validate_session(session_token)
            
            if not chat_session:
                return Response({
                    'success': False,
                    'message': error_message,
                    'error_code': 'INVALID_SESSION'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Generate chat initiation URL
            workspace_slug = chat_session.workspace_slug or 'default'
            chat_url = f"{settings.ANYTHINGLLM_BASE_URL}/embed/{workspace_slug}"
            
            # Add JWT token as query parameter
            chat_url_with_token = f"{chat_url}?token={chat_session.jwt_token}"
            
            response_data = {
                'success': True,
                'message': 'Chat initiated successfully',
                'data': {
                    'chat_url': chat_url_with_token,
                    'session_id': str(chat_session.id),
                    'workspace_slug': workspace_slug,
                    'user_info': {
                        'name': chat_session.user_contact.name,
                        'email': chat_session.user_contact.email
                    }
                }
            }
            
            # Log chat initiation
            IntegrationLog.objects.create(
                chat_session=chat_session,
                level='info',
                event_type='chat_initiated',
                message=f'Chat initiated for user {chat_session.user_contact.email}',
                data=response_data['data'],
                ip_address=SessionManager.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error initiating chat: {str(e)}")
            
            return Response({
                'success': False,
                'message': 'An error occurred while initiating chat',
                'error_code': 'SERVER_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Health check endpoint"""
        return Response({
            'status': 'healthy',
            'service': 'Django PreChat Form API',
            'version': '1.0.0'
        }, status=status.HTTP_200_OK)


# Success page view
def chat_redirect_view(request):
    """Redirect to chat with session token"""
    session_token = request.GET.get('token')
    
    if not session_token:
        return render(request, 'prechat_form/error.html', {
            'error_message': 'Invalid or missing session token'
        })
    
    try:
        chat_session, error_message = SessionManager.validate_session(session_token)
        
        if not chat_session:
            return render(request, 'prechat_form/error.html', {
                'error_message': error_message
            })
        
        # Generate chat URL
        workspace_slug = chat_session.workspace_slug or 'default'
        chat_url = f"{settings.ANYTHINGLLM_BASE_URL}/embed/{workspace_slug}?token={chat_session.jwt_token}"
        
        context = {
            'chat_url': chat_url,
            'user_name': chat_session.user_contact.name,
            'workspace_slug': workspace_slug
        }
        
        return render(request, 'prechat_form/chat_redirect.html', context)
        
    except Exception as e:
        logger.error(f"Error in chat redirect: {str(e)}")
        return render(request, 'prechat_form/error.html', {
            'error_message': 'An error occurred while loading the chat'
        })


def error_view(request):
    """Generic error page view"""
    error_message = request.GET.get('message', 'An unexpected error occurred')
    error_code = request.GET.get('code', 'UNKNOWN_ERROR')
    
    context = {
        'error_message': error_message,
        'error_code': error_code,
        'show_retry': True
    }
    
    return render(request, 'prechat_form/error.html', context)
