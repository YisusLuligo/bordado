#!/usr/bin/env python
"""
DOTACIONES YAZZ - Sistema de Gestión
Lanzador principal para Windows - Versión Optimizada para PyInstaller
"""

import os
import sys
import subprocess
import time
import threading
import webbrowser
from pathlib import Path
import shutil
import signal
import atexit

class DotacionesYazzLauncher:
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None
        
        # Detectar si estamos en PyInstaller
        if getattr(sys, 'frozen', False):
            # Estamos en PyInstaller
            self.base_dir = Path(sys._MEIPASS)
            self.working_dir = Path(os.getcwd())
            print(f"[INFO] Modo ejecutable: True")
            print(f"[INFO] Directorio base: {self.base_dir}")
            print(f"[INFO] Directorio trabajo: {self.working_dir}")
        else:
            # Desarrollo normal
            self.base_dir = Path(__file__).parent
            self.working_dir = self.base_dir
            print(f"[INFO] Modo desarrollo: True")
            print(f"[INFO] Directorio: {self.base_dir}")

        # Registrar limpieza al salir
        atexit.register(self.cleanup)
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
    def _signal_handler(self, signum, frame):
        """Manejo de señales para limpieza"""
        print(f"\n[SIGNAL] Recibida señal {signum}, cerrando...")
        self.cleanup()
        sys.exit(0)
        
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
    
    def run_diagnostics(self):
        """Ejecutar diagnósticos completos"""
        print("DOTACIONES YAZZ - MODO DIAGNOSTICO")
        print("="*40)
        
        # Verificar archivos críticos
        required_files = [
            'manage.py',
            'backend',
            'inventario', 
            'clientes',
            'pedidos',
            'finanzas'
        ]
        
        missing_files = []
        for file_path in required_files:
            full_path = self.base_dir / file_path
            if full_path.exists():
                print(f"[OK] {file_path} ya existe")
            else:
                print(f"[ERROR] {file_path} NO EXISTE")
                missing_files.append(file_path)
        
        # Verificar frontend
        frontend_build = self.base_dir / 'frontend' / 'build'
        if frontend_build.exists():
            print(f"[OK] Frontend build ya existe")
        else:
            print(f"[ERROR] Frontend build NO EXISTE")
            missing_files.append('frontend/build')
        
        # Verificar base de datos
        db_path = self.working_dir / 'db.sqlite3'
        if not db_path.exists():
            # Intentar copiar desde base_dir si existe
            source_db = self.base_dir / 'db.sqlite3'
            if source_db.exists():
                try:
                    shutil.copy2(source_db, db_path)
                    print(f"[OK] Base de datos copiada a directorio de trabajo")
                except Exception as e:
                    print(f"[ERROR] No se pudo copiar BD: {e}")
                    missing_files.append('db.sqlite3')
            else:
                print(f"[WARN] Base de datos no existe, se creará automáticamente")
        else:
            print(f"[OK] Base de datos ya existe")
        
        if missing_files:
            print(f"[ERROR] Archivos faltantes: {missing_files}")
            return False
        
        print(f"[INFO] Directorio actual: {os.getcwd()}")
        
        # Verificar base de datos más detalladamente
        print("[CHECK] Verificando base de datos...")
        if self.check_database():
            print("[OK] Base de datos existe")
        else:
            print("[ERROR] Problemas con base de datos")
            return False
        
        print("DIAGNOSTICOS COMPLETOS")
        print("="*40)
        return True
    
    def check_database(self):
        """Verificar y diagnosticar base de datos"""
        try:
            # Configurar Django
            os.chdir(self.working_dir)
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
            
            # Agregar el directorio base al path de Python
            sys.path.insert(0, str(self.base_dir))
            
            import django
            from django.conf import settings
            
            django.setup()
            
            # Verificar conexión a la base de datos
            from django.db import connection
            from django.core.management import execute_from_command_line
            
            # Verificar si necesitamos migraciones
            try:
                cursor = connection.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = cursor.fetchall()
                
                if not tables:
                    print("[INFO] Base de datos vacía, ejecutando migraciones...")
                    execute_from_command_line(['manage.py', 'migrate'])
                    self.create_default_superuser()
                else:
                    print(f"[INFO] {len(tables)} tablas encontradas en BD")
            
            except Exception as e:
                print(f"[WARN] Error verificando tablas: {e}")
                print("[INFO] Ejecutando migraciones...")
                execute_from_command_line(['manage.py', 'migrate'])
                self.create_default_superuser()
            
            # Diagnósticos adicionales
            try:
                print("[CHECK] Verificando modelos...")
                from inventario.models import Producto
                from clientes.models import Cliente
                
                productos_count = Producto.objects.count()
                clientes_count = Cliente.objects.count()
                
                print(f"[DATA] Productos en BD: {productos_count}")
                print(f"[DATA] Clientes en BD: {clientes_count}")
                
                # Verificar configuraciones
                print(f"[INFO] CORS Allow All: {settings.CORS_ALLOW_ALL_ORIGINS}")
                print(f"[INFO] CORS Origins: {settings.CORS_ALLOWED_ORIGINS}")
                
            except Exception as e:
                print(f"[WARN] Error en diagnósticos: {e}")
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Error configurando Django: {e}")
            return False
    
    def create_default_superuser(self):
        """Crear superusuario por defecto"""
        try:
            from django.contrib.auth.models import User
            
            if not User.objects.filter(username='admin').exists():
                User.objects.create_superuser(
                    username='admin',
                    email='admin@dotacionesyazz.com',
                    password='admin123'
                )
                print("[CREATE] Usuario administrador creado:")
                print("   Usuario: admin")
                print("   Contraseña: admin123")
        except Exception as e:
            print(f"[WARN] No se pudo crear superusuario: {e}")
    
    def start_django_server(self):
        """Iniciar servidor Django de forma robusta"""
        try:
            # Asegurar que estamos en el directorio correcto
            os.chdir(self.working_dir)
            
            # Preparar el entorno
            env = os.environ.copy()
            env['DJANGO_SETTINGS_MODULE'] = 'backend.settings'
            env['PYTHONPATH'] = str(self.base_dir)
            
            # En PyInstaller, necesitamos el ejecutable de Python empaquetado
            if getattr(sys, 'frozen', False):
                python_executable = sys.executable
            else:
                python_executable = sys.executable
            
            # Comando para ejecutar Django
            manage_py_path = self.base_dir / 'manage.py'
            
            cmd = [
                python_executable,
                str(manage_py_path),
                'runserver',
                '127.0.0.1:8000',
                '--noreload',  # Importante: deshabilitar recarga automática
                '--verbosity=2'
            ]
            
            print(f"[START] Iniciando Django...")
            print(f"[CMD] {' '.join(cmd)}")
            
            # Iniciar proceso
            self.backend_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env,
                cwd=str(self.working_dir),
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Monitorear la salida de Django en un hilo separado
            threading.Thread(
                target=self._monitor_django_output, 
                daemon=True
            ).start()
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Error iniciando Django: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _monitor_django_output(self):
        """Monitorear la salida de Django"""
        if not self.backend_process:
            return
            
        try:
            for line in iter(self.backend_process.stdout.readline, ''):
                if line:
                    # Filtrar warnings molestos
                    if 'pkg_resources is deprecated' not in line:
                        print(f"Django: {line.strip()}")
                        
                    # Detectar cuando Django está listo
                    if 'Starting development server' in line or 'Quit the server' in line:
                        print("[READY] Django está listo!")
                        
        except Exception as e:
            print(f"[WARN] Error monitoreando Django: {e}")
    
    def wait_for_django(self, timeout=30):
        """Esperar a que Django esté listo con mejor detección"""
        import urllib.request
        import urllib.error
        
        print("[WAIT] Esperando Django...")
        
        for i in range(timeout):
            try:
                # Verificar si el proceso sigue corriendo
                if self.backend_process and self.backend_process.poll() is not None:
                    print(f"[ERROR] Django se cerró inesperadamente (código: {self.backend_process.returncode})")
                    # Mostrar errores
                    stderr_output = self.backend_process.stderr.read()
                    if stderr_output:
                        print(f"[ERROR] Salida de error: {stderr_output}")
                    return False
                
                # Intentar conectar
                with urllib.request.urlopen('http://127.0.0.1:8000', timeout=2) as response:
                    if response.status == 200:
                        print(f"[OK] Django respondió correctamente")
                        return True
                        
            except urllib.error.URLError:
                if i < 5:
                    print(".", end="", flush=True)
                elif i % 5 == 0:
                    print(f"[WAIT] Esperando Django... (intento {i}/{timeout})")
                time.sleep(1)
        
        print(f"\n[ERROR] Django no respondio en {timeout} segundos")
        
        # Diagnóstico adicional
        if self.backend_process:
            if self.backend_process.poll() is None:
                print("[INFO] El proceso de Django sigue corriendo")
                print("[INFO] Puede ser un problema de red o configuración")
            else:
                print(f"[ERROR] El proceso de Django se cerró con código: {self.backend_process.returncode}")
        
        return False
    
    def start_frontend(self):
        """Iniciar servidor de desarrollo de React"""
        print("[START] Iniciando servidor frontend...")
        
        frontend_dir = self.base_dir / 'frontend'
        
        if not frontend_dir.exists():
            print("[ERROR] Directorio frontend no encontrado")
            return False
        
        # Verificar que npm esté disponible
        npm_path = shutil.which("npm")
        if not npm_path:
            print("[ERROR] npm no encontrado en PATH")
            return False
        
        try:
            env = os.environ.copy()
            env['BROWSER'] = 'none'  # No abrir navegador automáticamente
            
            self.frontend_process = subprocess.Popen(
                [npm_path, 'start'],
                cwd=str(frontend_dir),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            print("[WAIT] Preparando interfaz web...")
            time.sleep(8)  # Dar tiempo para que React se inicie
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Error iniciando frontend: {e}")
            return False
    
    def open_browser(self):
        """Abrir navegador web"""
        try:
            print("[BROWSER] Abriendo navegador...")
            webbrowser.open('http://localhost:3000')
            print("[OK] Navegador abierto en http://localhost:3000")
            return True
        except Exception as e:
            print(f"[WARN] No se pudo abrir el navegador: {e}")
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
                    # El frontend puede detenerse, no es crítico
                    
        except KeyboardInterrupt:
            print("\n🛑 Deteniendo sistema...")
        finally:
            self.cleanup()
            print("👋 ¡Sistema cerrado correctamente!")
    
    def cleanup(self):
        """Limpiar procesos al cerrar"""
        print("[CLEANUP] Cerrando procesos...")
        
        if self.backend_process:
            try:
                self.backend_process.terminate()
                self.backend_process.wait(timeout=5)
                print("[CLEANUP] Backend cerrado")
            except Exception as e:
                print(f"[CLEANUP] Error cerrando backend: {e}")
                try:
                    self.backend_process.kill()
                except:
                    pass
        
        if self.frontend_process:
            try:
                self.frontend_process.terminate()
                self.frontend_process.wait(timeout=5)
                print("[CLEANUP] Frontend cerrado")
            except Exception as e:
                print(f"[CLEANUP] Error cerrando frontend: {e}")
                try:
                    self.frontend_process.kill()
                except:
                    pass
    
    def run(self):
        """Ejecutar la aplicación completa"""
        try:
            self.show_banner()
            
            # Ejecutar diagnósticos
            if not self.run_diagnostics():
                print("[ERROR] Diagnósticos fallaron")
                input("Presiona Enter para salir...")
                return False
            
            # Configurar Django
            print("[SETUP] Configurando Django...")
            if not self.check_database():
                print("[ERROR] Error configurando Django")
                input("Presiona Enter para salir...")
                return False
            
            # Iniciar Django
            if not self.start_django_server():
                print("[ERROR] Error iniciando backend")
                input("Presiona Enter para salir...")
                return False
            
            # Esperar a que Django esté listo
            if not self.wait_for_django(45):  # Más tiempo de espera
                print("[ERROR] Backend fallo - no se puede continuar")
                self.cleanup()
                input("Presiona Enter para salir...")
                return False
            
            # Iniciar React (opcional)
            if not self.start_frontend():
                print("[WARN] Frontend no se pudo iniciar, pero el backend funciona")
                print("[INFO] Puedes acceder directamente a: http://127.0.0.1:8000/admin")
            else:
                time.sleep(3)
                self.open_browser()
            
            # Mostrar instrucciones
            self.show_instructions()
            
            # Esperar hasta que el usuario cierre
            self.wait_for_exit()
            
            return True
            
        except Exception as e:
            print(f"\n[ERROR] Error crítico: {e}")
            import traceback
            traceback.print_exc()
            self.cleanup()
            input("Presiona Enter para salir...")
            return False

def main():
    """Función principal"""
    launcher = DotacionesYazzLauncher()
    launcher.run()

if __name__ == "__main__":
    main()