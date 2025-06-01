#!/usr/bin/env python
"""
Script para optimizar la base de datos del sistema de bordados
Ejecutar desde la carpeta raíz del proyecto Django
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

def crear_indices_adicionales():
    """Crear índices adicionales para mejorar el rendimiento"""
    
    indices_sql = [
        # Índices para finanzas
        "CREATE INDEX IF NOT EXISTS idx_finanzas_venta_fecha ON finanzas_ventadirecta(fecha_venta);",
        "CREATE INDEX IF NOT EXISTS idx_finanzas_venta_cliente ON finanzas_ventadirecta(cliente_id);",
        "CREATE INDEX IF NOT EXISTS idx_finanzas_movimiento_fecha ON finanzas_movimientoinventario(fecha DESC);",
        "CREATE INDEX IF NOT EXISTS idx_finanzas_movimiento_producto ON finanzas_movimientoinventario(producto_id);",
        "CREATE INDEX IF NOT EXISTS idx_finanzas_pago_fecha ON finanzas_pagopedido(fecha_pago DESC);",
        
        # Índices para pedidos
        "CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos_pedido(fecha_pedido DESC);",
        "CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos_pedido(cliente_id);",
        "CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos_pedido(estado);",
        
        # Índices para clientes
        "CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes_cliente(nombre);",
        "CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes_cliente(telefono);",
    ]
    
    print("🔧 Creando índices adicionales de optimización...")
    
    with connection.cursor() as cursor:
        for i, sql in enumerate(indices_sql, 1):
            try:
                cursor.execute(sql)
                print(f"✅ Índice {i}/{len(indices_sql)} creado exitosamente")
            except Exception as e:
                print(f"⚠️  Índice {i} ya existe o error: {e}")
    
    print("✅ Optimización de índices completada")

def verificar_datos():
    """Verificar datos básicos"""
    print("🔍 Verificando datos...")
    
    from inventario.models import Producto, Categoria
    from clientes.models import Cliente
    
    try:
        categorias_count = Categoria.objects.count()
        productos_count = Producto.objects.count()
        clientes_count = Cliente.objects.count()
        
        print(f"📊 Estadísticas actuales:")
        print(f"   - Categorías: {categorias_count}")
        print(f"   - Productos: {productos_count}")
        print(f"   - Clientes: {clientes_count}")
        
        # Verificar productos con posibles problemas
        productos_sin_stock = Producto.objects.filter(cantidad_actual__lte=0).count()
        productos_bajo_stock = Producto.objects.filter(cantidad_actual__lte=models.F('stock_minimo')).count()
        
        if productos_sin_stock > 0:
            print(f"⚠️  {productos_sin_stock} productos sin stock")
        
        if productos_bajo_stock > 0:
            print(f"⚠️  {productos_bajo_stock} productos bajo stock mínimo")
        
        print("✅ Verificación completada")
        
    except Exception as e:
        print(f"❌ Error verificando datos: {e}")

def ejecutar_optimizaciones():
    """Función principal"""
    
    print("🚀 Iniciando optimización de base de datos...")
    print("=" * 50)
    
    try:
        verificar_datos()
        crear_indices_adicionales()
        
        print("=" * 50)
        print("🎉 ¡Optimización completada exitosamente!")
        print("💡 Tu base de datos ahora debería funcionar más rápido")
        
        return True
        
    except Exception as e:
        print(f"❌ Error durante la optimización: {e}")
        return False

if __name__ == "__main__":
    from django.db import models
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists('manage.py'):
        print("❌ Error: Este script debe ejecutarse desde la carpeta que contiene manage.py")
        sys.exit(1)
    
    # Ejecutar optimizaciones
    success = ejecutar_optimizaciones()
    
    if success:
        print("\n🎯 Próximos pasos:")
        print("1. Reinicia el servidor Django: python manage.py runserver")
        print("2. Reinicia el servidor React en otra terminal")
        print("3. Prueba crear productos y ventas - deberían funcionar correctamente")
    else:
        print("\n🔧 Si hay errores, contacta para más ayuda")
    
    sys.exit(0 if success else 1)