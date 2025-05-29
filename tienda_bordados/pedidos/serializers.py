from rest_framework import serializers
from .models import Pedido, DetallePedido
from clientes.serializers import ClienteResumenSerializer
from inventario.serializers import ProductoSerializer

class DetallePedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_info = ProductoSerializer(source='producto', read_only=True)
    
    class Meta:
        model = DetallePedido
        fields = [
            'id', 'producto', 'producto_nombre', 'producto_info',
            'cantidad_usada'
        ]

class PedidoSerializer(serializers.ModelSerializer):
    cliente_info = ClienteResumenSerializer(source='cliente', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_bordado_display = serializers.CharField(source='get_tipo_bordado_display', read_only=True)
    saldo_pendiente = serializers.ReadOnlyField()
    esta_pagado = serializers.ReadOnlyField()
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'cliente_info', 'fecha_pedido',
            'fecha_entrega_prometida', 'fecha_entrega_real',
            'tipo_bordado', 'tipo_bordado_display', 'descripcion',
            'especificaciones', 'estado', 'estado_display',
            'tiempo_estimado_horas', 'tiempo_real_horas',
            'precio_total', 'adelanto_pagado', 'saldo_pendiente',
            'esta_pagado', 'notas_internas', 'archivo_diseno',
            'detalles'
        ]

class PedidoResumenSerializer(serializers.ModelSerializer):
    """Para listas y dashboard"""
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente_nombre', 'fecha_pedido', 'fecha_entrega_prometida',
            'estado', 'estado_display', 'precio_total', 'saldo_pendiente'
        ]