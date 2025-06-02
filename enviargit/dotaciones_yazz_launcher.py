#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Launcher WINDOWS para Dotaciones Yazz - SIN EMOJIS
Version corregida para ejecutables Windows
"""

import os
import sys
import subprocess
import time
import threading
import webbrowser
import shutil
import socket
import psutil
from pathlib import Path

class WindowsLauncher:
    def __init__(self):
        # Detectar si estamos en ejecutable
        if getattr(sys, 'frozen', False):
            self.base_dir = Path(sys._MEIPASS)
            self.work_dir = Path.home() / 'Documents' / 'DotacionesYazz'
            self.work_dir.mkdir(parents=True, exist_ok=True)
            self.is_exe = True
            print(f"[EJECUTABLE] Modo ejecutable activado")
            print(f"[EJECUTABLE] Base: {self.base_dir}")
            print(f"[EJECUTABLE] Work: {self.work_dir}")
        else:
            self.base_dir = Path(__file__).parent
            self.work_dir = self.base_dir
            self.is_exe = False
            print(f"[DESARROLLO] Modo desarrollo - Dir: {self.base_dir}")
        
        self.backend_process = None
        self.frontend_process = None
        self.backend_port = self.find_free_port(8000)
        self.frontend_port = self.find_free_port(3000)
        
        print(f"[CONFIG] Backend usara puerto: {self.backend_port}")
        print(f"[CONFIG] Frontend usara puerto: {self.frontend_port}")
    
    def find_free_port(self, start_port):
        """Encontrar un puerto libre"""
        for port in range(start_port, start_port + 100):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.bind(('127.0.0.1', port))
                sock.close()
                return port
            except OSError:
                continue
        return start_port
    
    def kill_existing_processes(self):
        """Matar procesos existentes de Django y React"""
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    cmdline = ' '.join(proc.info['cmdline'] or [])
                    if ('runserver' in cmdline or 'manage.py' in cmdline or 
                        'npm start' in cmdline or 'react-scripts' in cmdline):
                        print(f"[LIMPIEZA] Matando proceso: {proc.info['name']} (PID: {proc.info['pid']})")
                        proc.kill()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
        except Exception as e:
            print(f"[WARNING] Error matando procesos: {e}")
    
    def setup_work_dir(self):
        """Copiar archivos necesarios al directorio de trabajo"""
        if not self.is_exe:
            return True
        
        print("[SETUP] Configurando directorio de trabajo...")
        
        try:
            # Lista de archivos y carpetas a copiar
            items_to_copy = [
                'manage.py',
                'backend',
                'inventario', 
                'clientes',
                'pedidos',
                'finanzas',
                'frontend'
            ]
            
            for item in items_to_copy:
                src = self.base_dir / item
                dst = self.work_dir / item
                
                if src.exists():
                    if src.is_file():
                        if not dst.exists() or src.stat().st_mtime > dst.stat().st_mtime:
                            print(f"[COPY] Copiando archivo: {item}")
                            shutil.copy2(src, dst)
                    else:
                        if not dst.exists():
                            print(f"[COPY] Copiando carpeta: {item}")
                            shutil.copytree(src, dst, dirs_exist_ok=True)
                else:
                    print(f"[WARNING] No se encontro: {item}")
            
            # Copiar base de datos inicial si no existe
            db_src = self.base_dir / 'db.sqlite3'
            db_dst = self.work_dir / 'db.sqlite3'
            if db_src.exists() and not db_dst.exists():
                print("[COPY] Copiando base de datos inicial...")
                shutil.copy2(db_src, db_dst)
            
            # Verificar archivos críticos
            critical_files = [
                self.work_dir / 'manage.py',
                self.work_dir / 'backend' / 'settings.py',
                self.work_dir / 'frontend' / 'package.json'
            ]
            
            for file in critical_files:
                if not file.exists():
                    print(f"[ERROR] Archivo critico faltante: {file}")
                    return False
                else:
                    print(f"[OK] Archivo critico OK: {file.name}")
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Error configurando directorio: {e}")
            return False
    
    def setup_database(self):
        """Configurar base de datos"""
        print("[DATABASE] Configurando base de datos...")
        
        try:
            os.chdir(self.work_dir)
            
            # Verificar que manage.py existe
            if not (self.work_dir / 'manage.py').exists():
                print("[ERROR] manage.py no encontrado")
                return False
            
            # Configurar variables de entorno
            env = os.environ.copy()
            env['DJANGO_SETTINGS_MODULE'] = 'backend.settings'
            env['PYTHONPATH'] = str(self.work_dir)
            env['PYTHONIOENCODING'] = 'utf-8'
            
            # Verificar si la base de datos necesita migraciones
            db_path = self.work_dir / 'dotaciones_yazz.db'
            need_migrations = not db_path.exists()
            
            if need_migrations:
                print("[DATABASE] Ejecutando migraciones...")
                result = subprocess.run([
                    sys.executable, 'manage.py', 'migrate', '--verbosity=0'
                ], env=env, capture_output=True, text=True, timeout=60)
                
                if result.returncode != 0:
                    print(f"[ERROR] Error en migraciones: {result.stderr}")
                    return False
                else:
                    print("[OK] Migraciones completadas")
            
            # Crear superusuario solo si no existe
            try:
                os.environ.update(env)
                import django
                django.setup()
                from django.contrib.auth.models import User
                
                if not User.objects.filter(username='admin').exists():
                    print("[DATABASE] Creando usuario admin...")
                    User.objects.create_superuser('admin', 'admin@test.com', 'admin123')
                    print("[OK] Usuario admin creado")
                else:
                    print("[OK] Usuario admin ya existe")
                    
            except Exception as e:
                print(f"[WARNING] Error creando usuario: {e}")
            
            return True
            
        except subprocess.TimeoutExpired:
            print("[ERROR] Timeout configurando base de datos")
            return False
        except Exception as e:
            print(f"[ERROR] Error configurando base de datos: {e}")
            return False
    
    def start_backend(self):
        """Iniciar Django"""
        print("[BACKEND] Iniciando servidor backend...")
        
        def run():
            try:
                os.chdir(self.work_dir)
                
                # Configurar entorno
                env = os.environ.copy()
                env['DJANGO_SETTINGS_MODULE'] = 'backend.settings'
                env['PYTHONPATH'] = str(self.work_dir)
                env['PYTHONIOENCODING'] = 'utf-8'
                
                # Comando con parámetros específicos
                cmd = [
                    sys.executable, 'manage.py', 'runserver', 
                    f'127.0.0.1:{self.backend_port}',
                    '--noreload',
                    '--nothreading'
                ]
                
                print(f"[BACKEND] Ejecutando comando: {' '.join(cmd)}")
                
                # Ejecutar servidor
                self.backend_process = subprocess.Popen(
                    cmd,
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    universal_newlines=True,
                    bufsize=1
                )
                
                # Monitorear salida
                for line in iter(self.backend_process.stdout.readline, ''):
                    if line.strip():
                        print(f"[BACKEND] {line.strip()}")
                        if "Starting development server" in line:
                            print("[OK] Servidor backend iniciado")
                        elif "Quit the server" in line:
                            print("[INFO] Servidor backend listo para cerrar")
                
            except Exception as e:
                print(f"[ERROR] Error en backend: {e}")
        
        # Iniciar en hilo separado
        backend_thread = threading.Thread(target=run, daemon=True)
        backend_thread.start()
        
        # Verificar que el backend esté funcionando
        max_attempts = 30
        for attempt in range(max_attempts):
            try:
                import urllib.request
                import urllib.error
                
                url = f'http://127.0.0.1:{self.backend_port}'
                print(f"[BACKEND] Verificando backend ({attempt + 1}/{max_attempts}): {url}")
                
                request = urllib.request.Request(url)
                request.add_header('User-Agent', 'DotacionesYazz/1.0')
                
                with urllib.request.urlopen(request, timeout=3) as response:
                    if response.status == 200:
                        print("[OK] Backend respondiendo correctamente")
                        return True
                        
            except urllib.error.URLError as e:
                if attempt < max_attempts - 1:
                    time.sleep(2)
                else:
                    print(f"[ERROR] Backend no responde despues de {max_attempts} intentos: {e}")
            except Exception as e:
                print(f"[WARNING] Error verificando backend: {e}")
                time.sleep(2)
        
        return False
    
    def find_npm(self):
        """Encontrar npm"""
        npm_paths = [
            'npm',
            'npm.cmd', 
            'C:\\Program Files\\nodejs\\npm.cmd',
            'C:\\Program Files (x86)\\nodejs\\npm.cmd',
        ]
        
        # Buscar en PATH
        for path_dir in os.environ.get('PATH', '').split(os.pathsep):
            npm_paths.extend([
                os.path.join(path_dir, 'npm'),
                os.path.join(path_dir, 'npm.cmd'),
                os.path.join(path_dir, 'npm.exe')
            ])
        
        for npm_path in npm_paths:
            try:
                result = subprocess.run([npm_path, '--version'], 
                                      capture_output=True, check=True, timeout=10)
                version = result.stdout.decode().strip()
                print(f"[OK] npm encontrado: {npm_path} (v{version})")
                return npm_path
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
                continue
        
        print("[ERROR] npm no encontrado en el sistema")
        return None
    
    def start_frontend(self):
        """Iniciar React"""
        npm_path = self.find_npm()
        if not npm_path:
            print("[ERROR] No se puede iniciar frontend sin npm")
            return False
        
        frontend_dir = self.work_dir / 'frontend'
        if not frontend_dir.exists():
            print(f"[ERROR] Directorio frontend no existe: {frontend_dir}")
            return False
        
        print(f"[FRONTEND] Iniciando frontend en: {frontend_dir}")
        
        def run():
            try:
                # Configurar entorno
                env = os.environ.copy()
                env['BROWSER'] = 'none'
                env['PORT'] = str(self.frontend_port)
                env['REACT_APP_API_URL'] = f'http://127.0.0.1:{self.backend_port}/api'
                env['GENERATE_SOURCEMAP'] = 'false'
                env['NODE_ENV'] = 'production'
                
                # Instalar dependencias si es necesario
                node_modules = frontend_dir / 'node_modules'
                if not node_modules.exists():
                    print("[FRONTEND] Instalando dependencias del frontend...")
                    install_result = subprocess.run([
                        npm_path, 'install', '--production', '--silent'
                    ], cwd=frontend_dir, env=env, capture_output=True, text=True, timeout=300)
                    
                    if install_result.returncode != 0:
                        print(f"[ERROR] Error instalando dependencias: {install_result.stderr}")
                        return
                    else:
                        print("[OK] Dependencias instaladas")
                
                # Iniciar servidor de desarrollo
                print(f"[FRONTEND] Iniciando servidor React en puerto {self.frontend_port}")
                
                self.frontend_process = subprocess.Popen([
                    npm_path, 'start'
                ], cwd=frontend_dir, env=env, 
                   stdout=subprocess.PIPE, 
                   stderr=subprocess.STDOUT,
                   universal_newlines=True)
                
                # Monitorear salida
                for line in iter(self.frontend_process.stdout.readline, ''):
                    if line.strip():
                        print(f"[FRONTEND] {line.strip()}")
                        if "webpack compiled" in line.lower() or "compiled successfully" in line.lower():
                            print("[OK] Frontend compilado exitosamente")
                            
            except subprocess.TimeoutExpired:
                print("[ERROR] Timeout instalando dependencias del frontend")
            except Exception as e:
                print(f"[ERROR] Error en frontend: {e}")
        
        # Iniciar en hilo separado
        frontend_thread = threading.Thread(target=run, daemon=True)
        frontend_thread.start()
        
        # Esperar y abrir navegador
        print("[FRONTEND] Esperando que el frontend este listo...")
        time.sleep(15)
        
        try:
            frontend_url = f'http://localhost:{self.frontend_port}'
            print(f"[FRONTEND] Abriendo navegador: {frontend_url}")
            webbrowser.open(frontend_url)
            print("[OK] Frontend iniciado")
            return True
        except Exception as e:
            print(f"[WARNING] Error abriendo navegador: {e}")
            return True
    
    def cleanup(self):
        """Limpiar procesos"""
        print("[CLEANUP] Limpiando procesos...")
        
        try:
            if self.backend_process and self.backend_process.poll() is None:
                print("[CLEANUP] Terminando proceso backend...")
                self.backend_process.terminate()
                try:
                    self.backend_process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self.backend_process.kill()
        except Exception as e:
            print(f"[WARNING] Error cerrando backend: {e}")
        
        try:
            if self.frontend_process and self.frontend_process.poll() is None:
                print("[CLEANUP] Terminando proceso frontend...")
                self.frontend_process.terminate()
                try:
                    self.frontend_process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self.frontend_process.kill()
        except Exception as e:
            print(f"[WARNING] Error cerrando frontend: {e}")
        
        self.kill_existing_processes()
    
    def run(self):
        """Ejecutar aplicación"""
        print("DOTACIONES YAZZ - LAUNCHER WINDOWS")
        print("=" * 50)
        
        try:
            # Limpiar procesos existentes
            self.kill_existing_processes()
            
            print("\n[PASO 1] Configurando archivos...")
            if not self.setup_work_dir():
                print("[ERROR] Error configurando archivos")
                return False
            
            print("\n[PASO 2] Configurando base de datos...")
            if not self.setup_database():
                print("[ERROR] Error configurando base de datos")
                return False
            
            print("\n[PASO 3] Iniciando backend...")
            if not self.start_backend():
                print("[ERROR] Error iniciando backend")
                return False
            
            print("\n[PASO 4] Iniciando frontend...")
            if not self.start_frontend():
                print("[ERROR] Error iniciando frontend")
                return False
            
            print("\n" + "=" * 50)
            print("¡SISTEMA INICIADO EXITOSAMENTE!")
            print("=" * 50)
            print(f"Frontend: http://localhost:{self.frontend_port}")
            print(f"Backend:  http://127.0.0.1:{self.backend_port}")
            print(f"Datos:    {self.work_dir}")
            print("Usuario:  admin")
            print("Password: admin123")
            print("\nPresiona Ctrl+C para cerrar")
            print("=" * 50)
            
            try:
                while True:
                    if (self.backend_process and self.backend_process.poll() is not None):
                        print("[WARNING] El proceso backend se cerro inesperadamente")
                        break
                    
                    if (self.frontend_process and self.frontend_process.poll() is not None):
                        print("[WARNING] El proceso frontend se cerro inesperadamente")
                        break
                    
                    time.sleep(5)
                    
            except KeyboardInterrupt:
                print("\n[INFO] Cerrando aplicacion...")
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Error critico: {e}")
            return False
        finally:
            self.cleanup()
            print("[INFO] Aplicacion cerrada!")

def main():
    """Punto de entrada principal"""
    launcher = WindowsLauncher()
    success = launcher.run()
    
    if not success:
        print("\n[ERROR] La aplicacion no pudo iniciarse correctamente")
        print("[INFO] Revisa los mensajes de error anteriores")
        input("Presiona Enter para salir...")
    
    return success

if __name__ == "__main__":
    main()