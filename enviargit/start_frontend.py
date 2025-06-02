#!/usr/bin/env python
"""
Script mejorado para iniciar el frontend React
"""

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

def check_node_installed():
    """Verificar si Node.js está instalado"""
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, text=True, check=True)
        print(f"✅ Node.js encontrado: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Node.js no está instalado")
        print("💡 Por favor instala Node.js desde: https://nodejs.org/")
        return False

def check_npm_installed():
    """Verificar si npm está instalado"""
    try:
        result = subprocess.run(['npm', '--version'], 
                              capture_output=True, text=True, check=True)
        print(f"✅ npm encontrado: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ npm no está instalado")
        return False

def install_dependencies():
    """Instalar dependencias de Node.js"""
    try:
        print("📦 Instalando dependencias...")
        
        # Cambiar al directorio frontend
        frontend_dir = Path(__file__).parent / 'frontend'
        if not frontend_dir.exists():
            print("❌ Error: No se encontró la carpeta 'frontend'")
            return False
        
        # Ejecutar npm install con más opciones
        result = subprocess.run([
            'npm', 'install', 
            '--legacy-peer-deps',  # Para resolver conflictos de dependencias
            '--no-audit'           # Acelerar instalación
        ], 
        cwd=frontend_dir, 
        check=True, 
        capture_output=False,  # Mostrar output en tiempo real
        text=True)
        
        print("✅ Dependencias instaladas correctamente")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error instalando dependencias: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def start_react_server():
    """Iniciar servidor de React con mejor manejo de errores"""
    try:
        frontend_dir = Path(__file__).parent / 'frontend'
        
        print("🚀 Iniciando servidor React...")
        print("🌐 La aplicación se abrirá en: http://localhost:3000")
        print("⚠️  Mantén esta ventana abierta mientras usas el sistema")
        print("🛑 Para detener el servidor, presiona Ctrl+C\n")
        
        # Verificar que package.json existe
        package_json = frontend_dir / 'package.json'
        if not package_json.exists():
            print("❌ Error: No se encontró package.json en la carpeta frontend")
            return False
        
        # Configurar variables de entorno
        env = os.environ.copy()
        env['BROWSER'] = 'none'  # No abrir navegador automáticamente
        env['PORT'] = '3000'     # Puerto específico
        
        # Abrir navegador después de unos segundos
        def open_browser():
            time.sleep(8)
            try:
                webbrowser.open('http://localhost:3000')
                print("🌐 Navegador abierto automáticamente")
            except Exception as e:
                print(f"⚠️ No se pudo abrir el navegador automáticamente: {e}")
                print("💡 Abre manualmente: http://localhost:3000")
        
        import threading
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        # Intentar diferentes comandos de inicio
        commands_to_try = [
            ['npm', 'start'],
            ['npx', 'react-scripts', 'start'],
            ['yarn', 'start']
        ]
        
        for cmd in commands_to_try:
            try:
                print(f"🔄 Intentando: {' '.join(cmd)}")
                process = subprocess.Popen(
                    cmd,
                    cwd=frontend_dir,
                    env=env,
                    shell=True  # Importante en Windows
                )
                
                # Esperar un poco para ver si el comando funciona
                time.sleep(3)
                if process.poll() is None:  # El proceso sigue corriendo
                    print(f"✅ Servidor iniciado con: {' '.join(cmd)}")
                    process.wait()  # Esperar hasta que termine
                    return True
                else:
                    print(f"❌ Falló: {' '.join(cmd)}")
                    continue
                    
            except FileNotFoundError:
                print(f"❌ Comando no encontrado: {' '.join(cmd)}")
                continue
            except Exception as e:
                print(f"❌ Error con {' '.join(cmd)}: {e}")
                continue
        
        print("❌ No se pudo iniciar el servidor React con ningún comando")
        return False
        
    except KeyboardInterrupt:
        print("\n🛑 Servidor React detenido por el usuario")
        if 'process' in locals():
            process.terminate()
        return True
    except Exception as e:
        print(f"❌ Error inesperado iniciando servidor React: {e}")
        return False

def main():
    """Función principal"""
    print("="*60)
    print("🌐 FRONTEND REACT - DOTACIONES YAZZ")
    print("="*60)
    
    # Verificar que estemos en el directorio correcto
    if not os.path.exists('frontend'):
        print("❌ Error: No se encontró la carpeta 'frontend'")
        print("💡 Asegúrate de ejecutar este script desde la raíz del proyecto")
        input("Presiona Enter para salir...")
        return
    
    # Verificar requisitos
    if not check_node_installed():
        input("Presiona Enter para salir...")
        return
    
    if not check_npm_installed():
        input("Presiona Enter para salir...")
        return
    
    # Verificar si existen las dependencias
    frontend_dir = Path(__file__).parent / 'frontend'
    node_modules = frontend_dir / 'node_modules'
    
    if not node_modules.exists() or not any(node_modules.iterdir()):
        print("📦 Dependencias no encontradas o incompletas, instalando...")
        if not install_dependencies():
            input("Presiona Enter para salir...")
            return
    else:
        print("✅ Dependencias verificadas")
    
    print("\n🔗 IMPORTANTE: Asegúrate de que el backend esté corriendo")
    print("   Backend debe estar en: http://127.0.0.1:8000")
    print("   (Ejecuta start_server.py en otra ventana)")
    print()
    
    # Iniciar servidor React
    try:
        start_react_server()
    except KeyboardInterrupt:
        print("\n👋 ¡Hasta luego!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    
    input("\nPresiona Enter para salir...")

if __name__ == "__main__":
    main()