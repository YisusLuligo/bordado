from django.db import models
from django.utils import timezone

class Categoria(models.Model):
    nombre = models.CharField(max_length=50)  # Hilo, Tela, Herramienta
    descripcion = models.TextField(blank=True)
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name_plural = "Categorías"

class Producto(models.Model):
    # Información básica
    nombre = models.CharField(max_length=100)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    marca = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=30, blank=True)
    
    # Control de stock
    cantidad_actual = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=5)
    
    # Precios
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Información adicional
    proveedor = models.CharField(max_length=100, blank=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.nombre} - {self.color}"
    
    @property
    def necesita_restock(self):
        return self.cantidad_actual <= self.stock_minimo