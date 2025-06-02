from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name_plural = "Categorías"
        ordering = ['nombre']

class Producto(models.Model):
    # Información básica
    nombre = models.CharField(max_length=200, db_index=True)  # Índice para búsquedas
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='productos')
    marca = models.CharField(max_length=100, blank=True, db_index=True)  # Índice para filtros
    color = models.CharField(max_length=50, blank=True)
    
    # Stock
    cantidad_actual = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    stock_minimo = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=5,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Precios
    precio_compra = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    precio_venta = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Información adicional
    proveedor = models.CharField(max_length=200, blank=True)
    
    # Fechas
    fecha_creacion = models.DateTimeField(default=timezone.now, db_index=True)  # Índice para ordenamiento
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    @property
    def necesita_restock(self):
        """Indica si el producto necesita ser reabastecido"""
        return self.cantidad_actual <= self.stock_minimo
    
    @property
    def categoria_nombre(self):
        """Nombre de la categoría para serialización"""
        return self.categoria.nombre if self.categoria else ""
    
    @property
    def valor_inventario(self):
        """Valor total del inventario de este producto"""
        return self.cantidad_actual * self.precio_compra
    
    @property
    def margen_ganancia(self):
        """Margen de ganancia por unidad"""
        return self.precio_venta - self.precio_compra
    
    @property
    def porcentaje_ganancia(self):
        """Porcentaje de ganancia"""
        if self.precio_compra > 0:
            return ((self.precio_venta - self.precio_compra) / self.precio_compra) * 100
        return 0
    
    def clean(self):
        """Validaciones personalizadas"""
        from django.core.exceptions import ValidationError
        
        if self.precio_venta <= self.precio_compra:
            raise ValidationError('El precio de venta debe ser mayor al precio de compra.')
        
        if self.stock_minimo < 0:
            raise ValidationError('El stock mínimo no puede ser negativo.')
    
    def save(self, *args, **kwargs):
        """Override save para validaciones"""
        self.full_clean()  # Ejecutar validaciones
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.nombre} - {self.marca}" if self.marca else self.nombre
    
    class Meta:
        verbose_name_plural = "Productos"
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['categoria', 'nombre']),
            models.Index(fields=['cantidad_actual', 'stock_minimo']),  # Para alertas de stock
            models.Index(fields=['-fecha_creacion']),
        ]
        
        # Constraint para evitar precios negativos
        constraints = [
            models.CheckConstraint(
                check=models.Q(precio_venta__gt=models.F('precio_compra')),
                name='precio_venta_mayor_que_compra'
            ),
            models.CheckConstraint(
                check=models.Q(cantidad_actual__gte=0),
                name='cantidad_actual_no_negativa'
            ),
            models.CheckConstraint(
                check=models.Q(stock_minimo__gte=0),
                name='stock_minimo_no_negativo'
            ),
        ]