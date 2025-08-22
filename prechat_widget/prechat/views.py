from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import uuid
from .models import PrechatSubmission

def prechat_form(request):
    """Render the prechat form for embedding in the widget"""
    # Check if user already has session token
    session_token = request.GET.get('token')
    if session_token:
        try:
            submission = PrechatSubmission.objects.get(session_token=session_token)
            # User already exists, redirect to chat
            return render(request, 'prechat/redirect.html', {
                'user_data': {
                    'name': submission.name,
                    'email': submission.email,
                    'mobile': submission.mobile,
                    'region': submission.region,
                    'session_token': submission.session_token
                }
            })
        except PrechatSubmission.DoesNotExist:
            pass
    
    return render(request, 'prechat/form.html')

@csrf_exempt
@require_http_methods(["POST"])
def submit_prechat(request):
    """Handle form submission and return user data"""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        # Check if user already exists
        try:
            submission = PrechatSubmission.objects.get(email=email)
            # Update existing record
            submission.name = data.get('name')
            submission.mobile = data.get('mobile')
            submission.region = data.get('region')
            submission.save()
        except PrechatSubmission.DoesNotExist:
            # Create new record
            submission = PrechatSubmission.objects.create(
                name=data.get('name'),
                email=email,
                mobile=data.get('mobile'),
                region=data.get('region'),
                session_token=str(uuid.uuid4())
            )
        
        # Return success response with session token
        return JsonResponse({
            'success': True,
            'message': 'Form submitted successfully',
            'user_data': {
                'name': submission.name,
                'email': submission.email,
                'mobile': submission.mobile,
                'region': submission.region,
                'session_token': submission.session_token
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def check_user(request):
    """Check if user exists by email"""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        try:
            submission = PrechatSubmission.objects.get(email=email)
            return JsonResponse({
                'exists': True,
                'user_data': {
                    'name': submission.name,
                    'email': submission.email,
                    'mobile': submission.mobile,
                    'region': submission.region,
                    'session_token': submission.session_token
                }
            })
        except PrechatSubmission.DoesNotExist:
            return JsonResponse({'exists': False})
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)
