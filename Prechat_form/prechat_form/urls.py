from django.urls import path, include
from . import views
from .admin_utils import export_data_view

app_name = 'prechat_form'

urlpatterns = [
    # Web views
    path('', views.prechat_form_view, name='form'),
    path('prechatform/', views.prechat_form_view, name='prechatform'),
    path('prechat/form/', views.prechat_form_view, name='prechat_form'),
    path('chat-redirect/', views.chat_redirect_view, name='chat_redirect'),
    path('error/', views.error_view, name='error'),
    
    # API endpoints
    path('api/prechat/submit/', views.PrechatFormSubmitView.as_view(), name='api_submit'),
    path('api/prechat/validate-session/', views.SessionValidationView.as_view(), name='api_validate_session'),
    path('api/prechat/initiate-chat/', views.ChatInitiationView.as_view(), name='api_initiate_chat'),
    path('api/health/', views.HealthCheckView.as_view(), name='api_health'),
    
    # Export endpoints
    path('export/<str:model_name>/<int:object_id>/<str:format>/', export_data_view, name='export_data'),
    path('export/<str:model_name>/<str:format>/', export_data_view, name='export_model'),
]
