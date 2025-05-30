from rest_framework import serializers
from .models import Cliente

class ClienteSerializer(serializers.ModelSerializer):
    tipo_cliente_display = serializers.CharField(source='get_tipo_cliente_display', read_only=True)
    
    class Meta:
        model = Cliente
        fields = [
            'id', 'nombre', 'telefono', 'email', 'direccion',
            'tipo_cliente', 'tipo_cliente_display', 'descuento_especial',
            'fecha_registro', 'ultima_compra', 'activo', 'notas'
        ]

class ClienteResumenSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas y selecciones"""
    class Meta:
        model = Cliente
        fields = ['id', 'nombre', 'telefono', 'tipo_cliente']