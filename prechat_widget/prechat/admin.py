from django.contrib import admin
from .models import PrechatSubmission, ChatConversation

@admin.register(PrechatSubmission)
class PrechatSubmissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'mobile', 'region', 'created_at')
    list_filter = ('region', 'created_at')
    search_fields = ('name', 'email')
    readonly_fields = ('created_at',)


@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    list_display = ('submission', 'role', 'message_preview', 'timestamp')
    list_filter = ('role', 'timestamp', 'submission')
    search_fields = ('message', 'submission__name', 'submission__email')
    readonly_fields = ('timestamp',)
    
    def message_preview(self, obj):
        return obj.message[:50] + "..." if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message Preview'
