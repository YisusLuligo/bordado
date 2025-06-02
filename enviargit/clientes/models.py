from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
import re

class Cliente(models.Model):
    TIPO_CLIENTE_CHOICES = [
        ('particular', 'Particular'),
        ('empresa', 'Empresa'),
        ('mayorista', 'Mayorista'),
    ]
    
    # Información básica
    nombre = models.CharField(
        max_length=100, 
        db_index=True,
        help_text="Nombre completo del cliente o empresa"
    )
    telefono = models.CharField(
        max_length=20, 
        unique=True, 
        db_index=True,
        help_text="Teléfono único del cliente"
    )
    email = models.EmailField(
        blank=True, 
        db_index=True,
        help_text="Email del cliente (opcional pero recomendado)"
    )
    direccion = models.TextField(
        blank=True,
        help_text="Dirección completa del cliente"
    )
    
    # Información comercial
    tipo_cliente = models.CharField(
        max_length=20, 
        choices=TIPO_CLIENTE_CHOICES, 
        default='particular',
        db_index=True,
        help_text="Tipo de cliente para aplicar descuentos y políticas"
    )
    descuento_especial = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        validators=[
            MinValueValidator(0.00, message="El descuento no puede ser negativo"),
            MaxValueValidator(100.00, message="El descuento no puede ser mayor a 100%")
        ],
        help_text="Porcentaje de descuento automático (0-100%)"
    )
    
    # Fechas
    fecha_registro = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        help_text="Fecha en que se registró el cliente"
    )
    ultima_compra = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Fecha de la última compra realizada"
    )
    
    # Estado
    activo = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Si está activo, aparecerá en las listas de selección"
    )
    notas = models.TextField(
        blank=True,
        help_text="Notas adicionales sobre el cliente"
    )
    
    # ⭐ NUEVO: Campos de auditoría
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        help_text="Última vez que se modificó el cliente"
    )
    
    def clean(self):
        """⭐ NUEVO: Validaciones personalizadas del modelo"""
        errors = {}
        
        # Validar nombre
        if self.nombre:
            self.nombre = self.nombre.strip()
            if len(self.nombre) < 2:
                errors['nombre'] = 'El nombre debe tener al menos 2 caracteres'
        
        # Validar teléfono
        if self.telefono:
            self.telefono = self.telefono.strip()
            # Eliminar espacios y caracteres especiales para validación
            telefono_limpio = re.sub(r'[^\d]', '', self.telefono)
            if len(telefono_limpio) < 7:
                errors['telefono'] = 'El teléfono debe tener al menos 7 dígitos'
            
            # Verificar duplicados
            if self.pk:  # Si estamos editando
                if Cliente.objects.filter(telefono=self.telefono).exclude(pk=self.pk).exists():
                    errors['telefono'] = 'Ya existe un cliente con este teléfono'
            else:  # Si estamos creando
                if Cliente.objects.filter(telefono=self.telefono).exists():
                    errors['telefono'] = 'Ya existe un cliente con este teléfono'
        
        # Validar email
        if self.email:
            self.email = self.email.strip().lower()
            # Verificar duplicados de email
            if self.pk:  # Si estamos editando
                if Cliente.objects.filter(email=self.email).exclude(pk=self.pk).exists():
                    errors['email'] = 'Ya existe un cliente con este email'
            else:  # Si estamos creando
                if Cliente.objects.filter(email=self.email).exists():
                    errors['email'] = 'Ya existe un cliente con este email'
        
        # Validar descuento
        if self.descuento_especial < 0 or self.descuento_especial > 100:
            errors['descuento_especial'] = 'El descuento debe estar entre 0% y 100%'
        
        if errors:
            raise ValidationError(errors)
    
    def save(self, *args, **kwargs):
        """⭐ MEJORADO: Limpiar datos antes de guardar"""
        # Limpiar y formatear datos
        if self.nombre:
            self.nombre = self.nombre.strip().title()
        
        if self.telefono:
            self.telefono = self.telefono.strip()
        
        if self.email:
            self.email = self.email.strip().lower()
        
        # Ejecutar validaciones
        self.full_clean()
        
        # Guardar
        super().save(*args, **kwargs)
    
    @property
    def nombre_corto(self):
        """⭐ NUEVO: Nombre corto para mostrar en listas"""
        if len(self.nombre) > 30:
            return f"{self.nombre[:27]}..."
        return self.nombre
    
    @property
    def tiene_descuento(self):
        """⭐ NUEVO: Indica si tiene descuento especial"""
        return self.descuento_especial > 0
    
    @property
    def dias_desde_registro(self):
        """⭐ NUEVO: Días desde que se registró"""
        return (timezone.now() - self.fecha_registro).days
    
    @property
    def dias_sin_comprar(self):
        """⭐ NUEVO: Días desde la última compra"""
        if self.ultima_compra:
            return (timezone.now() - self.ultima_compra).days
        return None
    
    @property
    def es_cliente_nuevo(self):
        """⭐ NUEVO: Cliente registrado en los últimos 30 días"""
        return self.dias_desde_registro <= 30
    
    @property
    def necesita_atencion(self):
        """⭐ NUEVO: Cliente que necesita atención (mucho tiempo sin comprar)"""
        if self.dias_sin_comprar:
            return self.dias_sin_comprar > 90  # Más de 3 meses sin comprar
        return False
    
    def calcular_descuento(self, monto_base):
        """⭐ NUEVO: Calcular descuento sobre un monto"""
        if self.descuento_especial > 0:
            descuento = monto_base * (self.descuento_especial / 100)
            return {
                'monto_base': float(monto_base),
                'descuento_porcentaje': float(self.descuento_especial),
                'descuento_monto': float(descuento),
                'monto_final': float(monto_base - descuento)
            }
        return {
            'monto_base': float(monto_base),
            'descuento_porcentaje': 0.0,
            'descuento_monto': 0.0,
            'monto_final': float(monto_base)
        }
    
    def actualizar_ultima_compra(self):
        """⭐ NUEVO: Actualizar fecha de última compra"""
        self.ultima_compra = timezone.now()
        self.save(update_fields=['ultima_compra'])
    
    def __str__(self):
        estado = "" if self.activo else " (Inactivo)"
        descuento = f" - {self.descuento_especial}% desc." if self.descuento_especial > 0 else ""
        return f"{self.nombre} ({self.get_tipo_cliente_display()}){descuento}{estado}"
    
    class Meta:
        verbose_name_plural = "Clientes"
        ordering = ['-fecha_registro']
        
        # ⭐ NUEVO: Índices para optimizar consultas
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['telefono']),
            models.Index(fields=['email']),
            models.Index(fields=['tipo_cliente', 'activo']),
            models.Index(fields=['-fecha_registro']),
            models.Index(fields=['activo', '-ultima_compra']),
        ]
        
        # ⭐ NUEVO: Restricciones a nivel de base de datos
        constraints = [
            models.CheckConstraint(
                check=models.Q(descuento_especial__gte=0) & models.Q(descuento_especial__lte=100),
                name='descuento_valido'
            ),
            models.UniqueConstraint(
                fields=['telefono'],
                name='telefono_unico'
            ),
            models.UniqueConstraint(
                fields=['email'],
                condition=models.Q(email__isnull=False) & ~models.Q(email=''),
                name='email_unico_no_vacio'
            ),
        ]