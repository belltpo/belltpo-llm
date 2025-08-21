from django.contrib import admin
from .models import PrechatSubmission

@admin.register(PrechatSubmission)
class PrechatSubmissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'mobile', 'region', 'created_at')
    list_filter = ('region', 'created_at')
    search_fields = ('name', 'email')
    readonly_fields = ('created_at',)
