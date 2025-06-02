#!/usr/bin/env python
"""
Script de BUILD MEJORADO para Dotaciones Yazz
Soluciona problemas de backend en ejecutables
"""

import os
import sys
import shutil
import subprocess
import time
import platform
from pathlib import Path

class DotacionesBuilder:
    def __init__(self):
        self.project_dir = Path(__file__).parent
        self.build_dir = self.project_dir / 'build'
        self.dist_dir = self.project_dir / 'dist'
        self.spec_file = self.project_dir / 'Fast_Fixed.spec'
        
        print("🏗️ CONSTRUCTOR MEJORADO DE DOTACIONES YAZZ")
        print("=" * 60)
        print(f"📁 Directorio del proyecto: {self.project_dir}")
        print(f"🎯 Sistema operativo: {platform.system()}")
        print(f"🐍 Python: {sys.version}")
        print("=" * 60)
    
    def check_requirements(self):
        """Verificar que todos los requisitos estén instalados"""
        print("🔍 Verificando requisitos...")
        
        required_files = [
            'dotaciones_yazz_launcher.py',
            'manage.py',
            'backend/settings.py',
            'requirements.txt'
        ]
        
        missing_files = []
        for file in required_files:
            file_path = self.project_dir / file
            if not file_path.exists():
                missing_files.append(file)
            else:
                print(f"✅ {file}")
        
        if missing_files:
            print("❌ Archivos faltantes:")
            for file in missing_files:
                print(f"   - {file}")
            return False
        
        # Verificar PyInstaller
        try:
            import PyInstaller
            print(f"✅ PyInstaller: {PyInstaller.__version__}")
        except ImportError:
            print("❌ PyInstaller no está instalado")
            print("💡 Instálalo con: pip install pyinstaller")
            return False
        
        # Verificar Django
        try:
            import django
            print(f"✅ Django: {django.__version__}")
        except ImportError:
            print("❌ Django no está instalado")
            return False
        
        # Verificar psutil (para el launcher mejorado)
        try:
            import psutil
            print(f"✅ psutil: {psutil.__version__}")
        except ImportError:
            print("⚠️ psutil no está instalado, instalando...")
            try:
                subprocess.run([sys.executable, '-m', 'pip', 'install', 'psutil'], check=True)
                print("✅ psutil instalado exitosamente")
            except subprocess.CalledProcessError:
                print("❌ Error instalando psutil")
                return False
        
        return True
    
    def install_dependencies(self):
        """Instalar dependencias necesarias para el build"""
        print("\n📦 Instalando dependencias de build...")
        
        build_deps = [
            'pyinstaller>=6.0',
            'psutil>=5.9.0',
        ]
        
        for dep in build_deps:
            try:
                print(f"📦 Instalando {dep}...")
                subprocess.run([
                    sys.executable, '-m', 'pip', 'install', dep
                ], check=True, capture_output=True)
                print(f"✅ {dep} instalado")
            except subprocess.CalledProcessError as e:
                print(f"⚠️ Error instalando {dep}: {e}")
    
    def prepare_files(self):
        """Preparar archivos para el build"""
        print("\n📁 Preparando archivos...")
        
        # Crear archivo de launcher corregido si no existe
        launcher_file = self.project_dir / 'dotaciones_yazz_launcher.py'
        if not launcher_file.exists():
            print("📝 Creando launcher corregido...")
            # Aquí podrías escribir el contenido del launcher desde el artifact
            print("⚠️ Por favor, asegúrate de tener el archivo dotaciones_yazz_launcher.py")
            print("   Usa el código mejorado proporcionado en el artifact")
        
        # Crear archivo de configuración mejorado
        settings_file = self.project_dir / 'backend' / 'settings_fixed.py'
        if not settings_file.exists():
            print("📝 Crea backend/settings_fixed.py con la configuración mejorada")
        
        # Verificar que el frontend esté listo
        frontend_dir = self.project_dir / 'frontend'
        if frontend_dir.exists():
            node_modules = frontend_dir / 'node_modules'
            if node_modules.exists():
                print("🧹 Limpiando node_modules para reducir tamaño...")
                # No eliminamos node_modules aquí, solo advertimos
                print("💡 Considera eliminar frontend/node_modules para reducir el tamaño")
        
        # Crear archivo .spec si no existe
        if not self.spec_file.exists():
            print("📝 Crea Fast_Fixed.spec con la configuración mejorada")
            print("   Usa el código proporcionado en el artifact")
        
        return True
    
    def clean_previous_builds(self):
        """Limpiar builds anteriores"""
        print("\n🧹 Limpiando builds anteriores...")
        
        dirs_to_clean = [self.build_dir, self.dist_dir]
        
        for dir_path in dirs_to_clean:
            if dir_path.exists():
                print(f"🗑️ Eliminando {dir_path}")
                try:
                    shutil.rmtree(dir_path)
                    print(f"✅ {dir_path} eliminado")
                except Exception as e:
                    print(f"⚠️ Error eliminando {dir_path}: {e}")
            else:
                print(f"ℹ️ {dir_path} no existe")
    
    def run_build(self):
        """Ejecutar el build con PyInstaller"""
        print("\n🚀 Iniciando build con PyInstaller...")
        
        if not self.spec_file.exists():
            print("❌ Archivo .spec no encontrado")
            print("💡 Crea Fast_Fixed.spec con la configuración proporcionada")
            return False
        
        try:
            # Comando de build
            cmd = [
                sys.executable, '-m', 'PyInstaller',
                str(self.spec_file),
                '--clean',  # Limpiar cache
                '--noconfirm',  # No pedir confirmación
                '--log-level=INFO'  # Nivel de logging
            ]
            
            print(f"🔧 Ejecutando: {' '.join(cmd)}")
            print("⏳ Esto puede tomar varios minutos...")
            
            start_time = time.time()
            
            # Ejecutar build
            result = subprocess.run(
                cmd,
                cwd=self.project_dir,
                capture_output=True,
                text=True
            )
            
            build_time = time.time() - start_time
            
            if result.returncode == 0:
                print(f"✅ Build completado en {build_time:.1f} segundos")
                return True
            else:
                print(f"❌ Error en el build:")
                print("STDOUT:", result.stdout[-1000:])  # Últimas 1000 chars
                print("STDERR:", result.stderr[-1000:])  # Últimas 1000 chars
                return False
                
        except Exception as e:
            print(f"❌ Error ejecutando PyInstaller: {e}")
            return False
    
    def verify_build(self):
        """Verificar que el build fue exitoso"""
        print("\n🔍 Verificando build...")
        
        exe_name = 'DotacionesYazz.exe' if platform.system() == 'Windows' else 'DotacionesYazz'
        exe_path = self.dist_dir / 'DotacionesYazz' / exe_name
        
        if not exe_path.exists():
            print(f"❌ Ejecutable no encontrado: {exe_path}")
            return False
        
        # Verificar tamaño
        size_mb = exe_path.stat().st_size / (1024 * 1024)
        print(f"📊 Tamaño del ejecutable: {size_mb:.1f} MB")
        
        # Verificar archivos importantes
        dist_project_dir = self.dist_dir / 'DotacionesYazz'
        important_files = [
            'manage.py',
            'backend',
            'inventario',
            'clientes',
            'pedidos',
            'finanzas'
        ]
        
        missing_files = []
        for file in important_files:
            if not (dist_project_dir / file).exists():
                missing_files.append(file)
        
        if missing_files:
            print("⚠️ Archivos faltantes en el build:")
            for file in missing_files:
                print(f"   - {file}")
        else:
            print("✅ Todos los archivos importantes están presentes")
        
        print(f"✅ Build verificado: {exe_path}")
        return True
    
    def create_installer(self):
        """Crear instalador simple"""
        print("\n📦 Creando instalador...")
        
        if platform.system() == 'Windows':
            installer_content = f'''@echo off
echo ==========================================
echo    INSTALADOR DE DOTACIONES YAZZ
echo ==========================================
echo.

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo.
    echo 💡 Descarga Node.js desde: https://nodejs.org/
    echo    Instala la versión LTS recomendada
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detectado
echo.

REM Crear directorio de instalación
set "INSTALL_DIR=%USERPROFILE%\\DotacionesYazz"
echo 📁 Instalando en: %INSTALL_DIR%
echo.

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Copiar archivos
echo 📋 Copiando archivos...
xcopy /E /Y /Q "DotacionesYazz\\*" "%INSTALL_DIR%\\" >nul

REM Crear acceso directo en el escritorio
echo 🔗 Creando acceso directo...
powershell -Command "$s = New-Object -comObject WScript.Shell; $sc = $s.CreateShortcut('%USERPROFILE%\\Desktop\\Dotaciones Yazz.lnk'); $sc.TargetPath = '%INSTALL_DIR%\\DotacionesYazz.exe'; $sc.IconLocation = '%INSTALL_DIR%\\DotacionesYazz.exe'; $sc.Save()"

echo.
echo ========================================== 
echo ✅ ¡INSTALACIÓN COMPLETADA!
echo ==========================================
echo.
echo 🎯 Ubicación: %INSTALL_DIR%
echo 🖥️ Acceso directo creado en el escritorio
echo.
echo 📋 CREDENCIALES POR DEFECTO:
echo    Usuario: admin
echo    Contraseña: admin123
echo.
echo 💡 PRIMER USO:
echo    1. Ejecuta "Dotaciones Yazz" desde el escritorio
echo    2. El sistema iniciará automáticamente
echo    3. Se abrirá tu navegador web
echo    4. Usa las credenciales mostradas arriba
echo.
echo ⚠️ IMPORTANTE:
echo    - La primera vez puede tardar más en cargar
echo    - No cierres la ventana negra (consola)
echo    - Para cerrar, usa Ctrl+C en la consola
echo.
pause
'''
            
            installer_path = self.dist_dir / 'INSTALAR.bat'
            with open(installer_path, 'w', encoding='utf-8') as f:
                f.write(installer_content)
            
            print(f"✅ Instalador creado: {installer_path}")
        
        else:
            # Para Linux/Mac, crear script bash
            installer_content = '''#!/bin/bash
echo "=========================================="
echo "   INSTALADOR DE DOTACIONES YAZZ"
echo "=========================================="
echo

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js no está instalado"
    echo "💡 Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detectado"
echo

# Crear directorio de instalación
INSTALL_DIR="$HOME/DotacionesYazz"
echo "📁 Instalando en: $INSTALL_DIR"
echo

mkdir -p "$INSTALL_DIR"

# Copiar archivos
echo "📋 Copiando archivos..."
cp -r DotacionesYazz/* "$INSTALL_DIR/"

# Hacer ejecutable
chmod +x "$INSTALL_DIR/DotacionesYazz"

echo
echo "=========================================="
echo "✅ ¡INSTALACIÓN COMPLETADA!"
echo "=========================================="
echo
echo "🎯 Ubicación: $INSTALL_DIR"
echo
echo "📋 CREDENCIALES POR DEFECTO:"
echo "   Usuario: admin"
echo "   Contraseña: admin123"
echo
echo "💡 PARA EJECUTAR:"
echo "   cd $INSTALL_DIR && ./DotacionesYazz"
echo
echo "⚠️ IMPORTANTE:"
echo "   - La primera vez puede tardar más en cargar"
echo "   - No cierres la terminal"
echo "   - Para cerrar, usa Ctrl+C"
echo
read -p "Presiona Enter para continuar..."
'''
            
            installer_path = self.dist_dir / 'instalar.sh'
            with open(installer_path, 'w', encoding='utf-8') as f:
                f.write(installer_content)
            
            # Hacer ejecutable
            os.chmod(installer_path, 0o755)
            print(f"✅ Instalador creado: {installer_path}")
    
    def create_readme(self):
        """Crear archivo README con instrucciones"""
        print("\n📝 Creando README...")
        
        readme_content = f'''# DOTACIONES YAZZ - SISTEMA DE GESTIÓN
## Versión Ejecutable Portable

### 🎯 DESCRIPCIÓN
Sistema completo de gestión para bordados y dotaciones que incluye:
- 📦 Gestión de inventario de productos
- 👥 Administración de clientes
- 📋 Control de pedidos de bordado
- 💰 Sistema financiero y ventas directas
- 📊 Dashboard con reportes y estadísticas

### 🚀 INSTALACIÓN RÁPIDA

#### Windows:
1. Ejecuta `INSTALAR.bat` como administrador
2. Sigue las instrucciones en pantalla
3. Busca "Dotaciones Yazz" en el escritorio

#### Linux/Mac:
1. Ejecuta: `chmod +x instalar.sh && ./instalar.sh`
2. Sigue las instrucciones en pantalla
3. Ejecuta desde: `~/DotacionesYazz/DotacionesYazz`

### 📋 CREDENCIALES POR DEFECTO
- **Usuario:** admin
- **Contraseña:** admin123

### 💻 REQUISITOS DEL SISTEMA
- ✅ **Node.js** (versión 14 o superior) - **OBLIGATORIO**
- ✅ Sistema operativo: Windows 10+, Ubuntu 18+, macOS 10.14+
- ✅ RAM: Mínimo 4GB recomendado
- ✅ Espacio: 500MB libres en disco
- ✅ Navegador web moderno (Chrome, Firefox, Edge, Safari)

### 🌐 ACCESO AL SISTEMA
1. **Ejecutar el programa** (doble clic o desde terminal)
2. **Esperar** a que aparezca el mensaje "Sistema iniciado"
3. **Abrir navegador** en: http://localhost:3000
4. **Iniciar sesión** con las credenciales por defecto

### ⚡ PRIMER USO
1. **Crear categorías** de productos (Ej: Hilos, Telas, etc.)
2. **Agregar productos** al inventario con precios
3. **Registrar clientes** con sus datos de contacto
4. **Crear pedidos** de bordado asignando clientes
5. **Gestionar pagos** y seguimiento de pedidos

### 🛠️ SOLUCIÓN DE PROBLEMAS

#### ❌ "Error: npm no encontrado"
- **Instala Node.js** desde: https://nodejs.org/
- **Reinicia** el sistema después de la instalación
- **Verifica** con: `node --version` en terminal

#### ❌ "Backend no responde"
- **Verifica** que no hay otros programas usando los puertos 3000 y 8000
- **Cierra** otros navegadores o aplicaciones web
- **Reinicia** el programa y espera más tiempo

#### ❌ "No se puede conectar"
- **Revisa** tu firewall/antivirus
- **Permite** conexiones locales en el puerto 3000 y 8000
- **Ejecuta como administrador** si es necesario

#### ❌ "Error de base de datos"
- **Elimina** la carpeta de datos: `~/Documents/DotacionesYazz` (Windows/Mac) o `~/DotacionesYazz` (Linux)
- **Reinicia** el programa para recrear la base de datos

### 📞 SOPORTE
- 📧 **Email:** soporte@dotacionesyazz.com
- 📱 **WhatsApp:** +57 XXX XXX XXXX
- 🌐 **Web:** www.dotacionesyazz.com

### 🔄 ACTUALIZACIONES
- Las actualizaciones se descargan automáticamente
- Mantén tu versión de Node.js actualizada
- Respalda tus datos periódicamente

### 📊 CARACTERÍSTICAS PRINCIPALES

#### 🎨 Gestión de Pedidos
- Estados simplificados: Recibido → En Proceso → Terminado → Entregado
- Notificaciones automáticas de cambio de estado
- Control de fechas de entrega
- Historial completo de cada pedido

#### 💰 Sistema Financiero
- Ventas directas de productos
- Control de pagos y adelantos
- Reportes de ingresos por período
- Dashboard financiero en tiempo real

#### 📦 Inventario Inteligente
- Alertas de stock bajo automáticas
- Control de precios de compra y venta
- Cálculo automático de márgenes
- Movimientos de inventario detallados

#### 👥 Gestión de Clientes
- Base de datos completa de clientes
- Sistema de descuentos especiales
- Historial de pedidos por cliente
- Segmentación por tipo de cliente

---
*Generado automáticamente el {time.strftime("%Y-%m-%d %H:%M:%S")}*
*Versión del sistema: {platform.system()} {platform.release()}*
*Python: {sys.version.split()[0]}*
'''
        
        readme_path = self.dist_dir / 'README.md'
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        print(f"✅ README creado: {readme_path}")
    
    def finalize_build(self):
        """Finalizar el build con optimizaciones"""
        print("\n🎯 Finalizando build...")
        
        dist_project_dir = self.dist_dir / 'DotacionesYazz'
        
        if not dist_project_dir.exists():
            print("❌ Directorio de distribución no encontrado")
            return False
        
        # Crear archivo de versión
        version_file = dist_project_dir / 'VERSION.txt'
        with open(version_file, 'w') as f:
            f.write(f"Dotaciones Yazz v1.0\n")
            f.write(f"Build: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Sistema: {platform.system()} {platform.release()}\n")
            f.write(f"Python: {sys.version.split()[0]}\n")
        
        # Crear archivo de configuración para el launcher
        config_file = dist_project_dir / 'launcher_config.json'
        import json
        config = {
            "app_name": "Dotaciones Yazz",
            "version": "1.0",
            "default_ports": {
                "backend": 8000,
                "frontend": 3000
            },
            "database_name": "dotaciones_yazz.db",
            "work_directory": "~/Documents/DotacionesYazz"
        }
        
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        # Mostrar estadísticas finales
        total_size = sum(f.stat().st_size for f in dist_project_dir.rglob('*') if f.is_file())
        size_mb = total_size / (1024 * 1024)
        
        print(f"📊 Tamaño total: {size_mb:.1f} MB")
        print(f"📁 Archivos: {len(list(dist_project_dir.rglob('*')))}")
        print(f"✅ Build finalizado en: {dist_project_dir}")
        
        return True
    
    def build(self):
        """Proceso completo de build"""
        print("🚀 INICIANDO BUILD COMPLETO")
        print("=" * 60)
        
        steps = [
            ("Verificar requisitos", self.check_requirements),
            ("Instalar dependencias", self.install_dependencies),
            ("Preparar archivos", self.prepare_files),
            ("Limpiar builds anteriores", self.clean_previous_builds),
            ("Ejecutar PyInstaller", self.run_build),
            ("Verificar build", self.verify_build),
            ("Crear instalador", self.create_installer),
            ("Crear README", self.create_readme),
            ("Finalizar build", self.finalize_build),
        ]
        
        start_time = time.time()
        
        for step_name, step_func in steps:
            print(f"\n🔄 {step_name}...")
            if not step_func():
                print(f"❌ Error en: {step_name}")
                return False
        
        total_time = time.time() - start_time
        
        print("\n" + "=" * 60)
        print("🎉 ¡BUILD COMPLETADO EXITOSAMENTE!")
        print("=" * 60)
        print(f"⏱️ Tiempo total: {total_time:.1f} segundos")
        print(f"📁 Resultado en: {self.dist_dir}")
        print(f"🚀 Ejecutable: {self.dist_dir}/DotacionesYazz/")
        print("\n💡 PRÓXIMOS PASOS:")
        print("1. Prueba el ejecutable localmente")
        print("2. Usa el instalador para distribución")
        print("3. Comparte la carpeta 'dist' completa")
        print("=" * 60)
        
        return True

def main():
    """Función principal"""
    builder = DotacionesBuilder()
    
    try:
        success = builder.build()
        if success:
            print("\n🎯 El ejecutable está listo para usar!")
            print("💡 Lee el archivo README.md para instrucciones de instalación")
        else:
            print("\n❌ El build falló. Revisa los errores anteriores.")
        return success
    
    except KeyboardInterrupt:
        print("\n🛑 Build cancelado por el usuario")
        return False
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    success = main()
    
    if not success:
        print("\n🔍 POSIBLES SOLUCIONES:")
        print("1. Verifica que tengas todos los archivos necesarios")
        print("2. Instala las dependencias: pip install -r requirements.txt")
        print("3. Actualiza PyInstaller: pip install --upgrade pyinstaller")
        print("4. Verifica que Node.js esté instalado")
        
    input("\nPresiona Enter para salir...")
    sys.exit(0 if success else 1)