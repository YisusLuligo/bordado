# -*- mode: python ; coding: utf-8 -*-

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
