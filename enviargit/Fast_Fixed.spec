# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec MEJORADO para Dotaciones Yazz
Versión corregida que soluciona problemas de backend
"""

import os
import sys
from pathlib import Path

# =========================================
# CONFIGURACIÓN DE ARCHIVOS Y DATOS
# =========================================

def collect_django_files():
    """Recopilar archivos específicos de Django"""
    datas = []
    
    # Archivos principales del proyecto
    essential_files = [
        ('manage.py', '.'),
        ('backend', 'backend'),
        ('inventario', 'inventario'), 
        ('clientes', 'clientes'),
        ('pedidos', 'pedidos'),
        ('finanzas', 'finanzas'),
    ]
    
    for src, dst in essential_files:
        if os.path.exists(src):
            datas.append((src, dst))
    
    # Archivos de Django necesarios
    try:
        import django
        django_dir = os.path.dirname(django.__file__)
        
        # Incluir archivos de configuración de Django
        django_conf_files = [
            (os.path.join(django_dir, 'conf'), 'django/conf'),
            (os.path.join(django_dir, 'contrib/admin/static'), 'django/contrib/admin/static'),
            (os.path.join(django_dir, 'contrib/admin/templates'), 'django/contrib/admin/templates'),
        ]
        
        for src, dst in django_conf_files:
            if os.path.exists(src):
                datas.append((src, dst))
                
    except ImportError:
        print("⚠️ Django no encontrado para incluir archivos")
    
    # Frontend (sin node_modules)
    frontend_path = 'frontend'
    if os.path.exists(frontend_path):
        for root, dirs, files in os.walk(frontend_path):
            # Excluir directorios problemáticos
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__', 'build', 'dist']]
            
            for file in files:
                if not file.endswith(('.log', '.cache', '.tmp', '.pyc')):
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, '.')
                    target_dir = os.path.dirname(rel_path) if os.path.dirname(rel_path) else '.'
                    datas.append((rel_path, target_dir))
    
    # Base de datos inicial si existe
    for db_file in ['db.sqlite3', 'dotaciones_yazz.db']:
        if os.path.exists(db_file):
            datas.append((db_file, '.'))
            break
    
    print(f"📁 {len(datas)} archivos incluidos en el ejecutable")
    return datas

# =========================================
# IMPORTACIONES OCULTAS NECESARIAS
# =========================================

def get_hidden_imports():
    """Obtener importaciones ocultas necesarias"""
    hidden_imports = [
        # Django core
        'django',
        'django.core.management',
        'django.core.management.commands',
        'django.core.management.commands.runserver',
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        
        # Django REST Framework
        'rest_framework',
        'rest_framework.renderers',
        'rest_framework.parsers',
        'rest_framework.permissions',
        'rest_framework.serializers',
        'rest_framework.viewsets',
        'rest_framework.routers',
        
        # CORS headers
        'corsheaders',
        'corsheaders.middleware',
        
        # Configuraciones del proyecto
        'backend.settings',
        'backend.urls',
        'backend.wsgi',
        
        # Apps del proyecto
        'inventario',
        'inventario.models',
        'inventario.views',
        'inventario.serializers',
        'inventario.urls',
        
        'clientes',
        'clientes.models',
        'clientes.views', 
        'clientes.serializers',
        'clientes.urls',
        
        'pedidos',
        'pedidos.models',
        'pedidos.views',
        'pedidos.serializers', 
        'pedidos.urls',
        
        'finanzas',
        'finanzas.models',
        'finanzas.views',
        'finanzas.serializers',
        'finanzas.urls',
        
        # Base de datos SQLite
        'sqlite3',
        
        # Utilidades de sistema
        'socket',
        'psutil',
        'urllib.request',
        'urllib.error',
        'webbrowser',
        'threading',
        'subprocess',
        'pathlib',
        
        # Serialización
        'json',
        'pickle',
        
        # Fecha y hora
        'datetime',
        'time',
        'timezone',
        
        # Decimal para manejo de precios
        'decimal',
    ]
    
    return hidden_imports

# =========================================
# EXCLUSIONES PARA OPTIMIZAR TAMAÑO
# =========================================

def get_excludes():
    """Módulos a excluir para reducir tamaño"""
    return [
        # Interfaces gráficas no necesarias
        'tkinter',
        'PyQt5',
        'PyQt6', 
        'PySide2',
        'PySide6',
        
        # Librerías científicas pesadas
        'matplotlib',
        'numpy',
        'scipy',
        'pandas',
        'sklearn',
        'tensorflow',
        'torch',
        'keras',
        
        # Herramientas de desarrollo
        'jupyter',
        'notebook',
        'ipython',
        'pytest',
        'unittest',
        
        # Procesamiento de imágenes
        'PIL',
        'Pillow',
        'cv2',
        'opencv',
        
        # Otros módulos pesados no necesarios
        'babel',
        'docutils',
        'sphinx',
        'setuptools',
    ]

# =========================================
# CONFIGURACIÓN PRINCIPAL DE PYINSTALLER
# =========================================

# Recopilar archivos
datas = collect_django_files()

a = Analysis(
    ['dotaciones_yazz_launcher.py'],  # Archivo principal
    pathex=[os.getcwd()],  # Rutas de búsqueda
    binaries=[],  # Binarios adicionales
    datas=datas,  # Archivos de datos
    hiddenimports=get_hidden_imports(),  # Importaciones ocultas
    hookspath=[],  # Hooks personalizados
    hooksconfig={},  # Configuración de hooks
    runtime_hooks=[],  # Hooks de tiempo de ejecución
    excludes=get_excludes(),  # Módulos a excluir
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,  # Sin cifrado para mejor rendimiento
    noarchive=False,  # Permitir archivo para mejor compresión
)

# =========================================
# PROCESAMIENTO DE ARCHIVOS PYTHON
# =========================================

pyz = PYZ(
    a.pure, 
    a.zipped_data,
    cipher=None  # Sin cifrado
)

# =========================================
# CONFIGURACIÓN DEL EJECUTABLE
# =========================================

exe = EXE(
    pyz,
    a.scripts,
    [],  # No incluir todo en un solo archivo para mejor rendimiento
    exclude_binaries=True,  # Binarios separados
    name='DotacionesYazz',  # Nombre del ejecutable
    debug=False,  # Sin debug para mejor rendimiento
    bootloader_ignore_signals=False,
    strip=False,  # No strip para evitar problemas
    upx=False,  # Sin UPX para evitar problemas de antivirus y velocidad
    console=True,  # Mostrar consola para debugging
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Agregar ícono si tienes uno
)

# =========================================
# COLECCIÓN FINAL DE ARCHIVOS
# =========================================

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles, 
    a.datas,
    strip=False,  # No strip para evitar problemas
    upx=False,  # Sin UPX
    upx_exclude=[],
    name='DotacionesYazz',  # Nombre de la carpeta final
)

# =========================================
# INFORMACIÓN DE BUILD
# =========================================

print("=" * 60)
print("🔧 CONFIGURACIÓN DE BUILD - DOTACIONES YAZZ")
print("=" * 60)
print(f"📁 Archivos incluidos: {len(datas)}")
print(f"🚫 Módulos excluidos: {len(get_excludes())}")
print(f"📦 Importaciones ocultas: {len(get_hidden_imports())}")
print(f"🎯 Archivo principal: dotaciones_yazz_launcher.py")
print(f"📊 Modo consola: Activado (para debugging)")
print(f"⚡ UPX: Desactivado (mejor compatibilidad)")
print(f"🔒 Cifrado: Desactivado (mejor rendimiento)")
print("=" * 60)
print("✅ Configuración lista para build")
print("💡 Ejecuta: python -m PyInstaller Fast_Fixed.spec --clean")
print("=" * 60)