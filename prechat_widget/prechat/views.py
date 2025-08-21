from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .models import PrechatSubmission

def prechat_form(request):
    """Render the prechat form for embedding in the widget"""
    return render(request, 'prechat/form.html')

@csrf_exempt
@require_http_methods(["POST"])
def submit_prechat(request):
    """Handle form submission and return user data"""
    try:
        data = json.loads(request.body)
        
        # Save to database
        submission = PrechatSubmission.objects.create(
            name=data.get('name'),
            email=data.get('email'),
            mobile=data.get('mobile'),
            region=data.get('region')
        )
        
        # Return success response
        return JsonResponse({
            'success': True,
            'message': 'Form submitted successfully',
            'user_data': {
                'name': submission.name,
                'email': submission.email,
                'mobile': submission.mobile,
                'region': submission.region
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)
