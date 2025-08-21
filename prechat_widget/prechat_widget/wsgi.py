"""
WSGI config for prechat_widget project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prechat_widget.settings')

application = get_wsgi_application()
