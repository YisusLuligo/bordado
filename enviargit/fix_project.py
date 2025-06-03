#!/usr/bin/env python
"""
Script para arreglar los problemas del proyecto Dotaciones Yazz
Ejecuta este script desde la raíz del proyecto
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

def print_step(step, message):
    print(f"\n{'='*60}")
    print(f"PASO {step}: {message}")
    print('='*60)

def check_file_structure():
    """Verificar estructura de archivos"""
    print_step(1, "VERIFICANDO ESTRUCTURA DE ARCHIVOS")
    
    required_files = [
        'manage.py',
        'backend/settings.py',
        'backend/__init__.py',
        'backend/urls.py',
        'backend/wsgi.py',
        'dotaciones_yazz_launcher.py',
        'requirements.txt'
    ]
    
    missing_files = []
    for file in required_files:
        if not Path(file).exists():
            missing_files.append(file)
            print(f"❌ Faltante: {file}")
        else:
            print(f"✅ Existe: {file}")
    
    if missing_files:
        print(f"\n⚠️ Archivos faltantes: {len(missing_files)}")
        return False
    
    print("\n✅ Estructura de archivos OK")
    return True

def fix_manage_py():
    """Corregir manage.py"""
    print_step(2, "CORRIGIENDO MANAGE.PY")
    
    manage_content = '''#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
'''
    
    try:
        with open('manage.py', 'w', encoding='utf-8') as f:
            f.write(manage_content)
        print("✅ manage.py corregido")
        return True
    except Exception as e:
        print(f"❌ Error corrigiendo manage.py: {e}")
        return False

def create_missing_directories():
    """Crear directorios faltantes"""
    print_step(3, "CREANDO DIRECTORIOS FALTANTES")
    
    directories = [
        'backend',
        'inventario',
        'clientes',
        'pedidos',
        'finanzas',
        'frontend/src',
        'frontend/public',
        'build',
        'dist'
    ]
    
    for directory in directories:
        try:
            Path(directory).mkdir(parents=True, exist_ok=True)
            print(f"✅ Directorio: {directory}")
        except Exception as e:
            print(f"❌ Error creando {directory}: {e}")

def fix_backend_init():
    """Crear __init__.py faltantes"""
    print_step(4, "CREANDO ARCHIVOS __init__.py")
    
    init_files = [
        'backend/__init__.py',
        'inventario/__init__.py',
        'clientes/__init__.py',
        'pedidos/__init__.py',
        'finanzas/__init__.py'
    ]
    
    for init_file in init_files:
        try:
            Path(init_file).touch()
            print(f"✅ {init_file}")
        except Exception as e:
            print(f"❌ Error creando {init_file}: {e}")

def install_dependencies():
    """Instalar dependencias"""
    print_step(5, "INSTALANDO DEPENDENCIAS")
    
    try:
        # Actualizar pip
        subprocess.run([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'], check=True)
        print("✅ pip actualizado")
        
        # Instalar dependencias
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], check=True)
        print("✅ Dependencias instaladas")
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error instalando dependencias: {e}")
        return False

def setup_database():
    """Configurar base de datos"""
    print_step(6, "CONFIGURANDO BASE DE DATOS")
    
    try:
        # Crear migraciones
        print("📄 Creando migraciones...")
        subprocess.run([sys.executable, 'manage.py', 'makemigrations'], check=True)
        
        # Aplicar migraciones
        print("🔄 Aplicando migraciones...")
        subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)
        
        print("✅ Base de datos configurada")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error configurando BD: {e}")
        return False

def create_corrected_spec():
    """Crear archivo .spec corregido"""
    print_step(7, "CREANDO ARCHIVO .SPEC CORREGIDO")
    
    spec_content = '''# -*- mode: python ; coding: utf-8 -*-
import os
from pathlib import Path

# Configuración de archivos
a = Analysis(
    ['dotaciones_yazz_launcher.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('manage.py', '.'),
        ('backend', 'backend'),
        ('inventario', 'inventario'),
        ('clientes', 'clientes'),
        ('pedidos', 'pedidos'),
        ('finanzas', 'finanzas'),
    ],
    hiddenimports=[
        'django',
        'django.core.management',
        'django.core.management.commands.runserver',
        'rest_framework',
        'corsheaders',
        'backend.settings',
        'backend.urls',
        'backend.wsgi',
        'inventario.models',
        'clientes.models',
        'pedidos.models',
        'finanzas.models',
        'sqlite3',
        'psutil',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'matplotlib',
        'numpy',
        'scipy',
        'pandas',
        'PIL',
        'cv2',
        'tensorflow',
        'torch',
        'jupyter'
    ],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='DotacionesYazz',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='DotacionesYazz',
)
'''
    
    try:
        with open('DotacionesYazz_Fixed.spec', 'w', encoding='utf-8') as f:
            f.write(spec_content)
        print("✅ Archivo .spec corregido creado")
        return True
    except Exception as e:
        print(f"❌ Error creando .spec: {e}")
        return False

def test_django():
    """Probar Django"""
    print_step(8, "PROBANDO DJANGO")
    
    try:
        # Test básico de Django
        subprocess.run([sys.executable, 'manage.py', 'check'], check=True, timeout=30)
        print("✅ Django funciona correctamente")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error en Django: {e}")
        return False
    except subprocess.TimeoutExpired:
        print("❌ Timeout en verificación de Django")
        return False

def build_executable():
    """Construir ejecutable"""
    print_step(9, "CONSTRUYENDO EJECUTABLE")
    
    try:
        cmd = [
            sys.executable, '-m', 'PyInstaller',
            'DotacionesYazz_Fixed.spec',
            '--clean',
            '--noconfirm'
        ]
        
        print(f"🔧 Ejecutando: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        
        if result.returncode == 0:
            print("✅ Ejecutable creado exitosamente")
            return True
        else:
            print(f"❌ Error en PyInstaller:")
            print(result.stderr[-500:])  # Últimos 500 caracteres del error
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Timeout construyendo ejecutable")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def create_installer():
    """Crear instalador"""
    print_step(10, "CREANDO INSTALADOR")
    
    installer_content = '''@echo off
echo ==========================================
echo    INSTALADOR DOTACIONES YAZZ
echo ==========================================
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js requerido
    echo Descarga desde: https://nodejs.org/
    pause
    exit /b 1
)

set "DIR=%USERPROFILE%\\DotacionesYazz"
mkdir "%DIR%" 2>nul
xcopy /E /Y "DotacionesYazz\\*" "%DIR%\\"

echo ✅ Instalado en: %DIR%
echo 📧 Usuario: admin
echo 🔑 Contraseña: admin123
pause
'''
    
    try:
        with open('dist/INSTALAR.bat', 'w', encoding='utf-8') as f:
            f.write(installer_content)
        print("✅ Instalador creado")
        return True
    except Exception as e:
        print(f"❌ Error creando instalador: {e}")
        return False

def main():
    """Función principal"""
    print("🔧 REPARADOR DE PROYECTO DOTACIONES YAZZ")
    print("Esto solucionará los problemas más comunes\n")
    
    steps = [
        ("Estructura de archivos", check_file_structure),
        ("Arreglar manage.py", fix_manage_py),
        ("Crear directorios", create_missing_directories),
        ("Archivos __init__.py", fix_backend_init),
        ("Instalar dependencias", install_dependencies),
        ("Configurar BD", setup_database),
        ("Crear .spec", create_corrected_spec),
        ("Probar Django", test_django),
        ("Construir ejecutable", build_executable),
        ("Crear instalador", create_installer)
    ]
    
    success_count = 0
    
    for step_name, step_func in steps:
        try:
            if step_func():
                success_count += 1
            else:
                print(f"⚠️ Falló: {step_name}")
        except Exception as e:
            print(f"❌ Error en {step_name}: {e}")
    
    print(f"\n{'='*60}")
    print(f"RESULTADO FINAL: {success_count}/{len(steps)} pasos completados")
    print('='*60)
    
    if success_count >= 8:
        print("🎉 ¡Proyecto reparado exitosamente!")
        print("📁 Revisa la carpeta 'dist' para el ejecutable")
        print("🚀 Ejecuta INSTALAR.bat para instalar")
    else:
        print("⚠️ Algunos pasos fallaron. Revisa los errores arriba.")
        print("💡 Puedes ejecutar este script nuevamente después de corregir los errores.")

if __name__ == "__main__":
    main()
    input("\nPresiona Enter para salir...")