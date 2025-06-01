from django.db import models
from django.utils import timezone

class Cliente(models.Model):
    TIPO_CLIENTE_CHOICES = [
        ('particular', 'Particular'),
        ('empresa', 'Empresa'),
        ('mayorista', 'Mayorista'),
    ]
    
    # Información básica
    nombre = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    direccion = models.TextField(blank=True)
    
    # Información comercial
    tipo_cliente = models.CharField(max_length=20, choices=TIPO_CLIENTE_CHOICES, default='particular')
    descuento_especial = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)  # Porcentaje
    
    # Fechas
    fecha_registro = models.DateTimeField(default=timezone.now)
    ultima_compra = models.DateTimeField(null=True, blank=True)
    
    # Estado
    activo = models.BooleanField(default=True)
    notas = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_cliente_display()})"
    
    class Meta:
        verbose_name_plural = "Clientes"