#!/usr/bin/env python
"""
Launcher Simple para Dotaciones Yazz
"""

import os
import sys
import subprocess
import time
import threading
import webbrowser
import shutil
from pathlib import Path

class SimpleLauncher:
    def __init__(self):
        # Detectar si estamos en ejecutable
        if getattr(sys, 'frozen', False):
            self.base_dir = Path(sys._MEIPASS)
            self.work_dir = Path.home() / 'Documents' / 'DotacionesYazz'
            self.work_dir.mkdir(exist_ok=True)
            self.is_exe = True
        else:
            self.base_dir = Path(__file__).parent
            self.work_dir = self.base_dir
            self.is_exe = False
        
        self.backend_process = None
        self.frontend_process = None
    
    def setup_work_dir(self):
        """Copiar archivos necesarios al directorio de trabajo"""
        if self.is_exe:
            files_to_copy = ['manage.py', 'backend', 'inventario', 'clientes', 'pedidos', 'finanzas', 'frontend']
            
            for item in files_to_copy:
                src = self.base_dir / item
                dst = self.work_dir / item
                
                if src.exists() and not dst.exists():
                    if src.is_file():
                        shutil.copy2(src, dst)
                    else:
                        shutil.copytree(src, dst, dirs_exist_ok=True)
            
            # Copiar base de datos si existe
            db_src = self.base_dir / 'db.sqlite3'
            db_dst = self.work_dir / 'db.sqlite3'
            if db_src.exists() and not db_dst.exists():
                shutil.copy2(db_src, db_dst)
        
        os.chdir(self.work_dir)
    
    def find_npm(self):
        """Encontrar npm"""
        npm_paths = ['npm', 'npm.cmd', 'C:\\Program Files\\nodejs\\npm.cmd']
        
        for npm_path in npm_paths:
            try:
                subprocess.run([npm_path, '--version'], capture_output=True, check=True)
                return npm_path
            except:
                continue
        return None
    
    def setup_database(self):
        """Configurar base de datos"""
        if not (self.work_dir / 'db.sqlite3').exists():
            print("📋 Creando base de datos...")
            subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)
            
            # Crear superusuario
            try:
                os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
                import django
                django.setup()
                from django.contrib.auth.models import User
                
                if not User.objects.filter(username='admin').exists():
                    User.objects.create_superuser('admin', 'admin@test.com', 'admin123')
                    print("👤 Usuario admin creado")
            except:
                pass
    
    def start_backend(self):
        """Iniciar Django"""
        def run():
            env = os.environ.copy()
            env['DJANGO_SETTINGS_MODULE'] = 'backend.settings'
            self.backend_process = subprocess.Popen([
                sys.executable, 'manage.py', 'runserver', '127.0.0.1:8000', '--noreload'
            ], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            self.backend_process.wait()
        
        threading.Thread(target=run, daemon=True).start()
        
        # Esperar Django
        for _ in range(30):
            try:
                import urllib.request
                urllib.request.urlopen('http://127.0.0.1:8000', timeout=1)
                print("✅ Backend listo")
                return True
            except:
                time.sleep(1)
        
        print("⚠️ Backend tardó en iniciar")
        return True
    
    def start_frontend(self):
        """Iniciar React"""
        npm_path = self.find_npm()
        if not npm_path:
            print("❌ npm no encontrado")
            return False
        
        frontend_dir = self.work_dir / 'frontend'
        
        # Instalar dependencias si no existen
        if not (frontend_dir / 'node_modules').exists():
            print("📦 Instalando dependencias...")
            subprocess.run([npm_path, 'install'], cwd=frontend_dir, check=True)
        
        def run():
            env = os.environ.copy()
            env['BROWSER'] = 'none'
            self.frontend_process = subprocess.Popen([
                npm_path, 'start'
            ], cwd=frontend_dir, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            self.frontend_process.wait()
        
        threading.Thread(target=run, daemon=True).start()
        
        # Abrir navegador
        time.sleep(8)
        webbrowser.open('http://localhost:3000')
        print("✅ Frontend listo")
        return True
    
    def cleanup(self):
        """Limpiar procesos"""
        if self.backend_process:
            self.backend_process.terminate()
        if self.frontend_process:
            self.frontend_process.terminate()
    
    def run(self):
        """Ejecutar aplicación"""
        print("🏪 DOTACIONES YAZZ")
        print("=" * 30)
        
        try:
            # Configurar
            self.setup_work_dir()
            self.setup_database()
            
            # Iniciar servicios
            print("🚀 Iniciando backend...")
            if not self.start_backend():
                return False
            
            print("🌐 Iniciando frontend...")
            if not self.start_frontend():
                return False
            
            print("\n✅ Sistema iniciado")
            print("🌐 Interfaz: http://localhost:3000")
            print("👤 Usuario: admin / Contraseña: admin123")
            print("🛑 Presiona Ctrl+C para cerrar")
            
            # Esperar
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n🛑 Cerrando...")
                self.cleanup()
                print("👋 ¡Hasta luego!")
            
            return True
            
        except Exception as e:
            print(f"❌ Error: {e}")
            self.cleanup()
            return False

def main():
    launcher = SimpleLauncher()
    launcher.run()

if __name__ == "__main__":
    main()