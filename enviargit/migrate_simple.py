#!/usr/bin/env python
"""
Migración rápida de MySQL a SQLite
"""

import os
import sys

def main():
    print("🔄 Migración rápida a SQLite")
    print("="*40)
    
    # 1. Actualizar settings.py
    print("1. Actualizando configuración de base de datos...")
    
    settings_path = 'backend/settings.py'
    if os.path.exists(settings_path):
        # Leer archivo actual
        with open(settings_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Reemplazar configuración de MySQL por SQLite
        mysql_config = """DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'tienda_bordados_db',
        'USER': 'root',  # Tu usuario de MySQL
        'PASSWORD': 'Maria4615206',  # Cambia esto por tu contraseña real
        'HOST': 'localhost',
        'PORT': '3306',
    }
}"""
        
        sqlite_config = """DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}"""
        
        # Reemplazar
        if mysql_config in content:
            content = content.replace(mysql_config, sqlite_config)
            
            with open(settings_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print("✅ Configuración actualizada")
        else:
            print("⚠️ No se pudo actualizar automáticamente")
    
    # 2. Eliminar base de datos anterior si existe
    if os.path.exists('db.sqlite3'):
        os.remove('db.sqlite3')
        print("🗑️ Base de datos anterior eliminada")
    
    # 3. Crear nuevas migraciones
    print("2. Creando nueva base de datos...")
    
    os.system('python manage.py makemigrations')
    os.system('python manage.py migrate')
    
    print("✅ Base de datos SQLite creada")
    
    # 4. Crear superusuario
    print("3. Configurando usuario administrador...")
    
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        import django
        django.setup()
        
        from django.contrib.auth.models import User
        
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@empresa.com',
                password='admin123'
            )
            print("👤 Usuario administrador creado:")
            print("   Usuario: admin")
            print("   Contraseña: admin123")
        
    except Exception as e:
        print(f"⚠️ Error creando superusuario: {e}")
        print("💡 Puedes crearlo manualmente con: python manage.py createsuperuser")
    
    print("\n🎉 ¡Migración completada!")
    print("🚀 Ahora puedes ejecutar: python dotaciones_yazz.py")

if __name__ == "__main__":
    main()
    input("\nPresiona Enter para continuar...")