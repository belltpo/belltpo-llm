from django.contrib import admin
from django.urls import path, reverse
from django.utils.html import format_html
from django.http import HttpResponseRedirect
from django.contrib.admin import AdminSite
from django.shortcuts import render
from .models import UserContact, ChatSession, FormSubmission, IntegrationLog
from .admin_utils import (
    DataExportMixin, 
    admin_dashboard, 
    bulk_export_view,
    get_admin_stats
)


class PrechatFormAdminSite(AdminSite):
    site_header = "PreChat Form Administration"
    site_title = "PreChat Admin"
    index_title = "Welcome to PreChat Form Administration"
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('dashboard/', admin_dashboard, name='admin_dashboard'),
            path('bulk-export/', bulk_export_view, name='bulk_export'),
        ]
        return custom_urls + urls
    
    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['stats'] = get_admin_stats()
        extra_context['dashboard_url'] = reverse('admin:admin_dashboard')
        extra_context['bulk_export_url'] = reverse('admin:bulk_export')
        return super().index(request, extra_context)


# Create custom admin site
admin_site = PrechatFormAdminSite(name='prechat_admin')


@admin.register(UserContact, site=admin_site)
class UserContactAdmin(admin.ModelAdmin, DataExportMixin):
    list_display = ('name', 'email', 'phone', 'country', 'created_at', 'export_actions')
    list_filter = ('country', 'created_at')
    search_fields = ('name', 'email', 'phone')
    readonly_fields = ('id', 'created_at', 'updated_at', 'ip_address', 'user_agent')
    ordering = ('-created_at',)
    list_per_page = 25
    
    actions = ['export_csv', 'export_excel', 'export_pdf', 'export_json']
    
    def export_actions(self, obj):
        return format_html(
            '<a class="button" href="{}">Export CSV</a> '
            '<a class="button" href="{}">Export Excel</a>',
            f"/admin/export/usercontact/{obj.id}/csv/",
            f"/admin/export/usercontact/{obj.id}/excel/"
        )
    export_actions.short_description = "Export"
    export_actions.allow_tags = True
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related()
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('name', 'email', 'phone', 'country', 'message')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at', 'ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ChatSession, site=admin_site)
class ChatSessionAdmin(admin.ModelAdmin, DataExportMixin):
    list_display = ('session_token_short', 'user_contact', 'status', 'workspace_slug', 'created_at', 'expires_at', 'session_actions')
    list_filter = ('status', 'workspace_slug', 'created_at', 'expires_at')
    search_fields = ('session_token', 'user_contact__name', 'user_contact__email')
    readonly_fields = ('id', 'session_token', 'jwt_token', 'created_at', 'last_activity')
    ordering = ('-created_at',)
    list_per_page = 25
    
    actions = ['export_csv', 'export_excel', 'export_pdf', 'export_json', 'mark_expired']
    
    def session_token_short(self, obj):
        return f"{obj.session_token[:8]}..."
    session_token_short.short_description = "Session Token"
    
    def session_actions(self, obj):
        actions = []
        if obj.status == 'active':
            actions.append(f'<span style="color: green;">●</span> Active')
        elif obj.status == 'expired':
            actions.append(f'<span style="color: red;">●</span> Expired')
        else:
            actions.append(f'<span style="color: orange;">●</span> {obj.status.title()}')
        
        return format_html(' '.join(actions))
    session_actions.short_description = "Status"
    session_actions.allow_tags = True
    
    def mark_expired(self, request, queryset):
        updated = queryset.update(status='expired')
        self.message_user(request, f'{updated} sessions marked as expired.')
    mark_expired.short_description = "Mark selected sessions as expired"
    
    fieldsets = (
        ('Session Information', {
            'fields': ('user_contact', 'session_token', 'status', 'workspace_slug')
        }),
        ('AnythingLLM Integration', {
            'fields': ('jwt_token', 'anythingllm_session_id'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at', 'last_activity', 'completed_at')
        }),
        ('Metadata', {
            'fields': ('id', 'ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
    )


@admin.register(FormSubmission, site=admin_site)
class FormSubmissionAdmin(admin.ModelAdmin, DataExportMixin):
    list_display = ('submission_id', 'user_contact', 'status', 'ip_address', 'created_at', 'submission_actions')
    list_filter = ('status', 'created_at')
    search_fields = ('user_contact__name', 'user_contact__email', 'ip_address')
    readonly_fields = ('id', 'created_at', 'submitted_data_formatted', 'validation_errors_formatted')
    ordering = ('-created_at',)
    list_per_page = 25
    
    actions = ['export_csv', 'export_excel', 'export_pdf', 'export_json']
    
    def submission_id(self, obj):
        return str(obj.id)[:8]
    submission_id.short_description = "ID"
    
    def submission_actions(self, obj):
        if obj.status == 'success':
            return format_html('<span style="color: green;">✓</span> Success')
        elif obj.status == 'validation_error':
            return format_html('<span style="color: orange;">⚠</span> Validation Error')
        else:
            return format_html('<span style="color: red;">✗</span> Error')
    submission_actions.short_description = "Result"
    submission_actions.allow_tags = True
    
    def submitted_data_formatted(self, obj):
        if obj.submitted_data:
            import json
            return format_html('<pre>{}</pre>', json.dumps(obj.submitted_data, indent=2))
        return "No data"
    submitted_data_formatted.short_description = "Submitted Data"
    
    def validation_errors_formatted(self, obj):
        if obj.validation_errors:
            import json
            return format_html('<pre style="color: red;">{}</pre>', json.dumps(obj.validation_errors, indent=2))
        return "No errors"
    validation_errors_formatted.short_description = "Validation Errors"
    
    fieldsets = (
        ('Submission Information', {
            'fields': ('user_contact', 'status', 'ip_address', 'user_agent', 'referer')
        }),
        ('Data', {
            'fields': ('submitted_data_formatted', 'validation_errors_formatted')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(IntegrationLog, site=admin_site)
class IntegrationLogAdmin(admin.ModelAdmin, DataExportMixin):
    list_display = ('level_colored', 'event_type', 'message_short', 'chat_session', 'created_at')
    list_filter = ('level', 'event_type', 'created_at')
    search_fields = ('event_type', 'message')
    readonly_fields = ('id', 'created_at', 'data_formatted')
    ordering = ('-created_at',)
    list_per_page = 50
    
    actions = ['export_csv', 'export_excel', 'export_pdf', 'export_json', 'clear_old_logs']
    
    def level_colored(self, obj):
        colors = {
            'error': 'red',
            'warning': 'orange', 
            'info': 'blue',
            'debug': 'gray'
        }
        color = colors.get(obj.level, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.level.upper()
        )
    level_colored.short_description = "Level"
    level_colored.allow_tags = True
    
    def message_short(self, obj):
        return obj.message[:100] + "..." if len(obj.message) > 100 else obj.message
    message_short.short_description = "Message"
    
    def data_formatted(self, obj):
        if obj.data:
            import json
            return format_html('<pre>{}</pre>', json.dumps(obj.data, indent=2))
        return "No additional data"
    data_formatted.short_description = "Additional Data"
    
    def clear_old_logs(self, request, queryset):
        from datetime import timedelta
        from django.utils import timezone
        
        old_date = timezone.now() - timedelta(days=30)
        old_logs = IntegrationLog.objects.filter(created_at__lt=old_date)
        count = old_logs.count()
        old_logs.delete()
        
        self.message_user(request, f'Cleared {count} logs older than 30 days.')
    clear_old_logs.short_description = "Clear logs older than 30 days"
    
    fieldsets = (
        ('Log Information', {
            'fields': ('level', 'event_type', 'message', 'chat_session')
        }),
        ('Additional Data', {
            'fields': ('data_formatted',),
            'classes': ('collapse',)
        }),
        ('Context', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        }),
    )


# Register models with default admin site as well
admin.site.register(UserContact, UserContactAdmin)
admin.site.register(ChatSession, ChatSessionAdmin)
admin.site.register(FormSubmission, FormSubmissionAdmin)
admin.site.register(IntegrationLog, IntegrationLogAdmin)
