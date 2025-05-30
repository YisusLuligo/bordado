from rest_framework import serializers
from .models import Categoria, Producto

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    necesita_restock = serializers.ReadOnlyField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'categoria', 'categoria_nombre', 'marca', 'color',
            'cantidad_actual', 'stock_minimo', 'precio_compra', 'precio_venta',
            'proveedor', 'fecha_creacion', 'fecha_actualizacion', 'necesita_restock'
        ]

class ProductoStockSerializer(serializers.ModelSerializer):
    """Serializer simplificado para mostrar solo info de stock"""
    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'cantidad_actual', 'stock_minimo', 'necesita_restock']