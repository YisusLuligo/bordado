"""
Django settings MEJORADO para backend project - Optimizado para PyInstaller
VERSIÓN CORREGIDA que soluciona problemas de conexión en ejecutables
"""

from pathlib import Path
import os
import sys
import logging

# =========================================
# DETECCIÓN DE ENTORNO MEJORADA
# =========================================

def detect_environment():
    """Detectar el entorno de ejecución con mayor precisión"""
    is_frozen = getattr(sys, 'frozen', False)
    is_bundle = getattr(sys, '_MEIPASS', False)
    
    if is_frozen and is_bundle:
        # Estamos en PyInstaller
        base_dir = Path(sys._MEIPASS)
        executable_dir = Path(sys.executable).parent
        work_dir = Path.home() / 'Documents' / 'DotacionesYazz'
        
        # Asegurar que el directorio de trabajo existe
        work_dir.mkdir(parents=True, exist_ok=True)
        
        return {
            'is_exe': True,
            'base_dir': base_dir,
            'executable_dir': executable_dir,
            'work_dir': work_dir,
            'current_dir': work_dir
        }
    else:
        # Desarrollo normal
        base_dir = Path(__file__).resolve().parent.parent
        return {
            'is_exe': False,
            'base_dir': base_dir,
            'executable_dir': base_dir,
            'work_dir': base_dir,
            'current_dir': base_dir
        }

# Configurar entorno
ENV = detect_environment()
BASE_DIR = ENV['current_dir']

# Configurar logging temprano
if ENV['is_exe']:
    log_file = ENV['work_dir'] / 'django_debug.log'
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    logger = logging.getLogger(__name__)
    logger.info(f"Django iniciando en modo ejecutable")
    logger.info(f"BASE_DIR: {BASE_DIR}")
    logger.info(f"WORK_DIR: {ENV['work_dir']}")

# =========================================
# CONFIGURACIÓN BÁSICA DE DJANGO
# =========================================

SECRET_KEY = 'django-insecure-r9*i-82&+gg5@^obar&$^6m+xhsy6d%!d98csr*t46en9$$z2h'

# En ejecutable, usar DEBUG=False para mejor rendimiento
DEBUG = not ENV['is_exe']

# Hosts permitidos más permisivos para ejecutables
ALLOWED_HOSTS = [
    '127.0.0.1', 
    'localhost', 
    '0.0.0.0',
    '[::1]',  # IPv6 localhost
]

# =========================================
# APLICACIONES INSTALADAS
# =========================================

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

# =========================================
# MIDDLEWARE
# =========================================

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

# =========================================
# CONFIGURACIÓN DE TEMPLATES
# =========================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# =========================================
# CONFIGURACIÓN DE BASE DE DATOS MEJORADA
# =========================================

def setup_database():
    """Configurar base de datos con mejor manejo de rutas"""
    if ENV['is_exe']:
        # En ejecutable: BD en el directorio de trabajo
        db_path = ENV['work_dir'] / 'dotaciones_yazz.db'
        
        # Crear directorio padre si no existe
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Log para debugging
        if 'logger' in globals():
            logger.info(f"Base de datos en: {db_path}")
    else:
        # En desarrollo: BD en el proyecto
        db_path = ENV['base_dir'] / 'db.sqlite3'
    
    return {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': str(db_path),  # Convertir a string
            'OPTIONS': {
                'timeout': 30,  # Aumentar timeout
                'init_command': "PRAGMA foreign_keys=1;",
            }
        }
    }

DATABASES = setup_database()

# =========================================
# VALIDADORES DE CONTRASEÑA
# =========================================

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

# =========================================
# INTERNACIONALIZACIÓN
# =========================================

LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

# =========================================
# ARCHIVOS ESTÁTICOS MEJORADOS
# =========================================

def setup_static_files():
    """Configurar archivos estáticos según el entorno"""
    static_url = '/static/'
    
    if ENV['is_exe']:
        # En ejecutable
        static_root = ENV['work_dir'] / 'staticfiles'
        media_root = ENV['work_dir'] / 'media'
        
        # Crear directorios
        static_root.mkdir(exist_ok=True)
        media_root.mkdir(exist_ok=True)
        
        return {
            'STATIC_URL': static_url,
            'STATIC_ROOT': str(static_root),
            'MEDIA_URL': '/media/',
            'MEDIA_ROOT': str(media_root),
            'STATICFILES_DIRS': []  # Vacío en ejecutable
        }
    else:
        # En desarrollo
        static_root = ENV['base_dir'] / 'staticfiles'
        media_root = ENV['base_dir'] / 'media'
        
        return {
            'STATIC_URL': static_url,
            'STATIC_ROOT': str(static_root),
            'MEDIA_URL': '/media/',
            'MEDIA_ROOT': str(media_root),
            'STATICFILES_DIRS': []
        }

# Aplicar configuración de archivos estáticos
STATIC_CONFIG = setup_static_files()
STATIC_URL = STATIC_CONFIG['STATIC_URL']
STATIC_ROOT = STATIC_CONFIG['STATIC_ROOT']
MEDIA_URL = STATIC_CONFIG['MEDIA_URL']
MEDIA_ROOT = STATIC_CONFIG['MEDIA_ROOT']
STATICFILES_DIRS = STATIC_CONFIG['STATICFILES_DIRS']

# =========================================
# REST FRAMEWORK
# =========================================

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100
}

# =========================================
# CONFIGURACIÓN CORS MEJORADA
# =========================================

# CORS más permisivo para ejecutables
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3001",  # Puerto alternativo
    "http://127.0.0.1:3001",  # Puerto alternativo
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost:\d+$",
    r"^http://127\.0\.0\.1:\d+$",
]

# =========================================
# CONFIGURACIÓN DE LOGGING MEJORADA
# =========================================

def setup_logging():
    """Configurar logging según el entorno"""
    if ENV['is_exe']:
        log_dir = ENV['work_dir'] / 'logs'
        log_dir.mkdir(exist_ok=True)
        
        return {
            'version': 1,
            'disable_existing_loggers': False,
            'formatters': {
                'verbose': {
                    'format': '{levelname} {asctime} {module} {message}',
                    'style': '{',
                },
                'simple': {
                    'format': '{levelname} {message}',
                    'style': '{',
                },
            },
            'handlers': {
                'file': {
                    'level': 'INFO',
                    'class': 'logging.FileHandler',
                    'filename': str(log_dir / 'django.log'),
                    'formatter': 'verbose',
                },
                'error_file': {
                    'level': 'ERROR',
                    'class': 'logging.FileHandler',
                    'filename': str(log_dir / 'django_errors.log'),
                    'formatter': 'verbose',
                },
                'console': {
                    'level': 'INFO',
                    'class': 'logging.StreamHandler',
                    'formatter': 'simple',
                },
            },
            'loggers': {
                'django': {
                    'handlers': ['file', 'console'],
                    'level': 'INFO',
                    'propagate': False,
                },
                'django.request': {
                    'handlers': ['error_file', 'console'],
                    'level': 'ERROR',
                    'propagate': False,
                },
                'inventario': {
                    'handlers': ['file', 'console'],
                    'level': 'INFO',
                    'propagate': False,
                },
                'clientes': {
                    'handlers': ['file', 'console'],
                    'level': 'INFO',
                    'propagate': False,
                },
                'pedidos': {
                    'handlers': ['file', 'console'],
                    'level': 'INFO',
                    'propagate': False,
                },
                'finanzas': {
                    'handlers': ['file', 'console'],
                    'level': 'INFO',
                    'propagate': False,
                },
            },
        }
    else:
        # Configuración simple para desarrollo
        return {
            'version': 1,
            'disable_existing_loggers': False,
            'handlers': {
                'console': {
                    'level': 'DEBUG',
                    'class': 'logging.StreamHandler',
                },
            },
            'loggers': {
                'django': {
                    'handlers': ['console'],
                    'level': 'INFO',
                    'propagate': True,
                },
            },
        }

LOGGING = setup_logging()

# =========================================
# CONFIGURACIÓN ESPECÍFICA PARA PYINSTALLER
# =========================================

if ENV['is_exe']:
    # Crear directorios necesarios al inicio
    try:
        Path(MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
        Path(STATIC_ROOT).mkdir(parents=True, exist_ok=True)
        
        # Log de configuración
        if 'logger' in globals():
            logger.info(f"Configuración PyInstaller aplicada:")
            logger.info(f"  BASE_DIR: {BASE_DIR}")
            logger.info(f"  WORK_DIR: {ENV['work_dir']}")
            logger.info(f"  DB_PATH: {DATABASES['default']['NAME']}")
            logger.info(f"  MEDIA_ROOT: {MEDIA_ROOT}")
            logger.info(f"  STATIC_ROOT: {STATIC_ROOT}")
            logger.info(f"  DEBUG: {DEBUG}")
        
        print(f"[PYINSTALLER] Modo ejecutable activado")
        print(f"[PYINSTALLER] Directorio de trabajo: {ENV['work_dir']}")
        print(f"[PYINSTALLER] Base de datos: {DATABASES['default']['NAME']}")
        
    except Exception as e:
        print(f"[PYINSTALLER] Error creando directorios: {e}")

# =========================================
# CONFIGURACIONES ADICIONALES DE SEGURIDAD
# =========================================

# Para ejecutables, relajar algunas restricciones de seguridad
if ENV['is_exe']:
    # Permitir todos los hosts en caso de problemas de red
    ALLOWED_HOSTS = ['*']
    
    # Desactivar algunas verificaciones de seguridad que pueden causar problemas
    SECURE_CROSS_ORIGIN_OPENER_POLICY = None
    SECURE_CONTENT_TYPE_NOSNIFF = False
    
    # Configuración de sesiones más permisiva
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    
    # Timeout de base de datos más largo
    DATABASES['default']['OPTIONS']['timeout'] = 60

# =========================================
# CONFIGURACIÓN DE CACHE
# =========================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'dotaciones-yazz-cache',
        'TIMEOUT': 300,
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    }
}

# =========================================
# CONFIGURACIÓN DE ARCHIVOS DE MEDIOS
# =========================================

# Configuración para manejo de archivos subidos
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# =========================================
# CONFIGURACIÓN DE TIMEZONE
# =========================================

USE_TZ = True

# =========================================
# CONFIGURACIÓN DE CAMPO AUTO
# =========================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =========================================
# CONFIGURACIÓN DE DESARROLLO/PRODUCCIÓN
# =========================================

if DEBUG:
    # Configuraciones de desarrollo
    INTERNAL_IPS = ['127.0.0.1', 'localhost']
    
    # Más información en errores de desarrollo
    LOGGING['loggers']['django']['level'] = 'DEBUG'
else:
    # Configuraciones de producción/ejecutable
    # Desactivar algunas características de desarrollo
    TEMPLATE_DEBUG = False
    
    # Configuración de seguridad más estricta
    X_FRAME_OPTIONS = 'DENY'
    SECURE_BROWSER_XSS_FILTER = True

# =========================================
# CONFIGURACIÓN FINAL
# =========================================

# Asegurar que todas las rutas sean strings
STATIC_ROOT = str(STATIC_ROOT) if STATIC_ROOT else None
MEDIA_ROOT = str(MEDIA_ROOT) if MEDIA_ROOT else None

# Configuración adicional para mejorar el rendimiento en ejecutables
if ENV['is_exe']:
    # Configuración de base de datos optimizada
    DATABASES['default']['OPTIONS'].update({
        'init_command': "PRAGMA foreign_keys=1; PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;",
        'timeout': 60,
    })
    
    # Configuración de cache más agresiva
    CACHES['default']['TIMEOUT'] = 3600  # 1 hora
    
    print(f"[PYINSTALLER] Configuración completada exitosamente")
    print(f"[PYINSTALLER] Django Debug: {DEBUG}")
    print(f"[PYINSTALLER] Base de datos: SQLite en {DATABASES['default']['NAME']}")
    print(f"[PYINSTALLER] Archivos estáticos: {STATIC_ROOT}")
    print(f"[PYINSTALLER] Archivos de medios: {MEDIA_ROOT}")