from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum, Count, F
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
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
            # Permitir múltiples estados separados por coma
            if ',' in estado:
                estados = estado.split(',')
                queryset = queryset.filter(estado__in=estados)
            else:
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
        """Dashboard de pedidos - ⭐ MEJORADO"""
        try:
            hoy = timezone.now().date()
            
            # Estadísticas básicas
            todos_los_pedidos = Pedido.objects.all()
            total_pedidos = todos_los_pedidos.count()
            
            # ⭐ CORREGIDO: Pedidos activos (no entregados ni cancelados)
            pedidos_activos = todos_los_pedidos.exclude(
                estado__in=['entregado', 'cancelado']
            ).count()
            
            # Pedidos que deben entregarse hoy
            pendientes_entrega_hoy = todos_los_pedidos.filter(
                fecha_entrega_prometida__date=hoy,
                estado__in=['en_proceso', 'terminado']
            ).count()
            
            # ⭐ NUEVO: Pedidos por entregar esta semana
            fin_semana = hoy + timedelta(days=7)
            pendientes_esta_semana = todos_los_pedidos.filter(
                fecha_entrega_prometida__date__gte=hoy,
                fecha_entrega_prometida__date__lte=fin_semana,
                estado__in=['recibido', 'en_diseno', 'aprobado', 'en_proceso', 'terminado']
            ).count()
            
            # Pedidos por estado
            por_estado = todos_los_pedidos.values('estado').annotate(
                total=Count('id')
            ).order_by('estado')
            
            # ⭐ CORREGIDO: Cálculos financieros más precisos
            aggregated_data = todos_los_pedidos.aggregate(
                total_facturado=Sum('precio_total'),
                total_pagado=Sum('adelanto_pagado')
            )
            
            total_facturado = aggregated_data['total_facturado'] or 0
            total_pagado = aggregated_data['total_pagado'] or 0
            ingresos_pendientes = total_facturado - total_pagado
            
            # ⭐ NUEVO: Estadísticas adicionales útiles
            pedidos_este_mes = todos_los_pedidos.filter(
                fecha_pedido__month=hoy.month,
                fecha_pedido__year=hoy.year
            ).count()
            
            promedio_pedido = total_facturado / total_pedidos if total_pedidos > 0 else 0
            
            # ⭐ NUEVO: Pedidos próximos a vencer (útil para alertas)
            proximos_a_vencer = todos_los_pedidos.filter(
                fecha_entrega_prometida__date__lte=hoy + timedelta(days=3),
                fecha_entrega_prometida__date__gte=hoy,
                estado__in=['recibido', 'en_diseno', 'aprobado', 'en_proceso']
            ).count()
            
            response_data = {
                'total_pedidos': total_pedidos,
                'pedidos_activos': pedidos_activos,
                'pedidos_este_mes': pedidos_este_mes,
                'pendientes_entrega_hoy': pendientes_entrega_hoy,
                'pendientes_esta_semana': pendientes_esta_semana,
                'proximos_a_vencer': proximos_a_vencer,
                'distribucion_por_estado': list(por_estado),
                'ingresos_pendientes': float(ingresos_pendientes),
                'total_facturado': float(total_facturado),
                'total_cobrado': float(total_pagado),
                'promedio_pedido': float(promedio_pedido),
                'porcentaje_cobrado': float((total_pagado / total_facturado * 100) if total_facturado > 0 else 0),
                'timestamp': timezone.now().isoformat()  # Para debug
            }
            
            return Response(response_data)
            
        except Exception as e:
            print(f"Error en dashboard de pedidos: {e}")
            return Response({
                'error': 'Error calculando dashboard de pedidos',
                'total_pedidos': 0,
                'pedidos_activos': 0,
                'ingresos_pendientes': 0
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado de un pedido - ⭐ MEJORADO"""
        try:
            pedido = self.get_object()
            nuevo_estado = request.data.get('estado')
            
            if nuevo_estado not in [choice[0] for choice in Pedido.ESTADO_CHOICES]:
                return Response(
                    {'error': 'Estado inválido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            estado_anterior = pedido.estado
            pedido.estado = nuevo_estado
            
            # ⭐ MEJORADO: Lógica automática para fechas
            if nuevo_estado == 'entregado' and not pedido.fecha_entrega_real:
                pedido.fecha_entrega_real = timezone.now()
            
            # ⭐ NUEVO: Si se cancela, limpiar fecha de entrega real
            if nuevo_estado == 'cancelado':
                pedido.fecha_entrega_real = None
            
            pedido.save()
            
            # ⭐ NUEVO: Log del cambio
            print(f"Pedido #{pedido.id}: {estado_anterior} → {nuevo_estado}")
            
            serializer = self.get_serializer(pedido)
            return Response({
                'pedido': serializer.data,
                'mensaje': f'Estado cambiado de "{estado_anterior}" a "{nuevo_estado}"',
                'estado_anterior': estado_anterior,
                'nuevo_estado': nuevo_estado
            })
            
        except Exception as e:
            print(f"Error cambiando estado del pedido {pk}: {e}")
            return Response(
                {'error': f'Error cambiando estado: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def agregar_pago(self, request, pk=None):
        """Registrar un pago para el pedido"""
        try:
            pedido = self.get_object()
            monto = request.data.get('monto')
            metodo_pago = request.data.get('metodo_pago', 'efectivo')
            concepto = request.data.get('concepto', 'Pago parcial')
            
            if not monto:
                return Response(
                    {'error': 'Monto es requerido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar que el monto no exceda el saldo pendiente
            monto_decimal = Decimal(str(monto))
            if monto_decimal > pedido.saldo_pendiente:
                return Response(
                    {'error': f'El monto no puede ser mayor al saldo pendiente ({pedido.saldo_pendiente})'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Crear registro de pago
            from finanzas.models import PagoPedido
            pago = PagoPedido.objects.create(
                pedido=pedido,
                monto=monto_decimal,
                metodo_pago=metodo_pago,
                concepto=concepto,
                notas=request.data.get('notas', '')
            )
            
            # Actualizar adelanto en el pedido
            pedido.adelanto_pagado += monto_decimal
            pedido.save()
            
            return Response({
                'mensaje': 'Pago registrado exitosamente',
                'pago_id': pago.id,
                'monto_pagado': float(monto_decimal),
                'nuevo_saldo_pendiente': float(pedido.saldo_pendiente),
                'esta_pagado': pedido.esta_pagado,
                'adelanto_total': float(pedido.adelanto_pagado)
            })
            
        except Exception as e:
            print(f"Error agregando pago al pedido {pk}: {e}")
            return Response(
                {'error': f'Error registrando pago: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # ⭐ NUEVO: Endpoint útil para cambiar múltiples pedidos a entregado
    @action(detail=False, methods=['post'])
    def marcar_entregados(self, request):
        """Marcar múltiples pedidos como entregados"""
        try:
            pedido_ids = request.data.get('pedido_ids', [])
            
            if not pedido_ids:
                return Response(
                    {'error': 'Debe proporcionar al menos un ID de pedido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            pedidos_actualizados = Pedido.objects.filter(
                id__in=pedido_ids,
                estado__in=['terminado']  # Solo pedidos terminados pueden marcarse como entregados
            )
            
            count = pedidos_actualizados.update(
                estado='entregado',
                fecha_entrega_real=timezone.now()
            )
            
            return Response({
                'mensaje': f'{count} pedido(s) marcado(s) como entregado(s)',
                'pedidos_actualizados': count
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error marcando pedidos como entregados: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )