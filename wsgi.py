# api/school_social_aubrick/wsgi.py
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_social_aubrick.settings')

app = get_wsgi_application()  # <- Vercel usa 'app'
application = app             # (opcional, para compatibilidade)