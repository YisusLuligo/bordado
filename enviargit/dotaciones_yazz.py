#!/usr/bin/env python
"""
DOTACIONES YAZZ - Sistema de Gestión
Lanzador principal para Windows
"""

import os
import sys
import subprocess
import time
import threading
import webbrowser
from pathlib import Path
import shutil

class DotacionesYazzLauncher:
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None
        self.base_dir = Path(__file__).parent
        
    def show_banner(self):
        """Mostrar banner de bienvenida"""
        print("="*60)
        print("🏪 DOTACIONES YAZZ - SISTEMA DE GESTIÓN INTEGRAL")
        print("="*60)
        print("📋 Gestión de Inventario")
        print("👥 Administración de Clientes") 
        print("📦 Control de Pedidos")
        print("💰 Módulo Financiero")
        print("="*60)
        print()
    
    def check_requirements(self):
        """Verificar requisitos del sistema"""
        print("🔍 Verificando requisitos del sistema...")
        
        # Verificar estructura de archivos
        required_files = ['manage.py', 'frontend/package.json']
        missing_files = []
        
        for file_path in required_files:
            if not (self.base_dir / file_path).exists():
                missing_files.append(file_path)
        
        if missing_files:
            print("❌ Archivos faltantes:")
            for file in missing_files:
                print(f"   - {file}")
            return False
        
        # Verificar Python
        python_version = sys.version_info
        if python_version.major < 3 or python_version.minor < 8:
            print(f"❌ Python {python_version.major}.{python_version.minor} detectado")
            print("💡 Se requiere Python 3.8 o superior")
            return False
        
        print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro}")
        
        # Verificar Node.js
        try:
            result = subprocess.run(['node', '--version'], 
                                  capture_output=True, text=True, check=True)
            print(f"✅ Node.js {result.stdout.strip()}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ Node.js no encontrado")
            print("💡 Descarga Node.js desde: https://nodejs.org/")
            return False
        
        return True
    
    def setup_backend(self):
        """Configurar el backend Django"""
        print("\n🔧 Configurando backend...")
        
        os.chdir(self.base_dir)
        
        # Verificar si existe la base de datos
        if not (self.base_dir / 'db.sqlite3').exists():
            print("📋 Creando base de datos...")
            try:
                subprocess.run([sys.executable, 'manage.py', 'migrate'], 
                             check=True, capture_output=True)
                
                # Crear superusuario por defecto
                self.create_default_superuser()
                
            except subprocess.CalledProcessError as e:
                print(f"❌ Error configurando base de datos: {e}")
                return False
        
        print("✅ Backend configurado")
        return True
    
    def create_default_superuser(self):
        """Crear superusuario por defecto"""
        try:
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
            import django
            django.setup()
            
            from django.contrib.auth.models import User
            
            if not User.objects.filter(username='admin').exists():
                User.objects.create_superuser(
                    username='admin',
                    email='admin@dotacionesyazz.com',
                    password='admin123'
                )
                print("👤 Usuario administrador creado:")
                print("   Usuario: admin")
                print("   Contraseña: admin123")
        except Exception as e:
            print(f"⚠️ No se pudo crear el superusuario: {e}")
    
    def setup_frontend(self):
        """Configurar el frontend React"""
        print("\n🌐 Configurando frontend...")
        
        frontend_dir = self.base_dir / 'frontend'
        
        # Instalar dependencias si no existen
        if not (frontend_dir / 'node_modules').exists():
            print("📦 Instalando dependencias de React...")
            try:
                subprocess.run(['npm', 'install'], 
                             cwd=frontend_dir, check=True, capture_output=True)
                print("✅ Dependencias instaladas")
            except subprocess.CalledProcessError as e:
                print(f"❌ Error instalando dependencias: {e}")
                return False
        else:
            print("✅ Dependencias ya instaladas")
        
        return True
    
    def start_backend(self):
        """Iniciar servidor Django en un hilo separado"""
        def run_backend():
            try:
                os.chdir(self.base_dir)
                # Agregar variable de entorno para Django
                env = os.environ.copy()
                env['DJANGO_SETTINGS_MODULE'] = 'backend.settings'
                
                self.backend_process = subprocess.Popen(
                    [sys.executable, 'manage.py', 'runserver', '127.0.0.1:8000', '--noreload'],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=env
                )
                self.backend_process.wait()
            except Exception as e:
                print(f"❌ Error en backend: {e}")
        
        backend_thread = threading.Thread(target=run_backend)
        backend_thread.daemon = True
        backend_thread.start()
        
        # Esperar a que el backend esté listo
        print("🚀 Iniciando servidor backend...")
        print("⏳ Esperando que Django esté listo...")
        
        return self.check_backend_ready()
    
    def check_backend_ready(self):
        """Verificar si el backend está listo con más tiempo de espera"""
        import urllib.request
        import urllib.error
        
        print("🔄 Verificando conexión al backend...", end="")
        
        for i in range(30):  # Aumentar tiempo de espera a 30 segundos
            try:
                with urllib.request.urlopen('http://127.0.0.1:8000', timeout=2) as response:
                    if response.status == 200:
                        print("\n✅ Backend iniciado en http://127.0.0.1:8000")
                        return True
            except urllib.error.URLError:
                print(".", end="", flush=True)
                time.sleep(1)
        
        print("\n❌ El backend no respondió en 30 segundos")
        print("💡 Intentando verificar manualmente...")
        
        # Verificar si el proceso está corriendo
        if self.backend_process and self.backend_process.poll() is None:
            print("✅ El proceso de Django está corriendo")
            print("🔗 Puedes acceder manualmente a: http://127.0.0.1:8000")
            
            # Preguntar si continuar
            respuesta = input("¿Continuar con el frontend? (s/n): ")
            if respuesta.lower() in ['s', 'si', 'y', 'yes']:
                return True
        
        return False
    
    def start_frontend(self):
        """Iniciar servidor React"""
        print("🌐 Iniciando interfaz web...")

        frontend_dir = self.base_dir / 'frontend'

        # Detectar ruta de npm
        npm_path = shutil.which("npm")
        if npm_path is None:
            print("❌ 'npm' no se encontró en el PATH. Asegúrate de que Node.js esté instalado correctamente.")
            print("💡 Puedes agregar manualmente la ruta de npm o usar npm.cmd en C:\\Program Files\\nodejs")
            return False
        else:
            print(f"✅ npm encontrado en: {npm_path}")

        try:
            # Configurar variables de entorno para React
            env = os.environ.copy()
            env['BROWSER'] = 'none'  # Evitar que se abra automáticamente

            self.frontend_process = subprocess.Popen(
                [npm_path, 'start'],
                cwd=frontend_dir,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

            print("⏳ Preparando interfaz web...")
            time.sleep(10)

            print("🌐 Abriendo navegador...")
            webbrowser.open('http://localhost:3000')
            print("✅ Interfaz web abierta en http://localhost:3000")

            return True

        except Exception as e:
            print(f"❌ Error iniciando frontend: {e}")
            return False
    
    def show_instructions(self):
        """Mostrar instrucciones de uso"""
        print("\n" + "="*60)
        print("🎉 ¡SISTEMA INICIADO CORRECTAMENTE!")
        print("="*60)
        print("🌐 Interfaz Web: http://localhost:3000")
        print("🔧 Panel Admin: http://127.0.0.1:8000/admin")
        print("📊 API Backend: http://127.0.0.1:8000/api")
        print()
        print("👤 CREDENCIALES DE ADMINISTRADOR:")
        print("   Usuario: admin")
        print("   Contraseña: admin123")
        print()
        print("📋 MÓDULOS DISPONIBLES:")
        print("   • Gestión de Inventario")
        print("   • Administración de Clientes")
        print("   • Control de Pedidos")
        print("   • Módulo Financiero")
        print()
        print("⚠️  IMPORTANTE:")
        print("   • Mantén esta ventana abierta mientras usas el sistema")
        print("   • Para cerrar el sistema, presiona Ctrl+C")
        print("   • Los datos se guardan automáticamente")
        print("="*60)
    
    def wait_for_exit(self):
        """Esperar a que el usuario cierre el programa"""
        try:
            print("\n🔄 Sistema ejecutándose...")
            print("🛑 Presiona Ctrl+C para detener el sistema")
            
            while True:
                time.sleep(1)
                
                # Verificar si los procesos siguen corriendo
                if self.backend_process and self.backend_process.poll() is not None:
                    print("⚠️ El backend se ha detenido inesperadamente")
                    break
                
                if self.frontend_process and self.frontend_process.poll() is not None:
                    print("⚠️ El frontend se ha detenido inesperadamente")
                    break
                    
        except KeyboardInterrupt:
            print("\n🛑 Deteniendo sistema...")
            self.cleanup()
            print("👋 ¡Sistema cerrado correctamente!")
    
    def cleanup(self):
        """Limpiar procesos al cerrar"""
        if self.backend_process:
            try:
                self.backend_process.terminate()
                self.backend_process.wait(timeout=5)
            except:
                self.backend_process.kill()
        
        if self.frontend_process:
            try:
                self.frontend_process.terminate()
                self.frontend_process.wait(timeout=5)
            except:
                self.frontend_process.kill()
    
    def run(self):
        """Ejecutar la aplicación completa"""
        try:
            self.show_banner()
            
            # Verificar requisitos
            if not self.check_requirements():
                input("\nPresiona Enter para salir...")
                return False
            
            # Configurar componentes
            if not self.setup_backend():
                input("\nPresiona Enter para salir...")
                return False
            
            if not self.setup_frontend():
                input("\nPresiona Enter para salir...")
                return False
            
            # Iniciar servicios
            if not self.start_backend():
                print("\n⚠️ Problema con el backend, pero puedes intentar manualmente:")
                print("   1. Abre otra terminal")
                print("   2. Ejecuta: python manage.py runserver")
                print("   3. Luego ejecuta: python start_frontend.py")
                input("\nPresiona Enter para salir...")
                return False
            
            if not self.start_frontend():
                print("\n⚠️ Problema con el frontend, pero puedes intentar manualmente:")
                print("   1. Abre otra terminal") 
                print("   2. Ve a la carpeta frontend: cd frontend")
                print("   3. Ejecuta: npm start")
                input("\nPresiona Enter para salir...")
                return False
            
            # Mostrar instrucciones y esperar
            self.show_instructions()
            self.wait_for_exit()
            
            return True
            
        except Exception as e:
            print(f"\n❌ Error crítico: {e}")
            self.cleanup()
            input("Presiona Enter para salir...")
            return False

def main():
    """Función principal"""
    launcher = DotacionesYazzLauncher()
    launcher.run()

if __name__ == "__main__":
    main()