#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Launcher COMPLETO para Dotaciones Yazz
Incluye tanto Django backend como React frontend
"""

import os
import sys
import time
import threading
import webbrowser
import shutil
import socket
import subprocess
from pathlib import Path
import django
from django.core.management import call_command

class DotacionesLauncher:
    def __init__(self):
        # Detectar entorno
        self.is_frozen = getattr(sys, 'frozen', False)
        
        if self.is_frozen:
            # Modo ejecutable
            self.base_dir = Path(sys._MEIPASS)
            self.work_dir = Path.home() / 'Documents' / 'DotacionesYazz'
            self.work_dir.mkdir(parents=True, exist_ok=True)
            print(f"[EJECUTABLE] Iniciando en modo ejecutable")
            print(f"[EJECUTABLE] Archivos temporales: {self.base_dir}")
            print(f"[EJECUTABLE] Directorio de trabajo: {self.work_dir}")
        else:
            # Modo desarrollo
            self.base_dir = Path(__file__).parent
            self.work_dir = self.base_dir
            print(f"[DESARROLLO] Directorio: {self.base_dir}")
        
        self.backend_port = self.find_free_port(8000)
        self.frontend_port = self.find_free_port(3000)
        self.server_thread = None
        self.frontend_process = None
        
        print(f"[CONFIG] Backend puerto: {self.backend_port}")
        print(f"[CONFIG] Frontend puerto: {self.frontend_port}")
    
    def find_free_port(self, start_port):
        """Encontrar puerto libre"""
        for port in range(start_port, start_port + 100):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                    sock.bind(('127.0.0.1', port))
                    return port
            except OSError:
                continue
        return start_port
    
    def simple_process_cleanup(self):
        """Limpieza simple sin psutil"""
        try:
            # Solo verificar puertos
            ports_to_check = [8000, 8001, 3000, 3001]
            for port in ports_to_check:
                try:
                    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                        sock.settimeout(1)
                        if sock.connect_ex(('127.0.0.1', port)) == 0:
                            print(f"[INFO] Puerto {port} está en uso, continuando...")
                except:
                    pass
            
            print(f"[OK] Verificación de puertos completada")
            return True
            
        except Exception as e:
            print(f"[WARNING] Error en limpieza: {e}")
            return True
    
    def setup_work_directory(self):
        """Configurar directorio de trabajo"""
        if not self.is_frozen:
            return True
        
        print("[SETUP] Configurando directorio de trabajo...")
        
        try:
            # Archivos esenciales a copiar
            essential_items = [
                ('manage.py', 'manage.py'),
                ('backend', 'backend'),
                ('inventario', 'inventario'),
                ('clientes', 'clientes'), 
                ('pedidos', 'pedidos'),
                ('finanzas', 'finanzas'),
                ('frontend', 'frontend')  # ⭐ AGREGADO
            ]
            
            for src_name, dst_name in essential_items:
                src = self.base_dir / src_name
                dst = self.work_dir / dst_name
                
                if src.exists():
                    if src.is_file():
                        if not dst.exists() or src.stat().st_mtime > dst.stat().st_mtime:
                            print(f"[COPY] Archivo: {src_name}")
                            dst.parent.mkdir(parents=True, exist_ok=True)
                            shutil.copy2(src, dst)
                    else:
                        if not dst.exists():
                            print(f"[COPY] Directorio: {src_name}")
                            shutil.copytree(src, dst, dirs_exist_ok=True)
                        else:
                            print(f"[SYNC] Actualizando: {src_name}")
                            self._sync_directory(src, dst)
                else:
                    print(f"[WARNING] No encontrado: {src_name}")
            
            # Verificar archivos críticos
            critical_files = [
                (self.work_dir / 'manage.py', 'manage.py'),
                (self.work_dir / 'backend' / 'settings.py', 'backend/settings.py'),
                (self.work_dir / 'frontend' / 'package.json', 'frontend/package.json')  # ⭐ AGREGADO
            ]
            
            for file_path, name in critical_files:
                if not file_path.exists():
                    if 'frontend' in name:
                        print(f"[WARNING] Frontend no encontrado: {name}")
                    else:
                        print(f"[ERROR] Archivo crítico faltante: {name}")
                        return False
                else:
                    print(f"[OK] Archivo encontrado: {name}")
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Error configurando directorio: {e}")
            return False
    
    def _sync_directory(self, src, dst):
        """Sincronizar directorios de forma segura"""
        try:
            for item in src.rglob('*'):
                if item.is_file():
                    # Saltar node_modules para velocidad
                    if 'node_modules' in item.parts:
                        continue
                    
                    rel_path = item.relative_to(src)
                    dst_file = dst / rel_path
                    
                    if not dst_file.exists() or item.stat().st_mtime > dst_file.stat().st_mtime:
                        dst_file.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(item, dst_file)
        except Exception as e:
            print(f"[WARNING] Error sincronizando {src}: {e}")
    
    def setup_django_environment(self):
        """Configurar entorno Django"""
        print("[DJANGO] Configurando entorno...")
        
        try:
            # Cambiar al directorio de trabajo
            original_cwd = os.getcwd()
            os.chdir(self.work_dir)
            
            # Configurar variables de entorno
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
            
            # Agregar directorio al path de Python
            if str(self.work_dir) not in sys.path:
                sys.path.insert(0, str(self.work_dir))
            
            # Configurar Django
            django.setup()
            
            print("[OK] Django configurado correctamente")
            return True
            
        except Exception as e:
            print(f"[ERROR] Error configurando Django: {e}")
            try:
                os.chdir(original_cwd)
            except:
                pass
            return False
    
    def setup_database(self):
        """Configurar base de datos"""
        print("[DATABASE] Configurando base de datos...")
        
        try:
            from django.core.management import call_command
            from django.db import connection
            from django.contrib.auth.models import User
            
            # Verificar si la BD necesita migraciones
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                    tables = cursor.fetchall()
                    
                if not tables:
                    print("[DATABASE] Base de datos vacía, ejecutando migraciones...")
                    
                    try:
                        call_command('makemigrations', verbosity=0, interactive=False)
                        print("[OK] Migraciones creadas")
                    except Exception as e:
                        print(f"[INFO] makemigrations: {e}")
                    
                    call_command('migrate', verbosity=0, interactive=False)
                    print("[OK] Migraciones aplicadas")
                else:
                    print("[OK] Base de datos existente")
                    
            except Exception as e:
                print(f"[INFO] Verificando BD: {e}")
                try:
                    call_command('migrate', verbosity=0, interactive=False)
                    print("[OK] Migraciones ejecutadas")
                except Exception as e2:
                    print(f"[WARNING] Error en migraciones: {e2}")
            
            # Crear superusuario
            try:
                if not User.objects.filter(username='admin').exists():
                    User.objects.create_superuser(
                        username='admin',
                        email='admin@dotacionesyazz.com',
                        password='admin123'
                    )
                    print("[OK] Usuario admin creado")
                else:
                    print("[OK] Usuario admin ya existe")
            except Exception as e:
                print(f"[WARNING] Error con usuario admin: {e}")
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Error configurando BD: {e}")
            return False
    
    def start_django_server(self):
        """Iniciar servidor Django"""
        print("[BACKEND] Iniciando servidor Django...")
        
        def run_server():
            try:
                import logging
                logging.getLogger('django.server').setLevel(logging.WARNING)
                
                call_command(
                    'runserver',
                    f'127.0.0.1:{self.backend_port}',
                    verbosity=0,
                    use_reloader=False,
                    use_threading=True
                )
                
            except Exception as e:
                print(f"[ERROR] Error en servidor Django: {e}")
        
        self.server_thread = threading.Thread(target=run_server, daemon=True)
        self.server_thread.start()
        
        # Verificar que funcione
        print("[BACKEND] Esperando que el servidor esté listo...")
        
        for attempt in range(30):
            try:
                import urllib.request
                url = f'http://127.0.0.1:{self.backend_port}/admin/'
                
                request = urllib.request.Request(url)
                with urllib.request.urlopen(request, timeout=2) as response:
                    if response.status in [200, 301, 302]:
                        print(f"[OK] Backend respondiendo en puerto {self.backend_port}")
                        return True
                        
            except Exception:
                if attempt < 29:
                    time.sleep(1)
                    if attempt % 5 == 0 and attempt > 0:
                        print(f"[INFO] Esperando backend... ({attempt + 1}/30)")
        
        print("[ERROR] Backend no responde")
        return False
    
    def find_npm(self):
        """Encontrar npm"""
        npm_commands = ['npm', 'npm.cmd']
        
        for npm_cmd in npm_commands:
            try:
                result = subprocess.run([npm_cmd, '--version'], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    print(f"[OK] npm encontrado: {npm_cmd}")
                    return npm_cmd
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
                continue
        
        print("[WARNING] npm no encontrado")
        return None
    
    def start_react_frontend(self):
        """Iniciar frontend React"""
        print("[FRONTEND] Configurando frontend React...")
        
        frontend_dir = self.work_dir / 'frontend'
        if not frontend_dir.exists():
            print("[WARNING] Directorio frontend no encontrado")
            return False
        
        npm_cmd = self.find_npm()
        if not npm_cmd:
            print("[WARNING] npm no disponible, saltando frontend React")
            return False
        
        try:
            # Cambiar al directorio frontend
            os.chdir(frontend_dir)
            
            # Variables de entorno para React
            env = os.environ.copy()
            env['BROWSER'] = 'none'
            env['PORT'] = str(self.frontend_port)
            env['REACT_APP_API_URL'] = f'http://127.0.0.1:{self.backend_port}/api'
            env['GENERATE_SOURCEMAP'] = 'false'
            
            # Verificar si node_modules existe
            node_modules = frontend_dir / 'node_modules'
            if not node_modules.exists():
                print("[FRONTEND] Instalando dependencias de React...")
                install_result = subprocess.run([
                    npm_cmd, 'install', '--silent'
                ], cwd=frontend_dir, env=env, capture_output=True, text=True, timeout=120)
                
                if install_result.returncode != 0:
                    print(f"[WARNING] Error instalando dependencias: {install_result.stderr}")
                    return False
                else:
                    print("[OK] Dependencias instaladas")
            
            # Iniciar React
            print(f"[FRONTEND] Iniciando React en puerto {self.frontend_port}")
            
            self.frontend_process = subprocess.Popen([
                npm_cmd, 'start'
            ], cwd=frontend_dir, env=env, 
               stdout=subprocess.PIPE, 
               stderr=subprocess.STDOUT,
               universal_newlines=True)
            
            # Esperar a que React esté listo
            print("[FRONTEND] Esperando React...")
            time.sleep(15)  # React tarda más en compilar
            
            # Verificar si React responde
            for attempt in range(10):
                try:
                    import urllib.request
                    url = f'http://127.0.0.1:{self.frontend_port}/'
                    
                    request = urllib.request.Request(url)
                    with urllib.request.urlopen(request, timeout=3) as response:
                        if response.status == 200:
                            print(f"[OK] React funcionando en puerto {self.frontend_port}")
                            return True
                except Exception:
                    time.sleep(2)
            
            print("[WARNING] React no responde, pero puede estar iniciando")
            return True  # No es error crítico
            
        except Exception as e:
            print(f"[WARNING] Error con React: {e}")
            return False
        finally:
            # Volver al directorio de trabajo
            os.chdir(self.work_dir)
    
    def open_browser(self):
        """Abrir navegador web"""
        print("[BROWSER] Abriendo navegador...")
        
        try:
            time.sleep(3)
            
            # Priorizar React si está disponible
            frontend_url = f'http://127.0.0.1:{self.frontend_port}/'
            admin_url = f'http://127.0.0.1:{self.backend_port}/admin/'
            
            # Probar React primero
            try:
                import urllib.request
                request = urllib.request.Request(frontend_url)
                with urllib.request.urlopen(request, timeout=3) as response:
                    if response.status == 200:
                        print(f"[BROWSER] Abriendo React: {frontend_url}")
                        webbrowser.open(frontend_url)
                        return True
            except:
                pass
            
            # Fallback a Django admin
            print(f"[BROWSER] Abriendo Django admin: {admin_url}")
            webbrowser.open(admin_url)
            
            print("[OK] Navegador abierto")
            return True
            
        except Exception as e:
            print(f"[WARNING] Error abriendo navegador: {e}")
            return True
    
    def cleanup(self):
        """Limpiar recursos"""
        print("[CLEANUP] Limpiando recursos...")
        
        # Terminar proceso React
        if self.frontend_process:
            try:
                self.frontend_process.terminate()
                self.frontend_process.wait(timeout=5)
            except:
                try:
                    self.frontend_process.kill()
                except:
                    pass
        
        time.sleep(1)
    
    def run(self):
        """Ejecutar aplicación principal"""
        print("DOTACIONES YAZZ - SISTEMA COMPLETO")
        print("=" * 50)
        
        steps = [
            ("Verificar puertos", self.simple_process_cleanup),
            ("Configurar archivos", self.setup_work_directory),
            ("Configurar Django", self.setup_django_environment),
            ("Configurar base de datos", self.setup_database),
            ("Iniciar backend", self.start_django_server),
            ("Iniciar frontend", self.start_react_frontend),
            ("Abrir navegador", self.open_browser)
        ]
        
        try:
            for i, (step_name, step_func) in enumerate(steps, 1):
                print(f"\n[{i}/{len(steps)}] {step_name}...")
                
                if not step_func():
                    print(f"[ERROR] Falló: {step_name}")
                    # Solo fallar si es backend crítico
                    if i <= 5:  # Los primeros 5 pasos son críticos
                        return False
            
            print("\n" + "=" * 50)
            print("🎉 ¡SISTEMA COMPLETO INICIADO!")
            print("=" * 50)
            print(f"🌐 Interfaz principal: http://127.0.0.1:{self.frontend_port}/")
            print(f"⚙️ Panel admin: http://127.0.0.1:{self.backend_port}/admin/")
            print(f"👤 Usuario: admin")
            print(f"🔑 Contraseña: admin123")
            print(f"📁 Datos: {self.work_dir}")
            print("\n💡 INSTRUCCIONES:")
            print("   • Se abrió automáticamente la interfaz principal")
            print("   • También puedes usar el panel admin de Django")
            print("   • Para cerrar: presiona Ctrl+C aquí")
            print("   • NO cierres esta ventana")
            print("=" * 50)
            
            # Mantener ejecutándose
            try:
                print("\n[INFO] Sistema funcionando... (Ctrl+C para cerrar)")
                while True:
                    time.sleep(5)
                    
                    # Verificar procesos
                    if self.server_thread and not self.server_thread.is_alive():
                        print("[WARNING] Backend se detuvo")
                        break
                    
                    if self.frontend_process and self.frontend_process.poll() is not None:
                        print("[WARNING] Frontend se detuvo")
                        # No romper, el admin aún funciona
                        
            except KeyboardInterrupt:
                print("\n[INFO] Cerrando sistema...")
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Error crítico: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            self.cleanup()

def main():
    """Punto de entrada principal"""
    try:
        launcher = DotacionesLauncher()
        success = launcher.run()
        
        if not success:
            print("\n❌ El sistema no pudo iniciarse completamente")
            print("💡 Revisa que Node.js esté instalado para el frontend")
            
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        success = False
    
    if not success:
        input("\nPresiona Enter para salir...")
    
    return success

if __name__ == "__main__":
    main()