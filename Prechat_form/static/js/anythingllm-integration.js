/**
 * AnythingLLM Integration Helper
 * This script helps integrate Django PreChat Form with AnythingLLM
 */

class AnythingLLMIntegration {
    constructor(config = {}) {
        this.djangoBaseUrl = config.djangoBaseUrl || 'http://localhost:8000';
        this.anythingLLMBaseUrl = config.anythingLLMBaseUrl || 'http://localhost:3001';
        this.defaultWorkspace = config.defaultWorkspace || 'default';
    }

    /**
     * Initialize the integration - call this in your AnythingLLM App.jsx
     */
    async initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const session = urlParams.get('session');

        if (token || session) {
            return await this.validateSession(token || session);
        } else {
            this.redirectToForm();
            return false;
        }
    }

    /**
     * Validate Django session token
     */
    async validateSession(token) {
        try {
            const response = await fetch(`${this.djangoBaseUrl}/api/prechat/validate-session/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ session_token: token })
            });

            const data = await response.json();

            if (data.success) {
                // Store user context for chat
                this.setUserContext(data.data.user_info);
                console.log('✅ Django session validated:', data.data);
                return {
                    valid: true,
                    userInfo: data.data.user_info,
                    sessionData: data.data
                };
            } else {
                console.warn('❌ Session validation failed:', data.message);
                this.redirectToForm();
                return { valid: false, error: data.message };
            }
        } catch (error) {
            console.error('🔥 Error validating Django session:', error);
            this.redirectToForm();
            return { valid: false, error: error.message };
        }
    }

    /**
     * Redirect to Django form
     */
    redirectToForm() {
        const workspaceSlug = this.getWorkspaceSlug();
        const currentUrl = encodeURIComponent(window.location.href);
        const formUrl = `${this.djangoBaseUrl}/?workspace=${workspaceSlug}&return_url=${currentUrl}`;
        
        console.log('🔄 Redirecting to Django form:', formUrl);
        window.location.href = formUrl;
    }

    /**
     * Extract workspace slug from current URL
     */
    getWorkspaceSlug() {
        const pathParts = window.location.pathname.split('/');
        const embedIndex = pathParts.indexOf('embed');
        
        if (embedIndex !== -1 && pathParts[embedIndex + 1]) {
            return pathParts[embedIndex + 1];
        }
        
        return this.defaultWorkspace;
    }

    /**
     * Set user context for chat interface
     */
    setUserContext(userInfo) {
        // Store in sessionStorage for chat interface
        sessionStorage.setItem('django_user_context', JSON.stringify(userInfo));
        
        // Create hidden div with user context for chat components
        const existingContext = document.getElementById('django-user-context');
        if (existingContext) {
            existingContext.remove();
        }

        const userContextDiv = document.createElement('div');
        userContextDiv.id = 'django-user-context';
        userContextDiv.style.display = 'none';
        userContextDiv.setAttribute('data-user-info', JSON.stringify(userInfo));
        document.body.appendChild(userContextDiv);

        // Dispatch custom event for chat components
        window.dispatchEvent(new CustomEvent('djangoUserContextReady', {
            detail: { userInfo }
        }));
    }

    /**
     * Get stored user context
     */
    getUserContext() {
        const stored = sessionStorage.getItem('django_user_context');
        return stored ? JSON.parse(stored) : null;
    }

    /**
     * Send message with user context to chat API
     */
    async sendMessageWithContext(message, chatEndpoint) {
        const userContext = this.getUserContext();
        
        const messageData = {
            message,
            userContext,
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch(chatEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData)
            });

            return await response.json();
        } catch (error) {
            console.error('Error sending message with context:', error);
            throw error;
        }
    }
}

// Export for use in AnythingLLM
window.AnythingLLMIntegration = AnythingLLMIntegration;

// Auto-initialize if in iframe or embed context
if (window.location.pathname.includes('/embed/') || window.parent !== window) {
    const integration = new AnythingLLMIntegration();
    
    // Make available globally
    window.djangoIntegration = integration;
    
    // Auto-initialize
    document.addEventListener('DOMContentLoaded', () => {
        integration.initialize().then(result => {
            if (result && result.valid) {
                console.log('🚀 Django integration initialized successfully');
            }
        });
    });
}
