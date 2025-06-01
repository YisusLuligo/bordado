from rest_framework import serializers
from django.utils import timezone
from .models import Cliente

class ClienteSerializer(serializers.ModelSerializer):
    tipo_cliente_display = serializers.CharField(source='get_tipo_cliente_display', read_only=True)
    
    # ⭐ NUEVO: Campos calculados
    nombre_corto = serializers.ReadOnlyField()
    tiene_descuento = serializers.ReadOnlyField()
    dias_desde_registro = serializers.ReadOnlyField()
    dias_sin_comprar = serializers.ReadOnlyField()
    es_cliente_nuevo = serializers.ReadOnlyField()
    necesita_atencion = serializers.ReadOnlyField()
    
    class Meta:
        model = Cliente
        fields = [
            'id', 'nombre', 'nombre_corto', 'telefono', 'email', 'direccion',
            'tipo_cliente', 'tipo_cliente_display', 'descuento_especial', 'tiene_descuento',
            'fecha_registro', 'ultima_compra', 'activo', 'notas',
            'dias_desde_registro', 'dias_sin_comprar', 'es_cliente_nuevo', 'necesita_atencion',
            'fecha_actualizacion'
        ]
        read_only_fields = ['fecha_registro', 'fecha_actualizacion']
    
    def validate_nombre(self, value):
        """⭐ NUEVO: Validación del nombre"""
        if not value or not value.strip():
            raise serializers.ValidationError("El nombre es requerido")
        
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("El nombre debe tener al menos 2 caracteres")
        
        if len(value) > 100:
            raise serializers.ValidationError("El nombre no puede tener más de 100 caracteres")
        
        return value.title()  # Capitalizar
    
    def validate_telefono(self, value):
        """⭐ NUEVO: Validación del teléfono"""
        if not value or not value.strip():
            raise serializers.ValidationError("El teléfono es requerido")
        
        value = value.strip()
        
        # Eliminar espacios y caracteres especiales para validación
        import re
        telefono_limpio = re.sub(r'[^\d]', '', value)
        
        if len(telefono_limpio) < 7:
            raise serializers.ValidationError("El teléfono debe tener al menos 7 dígitos")
        
        if len(telefono_limpio) > 15:
            raise serializers.ValidationError("El teléfono no puede tener más de 15 dígitos")
        
        # Verificar duplicados
        instance = getattr(self, 'instance', None)
        queryset = Cliente.objects.filter(telefono=value)
        
        if instance:
            queryset = queryset.exclude(pk=instance.pk)
        
        if queryset.exists():
            cliente_existente = queryset.first()
            raise serializers.ValidationError(
                f"Ya existe un cliente con este teléfono: {cliente_existente.nombre}"
            )
        
        return value
    
    def validate_email(self, value):
        """⭐ NUEVO: Validación del email"""
        if not value:
            return value
        
        value = value.strip().lower()
        
        # Verificar duplicados
        instance = getattr(self, 'instance', None)
        queryset = Cliente.objects.filter(email=value)
        
        if instance:
            queryset = queryset.exclude(pk=instance.pk)
        
        if queryset.exists():
            cliente_existente = queryset.first()
            raise serializers.ValidationError(
                f"Ya existe un cliente con este email: {cliente_existente.nombre}"
            )
        
        return value
    
    def validate_descuento_especial(self, value):
        """⭐ NUEVO: Validación del descuento"""
        if value < 0:
            raise serializers.ValidationError("El descuento no puede ser negativo")
        
        if value > 100:
            raise serializers.ValidationError("El descuento no puede ser mayor a 100%")
        
        return value
    
    def validate_tipo_cliente(self, value):
        """⭐ NUEVO: Validación del tipo de cliente"""
        tipos_validos = [choice[0] for choice in Cliente.TIPO_CLIENTE_CHOICES]
        if value not in tipos_validos:
            raise serializers.ValidationError(f"Tipo de cliente inválido. Opciones: {tipos_validos}")
        
        return value
    
    def validate(self, attrs):
        """⭐ NUEVO: Validaciones cruzadas"""
        # Validar que mayoristas tengan descuento
        tipo_cliente = attrs.get('tipo_cliente')
        descuento = attrs.get('descuento_especial', 0)
        
        if tipo_cliente == 'mayorista' and descuento == 0:
            # Solo advertencia, no error
            attrs['_advertencia_mayorista'] = True
        
        # Validar que si hay descuento, el tipo sea apropiado
        if descuento > 0 and tipo_cliente == 'particular':
            # Solo advertencia, no error
            attrs['_advertencia_descuento'] = True
        
        return attrs
    
    def create(self, validated_data):
        """⭐ NUEVO: Lógica personalizada de creación"""
        # Remover campos de advertencia que no son del modelo
        validated_data.pop('_advertencia_mayorista', None)
        validated_data.pop('_advertencia_descuento', None)
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """⭐ NUEVO: Lógica personalizada de actualización"""
        # Remover campos de advertencia que no son del modelo
        validated_data.pop('_advertencia_mayorista', None)
        validated_data.pop('_advertencia_descuento', None)
        
        return super().update(instance, validated_data)

class ClienteResumenSerializer(serializers.ModelSerializer):
    """⭐ MEJORADO: Serializer simplificado para listas y selecciones"""
    tipo_cliente_display = serializers.CharField(source='get_tipo_cliente_display', read_only=True)
    tiene_descuento = serializers.ReadOnlyField()
    
    class Meta:
        model = Cliente
        fields = [
            'id', 'nombre', 'telefono', 'tipo_cliente', 'tipo_cliente_display', 
            'descuento_especial', 'tiene_descuento', 'activo'
        ]

class ClienteEstadisticasSerializer(serializers.Serializer):
    """⭐ NUEVO: Serializer para estadísticas de cliente"""
    total_pedidos = serializers.IntegerField()
    total_gastado = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_pagado = serializers.DecimalField(max_digits=10, decimal_places=2)
    saldo_pendiente = serializers.DecimalField(max_digits=10, decimal_places=2)
    pedidos_pendientes = serializers.IntegerField()
    pedidos_completados = serializers.IntegerField()
    promedio_pedido = serializers.DecimalField(max_digits=10, decimal_places=2)
    tasa_completacion = serializers.DecimalField(max_digits=5, decimal_places=2)

class ClienteConCalculosSerializer(ClienteSerializer):
    """⭐ NUEVO: Serializer con cálculos de descuento"""
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # Agregar ejemplo de cálculo de descuento
        if instance.descuento_especial > 0:
            ejemplo_calculo = instance.calcular_descuento(100000)  # Ejemplo con $100,000
            data['ejemplo_descuento'] = ejemplo_calculo
        
        return data