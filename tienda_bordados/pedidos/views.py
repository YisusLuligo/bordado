from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum, Count, F  # ⬅️ F agregado aquí
from django.utils import timezone
from datetime import timedelta
from .models import Pedido, DetallePedido
from .serializers import PedidoSerializer, PedidoResumenSerializer, DetallePedidoSerializer

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.select_related('cliente')
    serializer_class = PedidoSerializer
    
    def get_queryset(self):
        queryset = Pedido.objects.select_related('cliente')
        
        # Filtros opcionales
        estado = self.request.query_params.get('estado', None)
        cliente = self.request.query_params.get('cliente', None)
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        pendiente_pago = self.request.query_params.get('pendiente_pago', None)
        
        if estado:
            queryset = queryset.filter(estado=estado)
        
        if cliente:
            queryset = queryset.filter(cliente_id=cliente)
        
        if fecha_desde:
            queryset = queryset.filter(fecha_pedido__gte=fecha_desde)
        
        if fecha_hasta:
            queryset = queryset.filter(fecha_pedido__lte=fecha_hasta)
        
        if pendiente_pago == 'true':
            queryset = queryset.filter(adelanto_pagado__lt=F('precio_total'))
        
        return queryset.order_by('-fecha_pedido')
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard de pedidos"""
        hoy = timezone.now().date()
        
        # Estadísticas generales
        total_pedidos = Pedido.objects.count()
        pedidos_activos = Pedido.objects.exclude(estado__in=['entregado', 'cancelado']).count()
        pendientes_entrega_hoy = Pedido.objects.filter(
            fecha_entrega_prometida__date=hoy,
            estado__in=['en_proceso', 'terminado']
        ).count()
        
        # Pedidos por estado
        por_estado = Pedido.objects.values('estado').annotate(
            total=Count('id')
        ).order_by('estado')
        
        # Ingresos pendientes
        ingresos_pendientes = Pedido.objects.aggregate(
            Sum('precio_total')
        )['precio_total__sum'] or 0
        
        pagos_recibidos = Pedido.objects.aggregate(
            Sum('adelanto_pagado')
        )['adelanto_pagado__sum'] or 0
        
        return Response({
            'total_pedidos': total_pedidos,
            'pedidos_activos': pedidos_activos,
            'pendientes_entrega_hoy': pendientes_entrega_hoy,
            'distribucion_por_estado': list(por_estado),
            'ingresos_pendientes': ingresos_pendientes - pagos_recibidos,
            'total_facturado': ingresos_pendientes,
            'total_cobrado': pagos_recibidos
        })
    
    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado de un pedido"""
        pedido = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado not in [choice[0] for choice in Pedido.ESTADO_CHOICES]:
            return Response(
                {'error': 'Estado inválido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pedido.estado = nuevo_estado
        
        # Si se marca como entregado, registrar fecha
        if nuevo_estado == 'entregado':
            pedido.fecha_entrega_real = timezone.now()
        
        pedido.save()
        
        serializer = self.get_serializer(pedido)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def agregar_pago(self, request, pk=None):
        """Registrar un pago para el pedido"""
        pedido = self.get_object()
        monto = request.data.get('monto')
        metodo_pago = request.data.get('metodo_pago', 'efectivo')
        concepto = request.data.get('concepto', 'Pago parcial')
        
        if not monto:
            return Response(
                {'error': 'Monto es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear registro de pago
        from finanzas.models import PagoPedido
        pago = PagoPedido.objects.create(
            pedido=pedido,
            monto=monto,
            metodo_pago=metodo_pago,
            concepto=concepto,
            notas=request.data.get('notas', '')
        )
        
        # Actualizar adelanto en el pedido
        pedido.adelanto_pagado += float(monto)
        pedido.save()
        
        return Response({
            'mensaje': 'Pago registrado exitosamente',
            'nuevo_saldo_pendiente': pedido.saldo_pendiente,
            'esta_pagado': pedido.esta_pagado
        })