from django.urls import path
from . import views

urlpatterns = [
    path('', views.prechat_form, name='prechat_form'),
    path('form/', views.prechat_form, name='prechat_form_alt'),
    path('submit/', views.submit_prechat, name='submit_prechat'),
    path('check-user/', views.check_user, name='check_user'),
]
