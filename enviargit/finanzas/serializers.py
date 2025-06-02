from rest_framework import serializers
from .models import VentaDirecta, DetalleVentaDirecta, PagoPedido, MovimientoInventario
from clientes.serializers import ClienteResumenSerializer
from inventario.serializers import ProductoSerializer
from pedidos.serializers import PedidoResumenSerializer

class DetalleVentaDirectaSerializer(serializers.ModelSerializer):
    producto_info = ProductoSerializer(source='producto', read_only=True)
    
    class Meta:
        model = DetalleVentaDirecta
        fields = [
            'id', 'producto', 'producto_info', 'cantidad',
            'precio_unitario', 'subtotal'
        ]

class VentaDirectaSerializer(serializers.ModelSerializer):
    cliente_info = ClienteResumenSerializer(source='cliente', read_only=True)
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    detalles = DetalleVentaDirectaSerializer(many=True, read_only=True)
    
    class Meta:
        model = VentaDirecta
        fields = [
            'id', 'cliente', 'cliente_info', 'fecha_venta',
            'subtotal', 'descuento', 'total', 'metodo_pago',
            'metodo_pago_display', 'pagado', 'notas', 'detalles'
        ]

class PagoPedidoSerializer(serializers.ModelSerializer):
    pedido_info = PedidoResumenSerializer(source='pedido', read_only=True)
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    
    class Meta:
        model = PagoPedido
        fields = [
            'id', 'pedido', 'pedido_info', 'fecha_pago',
            'monto', 'metodo_pago', 'metodo_pago_display',
            'concepto', 'notas'
        ]

class MovimientoInventarioSerializer(serializers.ModelSerializer):
    producto_info = ProductoSerializer(source='producto', read_only=True)
    tipo_movimiento_display = serializers.CharField(source='get_tipo_movimiento_display', read_only=True)
    
    class Meta:
        model = MovimientoInventario
        fields = [
            'id', 'producto', 'producto_info', 'tipo_movimiento',
            'tipo_movimiento_display', 'cantidad', 'cantidad_anterior',
            'cantidad_nueva', 'fecha', 'motivo', 'usuario'
        ]

# Serializers para reportes y dashboard
class ResumenFinancieroSerializer(serializers.Serializer):
    """Para el dashboard financiero"""
    ingresos_hoy = serializers.DecimalField(max_digits=10, decimal_places=2)
    ingresos_semana = serializers.DecimalField(max_digits=10, decimal_places=2)
    ingresos_mes = serializers.DecimalField(max_digits=10, decimal_places=2)
    pedidos_pendientes_pago = serializers.DecimalField(max_digits=10, decimal_places=2)
    productos_bajo_stock = serializers.IntegerField()
    pedidos_en_proceso = serializers.IntegerField()
    clientes_nuevos_mes = serializers.IntegerField()

class ProductoVentasSerializer(serializers.Serializer):
    """Para reporte de productos más vendidos"""
    producto_nombre = serializers.CharField()
    total_vendido = serializers.DecimalField(max_digits=10, decimal_places=2)
    cantidad_vendida = serializers.DecimalField(max_digits=8, decimal_places=2)
    ganancia = serializers.DecimalField(max_digits=10, decimal_places=2)