# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec CORREGIDO para Dotaciones Yazz
Incluye todas las dependencias necesarias para Django
"""

import os
import sys
from pathlib import Path

# =========================================
# RECOPILAR ARCHIVOS DE DATOS
# =========================================

def collect_data_files():
    """Recopilar archivos de datos necesarios"""
    datas = []
    
    # Archivos principales del proyecto
    essential_files = [
        ('manage.py', '.'),
        ('backend', 'backend'),
        ('inventario', 'inventario'),
        ('clientes', 'clientes'),
        ('pedidos', 'pedidos'),
        ('finanzas', 'finanzas'),
        ('frontend', 'frontend'),  # ⭐ AGREGADO
    ]
    
    for src, dst in essential_files:
        if os.path.exists(src):
            datas.append((src, dst))
            print(f"✅ Incluido: {src}")
        else:
            print(f"⚠️ No encontrado: {src}")
    
    # Archivos de Django
    try:
        import django
        django_dir = os.path.dirname(django.__file__)
        
        # Incluir templates y archivos estáticos de Django admin
        django_files = [
            (os.path.join(django_dir, 'contrib', 'admin', 'static'), 'django/contrib/admin/static'),
            (os.path.join(django_dir, 'contrib', 'admin', 'templates'), 'django/contrib/admin/templates'),
            (os.path.join(django_dir, 'conf'), 'django/conf'),
        ]
        
        for src, dst in django_files:
            if os.path.exists(src):
                datas.append((src, dst))
                print(f"✅ Django: {dst}")
        
    except ImportError:
        print("⚠️ Django no encontrado para archivos estáticos")
    
    # Base de datos inicial si existe
    for db_file in ['db.sqlite3', 'dotaciones_yazz.db']:
        if os.path.exists(db_file):
            datas.append((db_file, '.'))
            print(f"✅ BD inicial: {db_file}")
            break
    
    print(f"📁 Total archivos de datos: {len(datas)}")
    return datas

# =========================================
# IMPORTACIONES OCULTAS
# =========================================

def get_hidden_imports():
    """Obtener todas las importaciones ocultas necesarias"""
    hidden_imports = [
        # Django core
        'django',
        'django.conf',
        'django.core',
        'django.core.management',
        'django.core.management.base',
        'django.core.management.commands',
        'django.core.management.commands.runserver',
        'django.core.management.commands.migrate',
        'django.core.management.commands.makemigrations',
        'django.core.wsgi',
        'django.db',
        'django.db.backends',
        'django.db.backends.sqlite3',
        'django.db.backends.sqlite3.base',
        'django.db.models',
        'django.urls',
        'django.http',
        'django.template',
        'django.template.loader',
        'django.contrib',
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.auth.models',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        
        # Django REST Framework
        'rest_framework',
        'rest_framework.views',
        'rest_framework.viewsets',
        'rest_framework.serializers',
        'rest_framework.renderers',
        'rest_framework.parsers',
        'rest_framework.permissions',
        'rest_framework.routers',
        'rest_framework.response',
        'rest_framework.decorators',
        
        # CORS headers
        'corsheaders',
        'corsheaders.middleware',
        
        # Configuraciones del proyecto
        'backend',
        'backend.settings',
        'backend.urls',
        'backend.wsgi',
        
        # Apps del proyecto
        'inventario',
        'inventario.models',
        'inventario.views',
        'inventario.serializers',
        'inventario.urls',
        'inventario.apps',
        
        'clientes',
        'clientes.models',
        'clientes.views',
        'clientes.serializers',
        'clientes.urls',
        'clientes.apps',
        
        'pedidos',
        'pedidos.models',
        'pedidos.views',
        'pedidos.serializers',
        'pedidos.urls',
        'pedidos.apps',
        
        'finanzas',
        'finanzas.models',
        'finanzas.views',
        'finanzas.serializers',
        'finanzas.urls',
        'finanzas.apps',
        
        # Base de datos SQLite
        'sqlite3',
        '_sqlite3',
        
        # Utilidades del sistema
        'socket',
        'psutil',
        'urllib',
        'urllib.request',
        'urllib.error',
        'urllib.parse',
        'webbrowser',
        'threading',
        'subprocess',
        'pathlib',
        'shutil',
        'time',
        'os',
        'sys',
        'json',
        'datetime',
        'decimal',
        'uuid',
        'hashlib',
        'hmac',
        'base64',
        'email',
        'email.mime',
        'email.mime.text',
        
        # Codificación
        'encodings',
        'encodings.utf_8',
        'encodings.latin_1',
        'encodings.ascii',
        
        # Logging
        'logging',
        'logging.handlers',
        
        # Templates de Django
        'django.template.backends',
        'django.template.backends.django',
        'django.template.context_processors',
        
        # Middleware de Django
        'django.middleware',
        'django.middleware.security',
        'django.middleware.common',
        'django.middleware.csrf',
        'django.middleware.clickjacking',
        
        # Formularios de Django
        'django.forms',
        'django.forms.widgets',
        
        # Validadores
        'django.core.validators',
        
        # Signals
        'django.db.models.signals',
        'django.dispatch',
    ]
    
    return hidden_imports

# =========================================
# MÓDULOS A EXCLUIR
# =========================================

def get_excludes():
    """Módulos a excluir para reducir tamaño"""
    return [
        # Interfaces gráficas
        'tkinter',
        'PyQt5',
        'PyQt6',
        'PySide2',
        'PySide6',
        'wx',
        
        # Librerías científicas pesadas
        'matplotlib',
        'numpy',
        'scipy',
        'pandas',
        'sklearn',
        'tensorflow',
        'torch',
        'keras',
        'sympy',
        
        # Herramientas de desarrollo
        'jupyter',
        'notebook',
        'ipython',
        'pytest',
        'unittest',
        'nose',
        'coverage',
        
        # Procesamiento de imágenes
        'PIL',
        'Pillow',
        'cv2',
        'opencv',
        'skimage',
        
        # Web frameworks no necesarios
        'flask',
        'tornado',
        'pyramid',
        'cherrypy',
        
        # Otros módulos pesados
        'babel',
        'docutils',
        'sphinx',
        'setuptools',
        'wheel',
        'pip',
        'conda',
    ]

# =========================================
# CONFIGURACIÓN PRINCIPAL
# =========================================

print("🔧 CONFIGURANDO BUILD PARA DOTACIONES YAZZ")
print("=" * 60)

# Recopilar archivos
datas = collect_data_files()

a = Analysis(
    ['dotaciones_yazz_launcher.py'],  # ⭐ ARCHIVO PRINCIPAL CORREGIDO
    pathex=[os.getcwd()],
    binaries=[],
    datas=datas,
    hiddenimports=get_hidden_imports(),
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=get_excludes(),
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

# =========================================
# PROCESAMIENTO
# =========================================

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='DotacionesYazz',
    debug=False,  # ⭐ Cambiar a True para debug si es necesario
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,  # ⭐ Desactivado para evitar problemas
    console=True,  # ⭐ Mantener consola para ver mensajes
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='DotacionesYazz',
)

# =========================================
# INFORMACIÓN FINAL
# =========================================

print("=" * 60)
print("✅ CONFIGURACIÓN COMPLETADA")
print("=" * 60)
print(f"📦 Importaciones ocultas: {len(get_hidden_imports())}")
print(f"📁 Archivos de datos: {len(datas)}")
print(f"🚫 Módulos excluidos: {len(get_excludes())}")
print(f"🎯 Archivo principal: dotaciones_yazz_launcher.py")
print(f"🖥️ Modo: Consola (para ver mensajes)")
print("=" * 60)
print("🚀 LISTO PARA BUILD:")
print("   python -m PyInstaller DotacionesYazz_Fixed_Final.spec --clean")
print("=" * 60)