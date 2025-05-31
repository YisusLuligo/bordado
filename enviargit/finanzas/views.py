from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum, Count, F, Avg
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
from .models import VentaDirecta, DetalleVentaDirecta, PagoPedido, MovimientoInventario
from .serializers import (
    VentaDirectaSerializer, PagoPedidoSerializer, MovimientoInventarioSerializer,
    ResumenFinancieroSerializer, ProductoVentasSerializer
)
from inventario.models import Producto
from pedidos.models import Pedido
from clientes.models import Cliente

class VentaDirectaViewSet(viewsets.ModelViewSet):
    queryset = VentaDirecta.objects.select_related('cliente')
    serializer_class = VentaDirectaSerializer
    
    def get_queryset(self):
        queryset = VentaDirecta.objects.select_related('cliente')
        
        # Filtros opcionales
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        metodo_pago = self.request.query_params.get('metodo_pago', None)
        cliente = self.request.query_params.get('cliente', None)
        
        if fecha_desde:
            queryset = queryset.filter(fecha_venta__gte=fecha_desde)
        
        if fecha_hasta:
            queryset = queryset.filter(fecha_venta__lte=fecha_hasta)
        
        if metodo_pago:
            queryset = queryset.filter(metodo_pago=metodo_pago)
        
        if cliente:
            queryset = queryset.filter(cliente_id=cliente)
        
        return queryset.order_by('-fecha_venta')

class PagoPedidoViewSet(viewsets.ModelViewSet):
    queryset = PagoPedido.objects.select_related('pedido', 'pedido__cliente')
    serializer_class = PagoPedidoSerializer
    
    def get_queryset(self):
        queryset = PagoPedido.objects.select_related('pedido', 'pedido__cliente')
        
        # Filtros opcionales
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        pedido = self.request.query_params.get('pedido', None)
        
        if fecha_desde:
            queryset = queryset.filter(fecha_pago__gte=fecha_desde)
        
        if fecha_hasta:
            queryset = queryset.filter(fecha_pago__lte=fecha_hasta)
        
        if pedido:
            queryset = queryset.filter(pedido_id=pedido)
        
        return queryset.order_by('-fecha_pago')
    
    def create(self, request, *args, **kwargs):
        """AQUÍ ESTÁ LA CORRECCIÓN: Actualizar saldo automáticamente"""
        # Crear el pago normalmente
        response = super().create(request, *args, **kwargs)
        
        if response.status_code == 201:  # Si se creó exitosamente
            # Obtener el pago creado
            pago_id = response.data['id']
            pago = PagoPedido.objects.get(id=pago_id)
            
            # Actualizar el adelanto del pedido
            pedido = pago.pedido
            pedido.adelanto_pagado += Decimal(str(pago.monto))
            pedido.save()
            
            # Actualizar la respuesta con información útil
            response.data['pedido_saldo_actualizado'] = str(pedido.saldo_pendiente)
            response.data['pedido_esta_pagado'] = pedido.esta_pagado
            response.data['mensaje'] = f'Pago registrado. Saldo pendiente: ${pedido.saldo_pendiente}'
        
        return response

class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.select_related('producto', 'producto__categoria')
    serializer_class = MovimientoInventarioSerializer
    
    def get_queryset(self):
        queryset = MovimientoInventario.objects.select_related('producto', 'producto__categoria')
        
        # Filtros opcionales
        producto = self.request.query_params.get('producto', None)
        tipo_movimiento = self.request.query_params.get('tipo_movimiento', None)
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        
        if producto:
            queryset = queryset.filter(producto_id=producto)
        
        if tipo_movimiento:
            queryset = queryset.filter(tipo_movimiento=tipo_movimiento)
        
        if fecha_desde:
            queryset = queryset.filter(fecha__gte=fecha_desde)
        
        return queryset.order_by('-fecha')

class DashboardFinancieroViewSet(viewsets.ViewSet):
    """ViewSet especial para reportes y dashboard financiero"""
    
    @action(detail=False, methods=['get'])
    def resumen_general(self, request):
        """Dashboard principal con todas las métricas"""
        hoy = timezone.now().date()
        inicio_semana = hoy - timedelta(days=hoy.weekday())
        inicio_mes = hoy.replace(day=1)
        
        # Ingresos por ventas directas
        ventas_hoy = VentaDirecta.objects.filter(fecha_venta__date=hoy).aggregate(
            Sum('total'))['total__sum'] or Decimal('0')
        
        ventas_semana = VentaDirecta.objects.filter(fecha_venta__date__gte=inicio_semana).aggregate(
            Sum('total'))['total__sum'] or Decimal('0')
        
        ventas_mes = VentaDirecta.objects.filter(fecha_venta__date__gte=inicio_mes).aggregate(
            Sum('total'))['total__sum'] or Decimal('0')
        
        # Ingresos por servicios de bordado (pagos de pedidos)
        pagos_hoy = PagoPedido.objects.filter(fecha_pago__date=hoy).aggregate(
            Sum('monto'))['monto__sum'] or Decimal('0')
        
        pagos_semana = PagoPedido.objects.filter(fecha_pago__date__gte=inicio_semana).aggregate(
            Sum('monto'))['monto__sum'] or Decimal('0')
        
        pagos_mes = PagoPedido.objects.filter(fecha_pago__date__gte=inicio_mes).aggregate(
            Sum('monto'))['monto__sum'] or Decimal('0')
        
        # Totales combinados
        ingresos_hoy = ventas_hoy + pagos_hoy
        ingresos_semana = ventas_semana + pagos_semana
        ingresos_mes = ventas_mes + pagos_mes
        
        # Pedidos pendientes de pago
        pedidos_pendientes_pago = Pedido.objects.filter(
            adelanto_pagado__lt=F('precio_total')
        ).aggregate(
            total=Sum(F('precio_total') - F('adelanto_pagado'))
        )['total'] or Decimal('0')
        
        # Productos bajo stock
        productos_bajo_stock = Producto.objects.filter(
            cantidad_actual__lte=F('stock_minimo')
        ).count()
        
        # Pedidos en proceso
        pedidos_en_proceso = Pedido.objects.filter(
            estado__in=['en_proceso', 'terminado']
        ).count()
        
        # Clientes nuevos este mes
        clientes_nuevos_mes = Cliente.objects.filter(
            fecha_registro__gte=inicio_mes
        ).count()
        
        data = {
            'ingresos_hoy': ingresos_hoy,
            'ingresos_semana': ingresos_semana,
            'ingresos_mes': ingresos_mes,
            'pedidos_pendientes_pago': pedidos_pendientes_pago,
            'productos_bajo_stock': productos_bajo_stock,
            'pedidos_en_proceso': pedidos_en_proceso,
            'clientes_nuevos_mes': clientes_nuevos_mes
        }
        
        serializer = ResumenFinancieroSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def productos_mas_vendidos(self, request):
        """Reporte de productos más vendidos"""
        dias = int(request.query_params.get('dias', 30))
        fecha_desde = timezone.now().date() - timedelta(days=dias)
        
        # Ventas directas
        ventas_directas = DetalleVentaDirecta.objects.filter(
            venta__fecha_venta__date__gte=fecha_desde
        ).values(
            'producto__nombre'
        ).annotate(
            total_vendido=Sum('subtotal'),
            cantidad_vendida=Sum('cantidad')
        )
        
        # Calcular ganancia (precio_venta - precio_compra) * cantidad
        productos_vendidos = []
        for venta in ventas_directas:
            try:
                producto = Producto.objects.get(nombre=venta['producto__nombre'])
                ganancia_unitaria = producto.precio_venta - producto.precio_compra
                ganancia_total = ganancia_unitaria * venta['cantidad_vendida']
                
                productos_vendidos.append({
                    'producto_nombre': venta['producto__nombre'],
                    'total_vendido': venta['total_vendido'],
                    'cantidad_vendida': venta['cantidad_vendida'],
                    'ganancia': ganancia_total
                })
            except Producto.DoesNotExist:
                continue
        
        # Ordenar por total vendido
        productos_vendidos.sort(key=lambda x: x['total_vendido'], reverse=True)
        
        serializer = ProductoVentasSerializer(productos_vendidos[:10], many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ingresos_por_periodo(self, request):
        """Gráfico de ingresos por período"""
        periodo = request.query_params.get('periodo', 'mes')  # dia, semana, mes
        dias = int(request.query_params.get('dias', 30))
        
        ingresos_por_fecha = []
        fecha_actual = timezone.now().date()
        
        for i in range(dias):
            fecha = fecha_actual - timedelta(days=i)
            
            ventas_dia = VentaDirecta.objects.filter(
                fecha_venta__date=fecha
            ).aggregate(Sum('total'))['total__sum'] or Decimal('0')
            
            pagos_dia = PagoPedido.objects.filter(
                fecha_pago__date=fecha
            ).aggregate(Sum('monto'))['monto__sum'] or Decimal('0')
            
            total_dia = ventas_dia + pagos_dia
            
            ingresos_por_fecha.append({
                'fecha': fecha,
                'ingresos_ventas': ventas_dia,
                'ingresos_servicios': pagos_dia,
                'total': total_dia
            })
        
        # Ordenar por fecha ascendente
        ingresos_por_fecha.reverse()
        
        return Response(ingresos_por_fecha)