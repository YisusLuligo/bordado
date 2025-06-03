#!/usr/bin/env python
"""
Constructor RÁPIDO - Solo lo esencial
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

def create_fast_spec():
    """Crear .spec optimizado para velocidad"""
    spec_content = '''# -*- mode: python ; coding: utf-8 -*-

# Solo archivos esenciales para velocidad
datas = [
    ('manage.py', '.'),
    ('backend', 'backend'),
    ('inventario', 'inventario'),
    ('clientes', 'clientes'), 
    ('pedidos', 'pedidos'),
    ('finanzas', 'finanzas'),
]

# Agregar frontend solo si no tiene node_modules pesado
import os
frontend_path = 'frontend'
if os.path.exists(frontend_path):
    # Excluir node_modules para velocidad
    for root, dirs, files in os.walk(frontend_path):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')  # No copiar node_modules
        for file in files:
            if not file.endswith(('.log', '.cache')):
                rel_path = os.path.relpath(os.path.join(root, file), '.')
                target_dir = os.path.dirname(rel_path) if os.path.dirname(rel_path) else '.'
                datas.append((rel_path, target_dir))

# Base de datos si existe
if os.path.exists('db.sqlite3'):
    datas.append(('db.sqlite3', '.'))

a = Analysis(
    ['dotaciones_yazz_launcher.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=[
        'django',
        'rest_framework', 
        'corsheaders',
        'backend.settings',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter', 'matplotlib', 'numpy', 'scipy', 'pandas',
        'PIL', 'cv2', 'tensorflow', 'torch', 'jupyter'
    ],
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='DotacionesYazz',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,  # Desactivar UPX para velocidad
    console=True,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,  # Desactivar UPX para velocidad
    name='DotacionesYazz',
)
'''
    
    with open('Fast.spec', 'w') as f:
        f.write(spec_content)
    print("✅ Spec rápido creado")

def clean_frontend():
    """Limpiar frontend para velocidad"""
    frontend = Path('frontend')
    if frontend.exists():
        # Eliminar node_modules temporalmente
        node_modules = frontend / 'node_modules'
        if node_modules.exists():
            print("🧹 Moviendo node_modules (temporal)...")
            shutil.move(str(node_modules), 'node_modules_backup')
        
        # Limpiar archivos temporales
        for pattern in ['**/.cache', '**/*.log', '**/coverage']:
            for item in frontend.glob(pattern):
                if item.exists():
                    shutil.rmtree(item) if item.is_dir() else item.unlink()

def restore_frontend():
    """Restaurar frontend después del build"""
    if Path('node_modules_backup').exists():
        print("🔄 Restaurando node_modules...")
        shutil.move('node_modules_backup', 'frontend/node_modules')

def build_fast():
    """Build súper rápido"""
    print("⚡ Build rápido iniciando...")
    
    # Limpiar builds anteriores
    for folder in ['build', 'dist']:
        if Path(folder).exists():
            shutil.rmtree(folder)
    
    try:
        # Limpiar para velocidad
        clean_frontend()
        
        # Build con menos verbosidad
        result = subprocess.run([
            sys.executable, '-m', 'PyInstaller', 
            'Fast.spec', '--clean', '--noconfirm'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Build completado")
            return True
        else:
            print(f"❌ Error: {result.stderr}")
            return False
            
    finally:
        # Restaurar siempre
        restore_frontend()

def create_simple_installer():
    """Instalador súper simple"""
    bat = '''@echo off
echo Instalando Dotaciones Yazz...

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

set "DIR=%USERPROFILE%\\DotacionesYazz"
mkdir "%DIR%" 2>nul
xcopy /E /Y "DotacionesYazz\\*" "%DIR%\\"

powershell -Command "$s = New-Object -comObject WScript.Shell; $sc = $s.CreateShortcut('%USERPROFILE%\\Desktop\\Dotaciones Yazz.lnk'); $sc.TargetPath = '%DIR%\\DotacionesYazz.exe'; $sc.Save()"

echo ¡Listo! Usuario: admin, Password: admin123
pause
'''
    
    with open('dist/INSTALAR.bat', 'w') as f:
        f.write(bat)

def main():
    print("⚡ CONSTRUCTOR RÁPIDO")
    print("=" * 30)
    
    if not Path('dotaciones_yazz_launcher.py').exists():
        print("❌ Falta dotaciones_yazz_launcher.py")
        return
    
    try:
        # PyInstaller check
        try:
            import PyInstaller
        except ImportError:
            print("📦 Instalando PyInstaller...")
            subprocess.run([sys.executable, '-m', 'pip', 'install', 'pyinstaller'])
        
        # Build rápido
        create_fast_spec()
        
        if build_fast():
            create_simple_installer()
            print("\n🎉 ¡Completado en tiempo récord!")
            print("📁 Archivos en: dist/")
        else:
            print("❌ Falló el build")
            
    except KeyboardInterrupt:
        print("\n🛑 Cancelado")
        restore_frontend()
    except Exception as e:
        print(f"❌ Error: {e}")
        restore_frontend()

if __name__ == "__main__":
    main()
    input("Presiona Enter...")