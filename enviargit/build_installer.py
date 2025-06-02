#!/usr/bin/env python
"""
Script para crear el ejecutable con PyInstaller - Versión corregida
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

def create_spec_file():
    """Crear archivo .spec personalizado para PyInstaller"""
    spec_content = '''# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['dotaciones_yazz.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('manage.py', '.'),
        ('backend', 'backend'),
        ('inventario', 'inventario'),
        ('clientes', 'clientes'),
        ('pedidos', 'pedidos'),
        ('finanzas', 'finanzas'),
        ('db.sqlite3', '.'),
        ('frontend/build', 'frontend/build'),
        ('frontend/package.json', 'frontend'),
        ('frontend/public', 'frontend/public'),
        ('frontend/src', 'frontend/src'),
    ],
    hiddenimports=[
        'django',
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        'rest_framework',
        'corsheaders',
        'inventario',
        'clientes',
        'pedidos',
        'finanzas',
        'sqlite3',
        'backend.settings',
        'backend.urls',
        'backend.wsgi',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='DotacionesYazz',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
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
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='DotacionesYazz',
)
'''
    
    with open('dotaciones_yazz.spec', 'w', encoding='utf-8') as f:
        f.write(spec_content)
    
    print("✅ Archivo .spec creado")

def check_react_build():
    """Verificar que existe el build de React"""
    build_path = Path('frontend/build')
    if build_path.exists() and any(build_path.iterdir()):
        print("✅ Build de React encontrado")
        return True
    else:
        print("❌ No se encontró el build de React")
        print("💡 Ejecuta: cd frontend && npm run build")
        return False

def install_pyinstaller():
    """Instalar PyInstaller si no está disponible"""
    try:
        import PyInstaller
        print("✅ PyInstaller ya está instalado")
        return True
    except ImportError:
        print("📦 Instalando PyInstaller...")
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', 'pyinstaller'], check=True)
            print("✅ PyInstaller instalado")
            return True
        except subprocess.CalledProcessError:
            print("❌ Error instalando PyInstaller")
            return False

def create_executable():
    """Crear el ejecutable con PyInstaller"""
    print("🔨 Creando ejecutable...")
    
    try:
        # Usar el archivo .spec personalizado
        result = subprocess.run(
            [sys.executable, '-m', 'PyInstaller', 'dotaciones_yazz.spec', '--clean', '--noconfirm'],
            check=True,
            capture_output=True,
            text=True
        )
        print("✅ Ejecutable creado en dist/DotacionesYazz/")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error creando ejecutable: {e}")
        print(f"Error output: {e.stderr}")
        return False

def create_installer_script():
    """Crear script batch para facilitar la instalación"""
    batch_content = '''@echo off
echo ================================================
echo DOTACIONES YAZZ - INSTALADOR AUTOMATICO
echo ================================================
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    echo.
    echo Por favor descarga e instala Node.js desde:
    echo https://nodejs.org/
    echo.
    echo Una vez instalado Node.js, ejecuta este instalador nuevamente.
    pause
    exit /b 1
)

echo ✅ Node.js detectado correctamente
echo.

REM Crear carpeta de instalación
set INSTALL_DIR=%USERPROFILE%\\DotacionesYazz
echo 📁 Instalando en: %INSTALL_DIR%
echo.

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo 📦 Copiando archivos del sistema...
xcopy /E /I /Y "DotacionesYazz\\*" "%INSTALL_DIR%" >nul 2>&1

echo.
echo 🔗 Creando acceso directo en el escritorio...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\\Desktop\\Dotaciones Yazz.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\\DotacionesYazz.exe'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\\DotacionesYazz.exe'; $Shortcut.Save()" >nul 2>&1

echo.
echo ================================================
echo ✅ INSTALACION COMPLETADA EXITOSAMENTE
echo ================================================
echo.
echo 📍 El sistema se instaló en:
echo    %INSTALL_DIR%
echo.
echo 🖥️  Acceso directo creado en el escritorio:
echo    "Dotaciones Yazz"
echo.
echo 🚀 COMO USAR EL SISTEMA:
echo    1. Haz doble clic en "Dotaciones Yazz" del escritorio
echo    2. O ejecuta: %INSTALL_DIR%\\DotacionesYazz.exe
echo    3. El sistema se abrirá automáticamente en tu navegador
echo.
echo 👤 CREDENCIALES INICIALES:
echo    Usuario: admin
echo    Contraseña: admin123
echo.
echo 📋 CARACTERISTICAS:
echo    • Gestión de Inventario
echo    • Administración de Clientes  
echo    • Control de Pedidos
echo    • Módulo Financiero
echo.
echo ⚠️  IMPORTANTE:
echo    • El sistema funciona completamente offline
echo    • Los datos se guardan automáticamente
echo    • Mantén la ventana del sistema abierta mientras lo uses
echo.
pause
'''
    
    with open('dist/instalar.bat', 'w', encoding='utf-8') as f:
        f.write(batch_content)
    
    print("✅ Instalador automático creado: dist/instalar.bat")

def create_readme():
    """Crear archivo README para el instalador"""
    readme_content = '''# DOTACIONES YAZZ - Sistema de Gestión Integral

## 🚀 INSTALACIÓN RÁPIDA

1. **Requisito:** Tener Node.js instalado
   - Descarga desde: https://nodejs.org/
   - Versión recomendada: 16 o superior

2. **Instalar el sistema:**
   - Ejecuta `instalar.bat` como administrador
   - El sistema se instalará automáticamente

3. **Usar el sistema:**
   - Doble clic en "Dotaciones Yazz" del escritorio
   - Se abrirá automáticamente en tu navegador

## 👤 CREDENCIALES INICIALES

- **Usuario:** admin
- **Contraseña:** admin123

## 📋 MÓDULOS INCLUIDOS

- 📦 **Gestión de Inventario**
  - Control de productos y stock
  - Categorías y proveedores
  - Alertas de reposición

- 👥 **Administración de Clientes**
  - Registro completo de clientes
  - Historial de compras
  - Descuentos especiales

- 📋 **Control de Pedidos**
  - Seguimiento de estados
  - Gestión de entregas
  - Control de tiempos

- 💰 **Módulo Financiero**
  - Ventas directas
  - Reportes y análisis
  - Dashboard en tiempo real

## 🔧 CARACTERÍSTICAS TÉCNICAS

- **Base de datos:** SQLite (incluida)
- **Interfaz:** React (moderna y responsive)
- **Backend:** Django (robusto y escalable)
- **Funcionamiento:** Completamente offline
- **Compatibilidad:** Windows 10/11

## 📞 SOPORTE

- El sistema funciona de forma autónoma
- Los datos se guardan automáticamente
- Para soporte técnico, contacta al desarrollador

---
**Desarrollado para Dotaciones Yazz**
**Versión 1.0 - Sistema de Gestión Integral**
'''
    
    with open('dist/README.txt', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print("✅ Manual de usuario creado: dist/README.txt")

def create_user_guide():
    """Crear guía rápida de uso"""
    guide_content = '''# GUÍA RÁPIDA DE USO - DOTACIONES YAZZ

## 🚀 PRIMEROS PASOS

1. **Iniciar el sistema:**
   - Doble clic en "Dotaciones Yazz" del escritorio
   - Espera a que se abra el navegador automáticamente

2. **Primer acceso:**
   - Usuario: admin
   - Contraseña: admin123
   - Cambia la contraseña en el panel de administración

## 📋 FLUJO DE TRABAJO RECOMENDADO

### 1. CONFIGURACIÓN INICIAL
- Crear categorías de productos
- Registrar productos del inventario
- Cargar clientes principales

### 2. OPERACIÓN DIARIA
- Registrar nuevos pedidos
- Actualizar estados de pedidos
- Procesar ventas directas
- Revisar alertas de stock

### 3. SEGUIMIENTO
- Consultar dashboard financiero
- Revisar reportes de ventas
- Actualizar inventario

## 🔧 CONSEJOS DE USO

- **Mantén la ventana abierta** mientras uses el sistema
- **Los datos se guardan automáticamente**
- **Usa Ctrl+C en la consola** para cerrar el sistema
- **Accede al panel admin** para configuraciones avanzadas

## 📊 URLS IMPORTANTES

- **Sistema principal:** http://localhost:3000
- **Panel admin:** http://127.0.0.1:8000/admin
- **API:** http://127.0.0.1:8000/api

¡Listo para gestionar tu negocio de forma eficiente!
'''
    
    with open('dist/GUIA_DE_USO.txt', 'w', encoding='utf-8') as f:
        f.write(guide_content)
    
    print("✅ Guía de uso creada: dist/GUIA_DE_USO.txt")

def main():
    """Función principal"""
    print("="*50)
    print("🏗️ CONSTRUCTOR DE INSTALADOR - DOTACIONES YAZZ")
    print("="*50)
    
    # Verificaciones iniciales
    if not os.path.exists('dotaciones_yazz.py'):
        print("❌ Error: No se encontró dotaciones_yazz.py")
        return False
    
    if not os.path.exists('frontend'):
        print("❌ Error: No se encontró la carpeta frontend")
        return False
    
    # Verificar que existe el build de React
    if not check_react_build():
        return False
    
    # Instalar PyInstaller
    if not install_pyinstaller():
        return False
    
    # Limpiar builds anteriores
    if os.path.exists('dist'):
        print("🧹 Limpiando builds anteriores...")
        shutil.rmtree('dist')
    
    if os.path.exists('build'):
        shutil.rmtree('build')
    
    # Crear archivo .spec
    create_spec_file()
    
    # Crear ejecutable
    if not create_executable():
        return False
    
    # Crear archivos adicionales
    create_installer_script()
    create_readme()
    create_user_guide()
    
    print("\n" + "="*60)
    print("🎉 ¡INSTALADOR CREADO EXITOSAMENTE!")
    print("="*60)
    print("📁 Ubicación: dist/")
    print("📋 Archivos creados:")
    print("   • DotacionesYazz/ (aplicación completa)")
    print("   • instalar.bat (instalador automático)")
    print("   • README.txt (manual técnico)")
    print("   • GUIA_DE_USO.txt (guía de usuario)")
    print()
    print("🚀 PARA DISTRIBUIR:")
    print("   1. Comprime toda la carpeta 'dist' en un ZIP")
    print("   2. Nómbralo: DotacionesYazz_Instalador.zip")
    print("   3. Distribuye el ZIP a los usuarios")
    print()
    print("👤 INSTRUCCIONES PARA USUARIOS:")
    print("   1. Extraer el ZIP")
    print("   2. Ejecutar instalar.bat como administrador")
    print("   3. Doble clic en acceso directo del escritorio")
    print("   4. ¡Sistema funcionando automáticamente!")
    print("="*60)
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        print("\n❌ Error en la construcción del instalador")
    input("\nPresiona Enter para continuar...")