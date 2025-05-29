from django.db import models
from django.utils import timezone
from clientes.models import Cliente
from inventario.models import Producto

class Pedido(models.Model):
    ESTADO_CHOICES = [
        ('recibido', 'Recibido'),
        ('en_diseno', 'En Diseño'),
        ('aprobado', 'Aprobado'),
        ('en_proceso', 'En Proceso'),
        ('terminado', 'Terminado'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]
    
    TIPO_BORDADO_CHOICES = [
        ('computarizado', 'Computarizado'),
        ('manual', 'Manual'),
        ('combinado', 'Combinado'),
    ]
    
    # Información básica
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    fecha_pedido = models.DateTimeField(default=timezone.now)
    fecha_entrega_prometida = models.DateTimeField()
    fecha_entrega_real = models.DateTimeField(null=True, blank=True)
    
    # Detalles del bordado
    tipo_bordado = models.CharField(max_length=20, choices=TIPO_BORDADO_CHOICES)
    descripcion = models.TextField()
    especificaciones = models.TextField(blank=True)
    
    # Estado y tiempos
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='recibido')
    tiempo_estimado_horas = models.DecimalField(max_digits=5, decimal_places=2)
    tiempo_real_horas = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Precios y pagos
    precio_total = models.DecimalField(max_digits=10, decimal_places=2)
    adelanto_pagado = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Información adicional
    notas_internas = models.TextField(blank=True)
    archivo_diseno = models.CharField(max_length=200, blank=True)
    
    def __str__(self):
        return f"Pedido #{self.id} - {self.cliente.nombre}"
    
    @property
    def saldo_pendiente(self):
        return self.precio_total - self.adelanto_pagado
    
    @property
    def esta_pagado(self):
        return self.saldo_pendiente <= 0
    
    class Meta:
        verbose_name_plural = "Pedidos"

class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad_usada = models.DecimalField(max_digits=8, decimal_places=2)
    
    def __str__(self):
        return f"{self.producto.nombre} - Cantidad: {self.cantidad_usada}"
    
    class Meta:
        verbose_name_plural = "Detalles de Pedidos"