#!/usr/bin/env python
"""
Script de DEBUG para identificar problemas de build
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def check_python_env():
    """Verificar entorno de Python"""
    print("🐍 VERIFICACIÓN DE PYTHON:")
    print(f"   Versión: {sys.version}")
    print(f"   Ejecutable: {sys.executable}")
    print(f"   Ruta: {sys.path[0]}")
    print()

def check_pip():
    """Verificar pip"""
    print("📦 VERIFICACIÓN DE PIP:")
    try:
        result = subprocess.run([sys.executable, '-m', 'pip', '--version'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print(f"   ✅ pip: {result.stdout.strip()}")
        else:
            print(f"   ❌ Error con pip: {result.stderr}")
            return False
    except Exception as e:
        print(f"   ❌ Error ejecutando pip: {e}")
        return False
    return True

def check_dependencies():
    """Verificar dependencias específicas"""
    print("🔍 VERIFICACIÓN DE DEPENDENCIAS:")
    
    dependencies = [
        ('django', 'Django'),
        ('rest_framework', 'Django REST Framework'),
        ('corsheaders', 'django-cors-headers'),
        ('psutil', 'psutil'),
        ('PyInstaller', 'PyInstaller')
    ]
    
    missing = []
    for module, name in dependencies:
        try:
            __import__(module)
            print(f"   ✅ {name}")
        except ImportError:
            print(f"   ❌ {name} - FALTANTE")
            missing.append(name)
    
    return missing

def install_missing_dependencies(missing):
    """Instalar dependencias faltantes"""
    if not missing:
        return True
    
    print(f"\n📦 INSTALANDO DEPENDENCIAS FALTANTES:")
    
    package_map = {
        'Django': 'django>=4.0',
        'Django REST Framework': 'djangorestframework',
        'django-cors-headers': 'django-cors-headers',
        'psutil': 'psutil>=5.9.0',
        'PyInstaller': 'pyinstaller>=6.0'
    }
    
    for dep in missing:
        package = package_map.get(dep, dep)
        print(f"   📦 Instalando {package}...")
        
        try:
            result = subprocess.run([
                sys.executable, '-m', 'pip', 'install', package, '--upgrade'
            ], capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0:
                print(f"   ✅ {package} instalado exitosamente")
            else:
                print(f"   ❌ Error instalando {package}:")
                print(f"       STDOUT: {result.stdout}")
                print(f"       STDERR: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            print(f"   ❌ Timeout instalando {package}")
            return False
        except Exception as e:
            print(f"   ❌ Error inesperado: {e}")
            return False
    
    return True

def check_files():
    """Verificar archivos necesarios"""
    print("\n📁 VERIFICACIÓN DE ARCHIVOS:")
    
    required_files = [
        'manage.py',
        'dotaciones_yazz_launcher.py',
        'backend/settings.py',
        'Fast_Fixed.spec'
    ]
    
    missing_files = []
    for file in required_files:
        if Path(file).exists():
            print(f"   ✅ {file}")
        else:
            print(f"   ❌ {file} - FALTANTE")
            missing_files.append(file)
    
    return missing_files

def check_node():
    """Verificar Node.js"""
    print("\n🟢 VERIFICACIÓN DE NODE.JS:")
    
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(f"   ✅ Node.js: {result.stdout.strip()}")
            return True
        else:
            print(f"   ❌ Error con Node.js: {result.stderr}")
    except FileNotFoundError:
        print("   ❌ Node.js no encontrado")
        print("   💡 Descárgalo desde: https://nodejs.org/")
    except Exception as e:
        print(f"   ❌ Error verificando Node.js: {e}")
    
    return False

def create_requirements_txt():
    """Crear archivo requirements.txt actualizado"""
    print("\n📝 CREANDO REQUIREMENTS.TXT:")
    
    requirements = [
        "Django>=4.2.0",
        "djangorestframework>=3.14.0",
        "django-cors-headers>=4.0.0",
        "psutil>=5.9.0",
        "pyinstaller>=6.0.0"
    ]
    
    try:
        with open('requirements.txt', 'w') as f:
            for req in requirements:
                f.write(f"{req}\n")
        
        print("   ✅ requirements.txt creado")
        print("   📦 Contenido:")
        for req in requirements:
            print(f"      {req}")
        
        return True
    except Exception as e:
        print(f"   ❌ Error creando requirements.txt: {e}")
        return False

def install_from_requirements():
    """Instalar desde requirements.txt"""
    print("\n📦 INSTALANDO DESDE REQUIREMENTS.TXT:")
    
    try:
        result = subprocess.run([
            sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt', '--upgrade'
        ], capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            print("   ✅ Todas las dependencias instaladas")
            return True
        else:
            print("   ❌ Error instalando dependencias:")
            print(f"      STDOUT: {result.stdout}")
            print(f"      STDERR: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("   ❌ Timeout instalando dependencias")
        return False
    except Exception as e:
        print(f"   ❌ Error inesperado: {e}")
        return False

def test_django():
    """Probar que Django funciona"""
    print("\n🧪 PROBANDO DJANGO:")
    
    try:
        # Configurar Django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        
        import django
        django.setup()
        
        print("   ✅ Django configurado correctamente")
        
        # Probar conexión a BD
        from django.db import connection
        cursor = connection.cursor()
        print(f"   ✅ Base de datos: {connection.vendor}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error con Django: {e}")
        return False

def fix_pyinstaller_permissions():
    """Arreglar permisos de PyInstaller en Windows"""
    if platform.system() != 'Windows':
        return True
    
    print("\n🔒 VERIFICANDO PERMISOS (WINDOWS):")
    
    try:
        # Probar crear archivo temporal
        import tempfile
        with tempfile.NamedTemporaryFile(delete=True) as tmp:
            print("   ✅ Permisos de escritura OK")
        
        # Verificar directorio de PyInstaller
        import PyInstaller
        pyinst_dir = Path(PyInstaller.__file__).parent
        print(f"   ✅ PyInstaller en: {pyinst_dir}")
        
        return True
        
    except Exception as e:
        print(f"   ⚠️ Problema de permisos: {e}")
        print("   💡 Prueba ejecutar como administrador")
        return False

def main():
    """Función principal de diagnóstico"""
    print("🔍 DIAGNÓSTICO COMPLETO DE BUILD")
    print("=" * 60)
    
    # Verificaciones básicas
    check_python_env()
    
    if not check_pip():
        print("❌ pip no funciona correctamente")
        return False
    
    # Verificar archivos necesarios
    missing_files = check_files()
    if missing_files:
        print(f"\n⚠️ Archivos faltantes: {missing_files}")
        print("💡 Asegúrate de tener todos los archivos necesarios")
    
    # Verificar dependencias
    missing_deps = check_dependencies()
    
    if missing_deps:
        print(f"\n⚠️ Dependencias faltantes: {missing_deps}")
        
        # Crear requirements.txt
        if create_requirements_txt():
            # Instalar dependencias faltantes
            if install_from_requirements():
                print("✅ Dependencias instaladas correctamente")
            else:
                print("❌ Error instalando dependencias")
                return False
        else:
            return False
    else:
        print("\n✅ Todas las dependencias están instaladas")
    
    # Verificar Node.js
    if not check_node():
        print("⚠️ Node.js es necesario para el frontend")
    
    # Probar Django
    if not test_django():
        print("❌ Django no funciona correctamente")
        return False
    
    # Verificar permisos (Windows)
    if not fix_pyinstaller_permissions():
        print("⚠️ Posibles problemas de permisos")
    
    print("\n" + "=" * 60)
    print("✅ DIAGNÓSTICO COMPLETADO")
    print("=" * 60)
    print("\n💡 PRÓXIMO PASO:")
    print("   python -m PyInstaller Fast_Fixed.spec --clean --noconfirm")
    print("\n🔧 O usa el build automático:")
    print("   python build_fixed.py")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            print("\n❌ Hay problemas que deben resolverse antes del build")
        else:
            print("\n🎯 Todo parece estar en orden para el build")
    except KeyboardInterrupt:
        print("\n🛑 Diagnóstico cancelado")
    except Exception as e:
        print(f"\n❌ Error inesperado en diagnóstico: {e}")
    
    input("\nPresiona Enter para salir...")