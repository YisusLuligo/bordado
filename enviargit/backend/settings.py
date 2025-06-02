"""
Django settings for backend project - Optimizado para PyInstaller
"""

from pathlib import Path
import os
import sys

# Detectar si estamos en PyInstaller
if getattr(sys, 'frozen', False):
    # Estamos en PyInstaller
    BASE_DIR = Path(sys._MEIPASS)
    # Directorio donde está el ejecutable (para archivos persistentes)
    EXECUTABLE_DIR = Path(sys.executable).parent
else:
    # Desarrollo normal
    BASE_DIR = Path(__file__).resolve().parent.parent
    EXECUTABLE_DIR = BASE_DIR

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-r9*i-82&+gg5@^obar&$^6m+xhsy6d%!d98csr*t46en9$$z2h'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '0.0.0.0']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework', 
    'corsheaders',  
    'inventario',
    'clientes', 
    'pedidos',
    'finanzas',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Database - CONFIGURACIÓN MEJORADA PARA PYINSTALLER
if getattr(sys, 'frozen', False):
    # En PyInstaller: BD en el directorio del ejecutable (persistente)
    DB_PATH = EXECUTABLE_DIR / 'dotaciones_yazz.db'
else:
    # En desarrollo: BD en el proyecto
    DB_PATH = BASE_DIR / 'db.sqlite3'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': DB_PATH,
        'OPTIONS': {
            'timeout': 20,
        }
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'

if getattr(sys, 'frozen', False):
    # En PyInstaller: configuración especial para archivos estáticos
    STATIC_ROOT = EXECUTABLE_DIR / 'staticfiles'
    # ⭐ CORREGIDO: No usar STATICFILES_DIRS en PyInstaller
    # Django buscará archivos estáticos automáticamente en las apps
else:
    # En desarrollo
    STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
if getattr(sys, 'frozen', False):
    MEDIA_ROOT = EXECUTABLE_DIR / 'media'
else:
    MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Configuración para APIs REST
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# Configuración CORS (para conectar con React)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

CORS_ALLOW_ALL_ORIGINS = True

# Configuración de logging para PyInstaller
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': EXECUTABLE_DIR / 'django_errors.log' if getattr(sys, 'frozen', False) else BASE_DIR / 'django_errors.log',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}

# Configuración específica para PyInstaller
if getattr(sys, 'frozen', False):
    # Crear directorios necesarios
    os.makedirs(MEDIA_ROOT, exist_ok=True)
    os.makedirs(STATIC_ROOT, exist_ok=True)
    
    print(f"[PYINSTALLER] Modo ejecutable activado")
    print(f"[PYINSTALLER] BASE_DIR: {BASE_DIR}")
    print(f"[PYINSTALLER] EXECUTABLE_DIR: {EXECUTABLE_DIR}")
    print(f"[PYINSTALLER] DB_PATH: {DB_PATH}")
    print(f"[PYINSTALLER] MEDIA_ROOT: {MEDIA_ROOT}")