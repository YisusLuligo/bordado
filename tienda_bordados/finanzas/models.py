from django.db import models
from django.utils import timezone
from clientes.models import Cliente
from inventario.models import Producto
from pedidos.models import Pedido

class VentaDirecta(models.Model):
    """
    Para ventas directas de productos del inventario
    """
    METODO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('tarjeta', 'Tarjeta'),
        ('credito', 'Crédito'),
    ]
    
    # Información básica
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, null=True, blank=True)
    fecha_venta = models.DateTimeField(default=timezone.now)
    
    # Totales
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    descuento = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Pago
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES)
    pagado = models.BooleanField(default=True)
    
    # Notas
    notas = models.TextField(blank=True)
    
    def __str__(self):
        cliente_nombre = self.cliente.nombre if self.cliente else "Cliente General"
        return f"Venta {self.id} - {cliente_nombre} - ${self.total}"
    
    class Meta:
        verbose_name_plural = "Ventas Directas"

class DetalleVentaDirecta(models.Model):
    """
    Productos vendidos en cada venta directa
    """
    venta = models.ForeignKey(VentaDirecta, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=8, decimal_places=2)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self, *args, **kwargs):
        # Calcular subtotal automáticamente
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)
        
        # Reducir stock del producto
        self.producto.cantidad_actual -= self.cantidad
        self.producto.save()
    
    def __str__(self):
        return f"{self.producto.nombre} x{self.cantidad}"

class PagoPedido(models.Model):
    """
    Registro de pagos de pedidos (adelantos y pagos finales)
    """
    METODO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('tarjeta', 'Tarjeta'),
    ]
    
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='pagos')
    fecha_pago = models.DateTimeField(default=timezone.now)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES)
    concepto = models.CharField(max_length=100)  # "Adelanto", "Pago final", etc.
    notas = models.TextField(blank=True)
    
    def __str__(self):
        return f"Pago {self.pedido} - ${self.monto} - {self.concepto}"
    
    class Meta:
        verbose_name_plural = "Pagos de Pedidos"

class MovimientoInventario(models.Model):
    """
    Historial de movimientos de inventario
    """
    TIPO_MOVIMIENTO_CHOICES = [
        ('entrada', 'Entrada (Compra)'),
        ('salida_venta', 'Salida (Venta Directa)'),
        ('salida_pedido', 'Salida (Uso en Pedido)'),
        ('ajuste', 'Ajuste de Inventario'),
        ('devolucion', 'Devolución'),
    ]
    
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='movimientos')
    tipo_movimiento = models.CharField(max_length=20, choices=TIPO_MOVIMIENTO_CHOICES)
    cantidad = models.DecimalField(max_digits=8, decimal_places=2)
    cantidad_anterior = models.DecimalField(max_digits=8, decimal_places=2)
    cantidad_nueva = models.DecimalField(max_digits=8, decimal_places=2)
    
    # Referencias opcionales
    venta_directa = models.ForeignKey(VentaDirecta, on_delete=models.SET_NULL, null=True, blank=True)
    pedido = models.ForeignKey(Pedido, on_delete=models.SET_NULL, null=True, blank=True)
    
    fecha = models.DateTimeField(default=timezone.now)
    motivo = models.CharField(max_length=200)
    usuario = models.CharField(max_length=100, blank=True)  # Quien hizo el movimiento
    
    def __str__(self):
        return f"{self.producto.nombre} - {self.get_tipo_movimiento_display()} - {self.cantidad}"
    
    class Meta:
        verbose_name_plural = "Movimientos de Inventario"
        ordering = ['-fecha']