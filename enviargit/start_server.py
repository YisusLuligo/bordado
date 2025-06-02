#!/usr/bin/env python
"""
Script para iniciar el servidor Django
"""

import os
import sys
import subprocess
import time
import threading
import webbrowser
from pathlib import Path

def setup_django():
    """Configurar Django y verificar base de datos"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    
    try:
        import django
        django.setup()
        
        # Verificar si necesitamos crear migraciones
        from django.core.management import execute_from_command_line
        
        print("🔧 Verificando base de datos...")
        
        # Crear migraciones si no existen
        if not os.path.exists('db.sqlite3'):
            print("📋 Creando base de datos...")
            execute_from_command_line(['manage.py', 'migrate'])
            
            # Crear superusuario por defecto
            from django.contrib.auth.models import User
            if not User.objects.filter(username='admin').exists():
                print("👤 Creando usuario administrador...")
                User.objects.create_superuser(
                    username='admin',
                    email='admin@empresa.com',
                    password='admin123'
                )
                print("✅ Usuario creado - Usuario: admin, Contraseña: admin123")
        
        return True
        
    except Exception as e:
        print(f"❌ Error configurando Django: {e}")
        return False

def start_django_server():
    """Iniciar servidor Django"""
    try:
        print("🚀 Iniciando servidor Django en http://127.0.0.1:8000")
        
        # Cambiar al directorio del backend si es necesario
        backend_dir = Path(__file__).parent
        if backend_dir.name != 'backend':
            # Si estamos en la raíz del proyecto
            os.chdir(backend_dir)
        
        # Ejecutar servidor
        from django.core.management import execute_from_command_line
        execute_from_command_line(['manage.py', 'runserver', '127.0.0.1:8000'])
        
    except KeyboardInterrupt:
        print("\n🛑 Servidor Django detenido")
    except Exception as e:
        print(f"❌ Error iniciando servidor Django: {e}")

def check_server_running():
    """Verificar si el servidor está corriendo"""
    import urllib.request
    import urllib.error
    
    for _ in range(30):  # Intentar por 30 segundos
        try:
            with urllib.request.urlopen('http://127.0.0.1:8000') as response:
                if response.status == 200:
                    return True
        except urllib.error.URLError:
            time.sleep(1)
    return False

def main():
    """Función principal"""
    print("="*50)
    print("🏪 DOTACIONES YAZZ - SISTEMA DE GESTIÓN")
    print("="*50)
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists('manage.py'):
        print("❌ Error: No se encontró manage.py")
        print("💡 Asegúrate de ejecutar este script desde la raíz del proyecto")
        input("Presiona Enter para salir...")
        return
    
    # Configurar Django
    if not setup_django():
        input("Presiona Enter para salir...")
        return
    
    print("✅ Configuración completada")
    print("\n🌐 El backend estará disponible en: http://127.0.0.1:8000")
    print("🔧 Panel de administración: http://127.0.0.1:8000/admin")
    print("📊 API: http://127.0.0.1:8000/api/")
    print("\n⚠️  IMPORTANTE: Mantén esta ventana abierta mientras usas el sistema")
    print("🛑 Para detener el servidor, presiona Ctrl+C\n")
    
    # Iniciar servidor
    try:
        start_django_server()
    except KeyboardInterrupt:
        print("\n👋 ¡Hasta luego!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    
    input("\nPresiona Enter para salir...")

if __name__ == "__main__":
    main()