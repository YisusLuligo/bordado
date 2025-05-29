from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import timedelta
from .models import Cliente
from .serializers import ClienteSerializer, ClienteResumenSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    
    def get_queryset(self):
        queryset = Cliente.objects.all()
        
        # Filtros opcionales
        activo = self.request.query_params.get('activo', None)
        tipo = self.request.query_params.get('tipo', None)
        buscar = self.request.query_params.get('buscar', None)
        
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
        
        if tipo:
            queryset = queryset.filter(tipo_cliente=tipo)
        
        if buscar:
            queryset = queryset.filter(
                Q(nombre__icontains=buscar) |
                Q(telefono__icontains=buscar) |
                Q(email__icontains=buscar)
            )
        
        return queryset.order_by('-fecha_registro')
    
    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen de clientes para selects y listas rápidas"""
        clientes = Cliente.objects.filter(activo=True)
        serializer = ClienteResumenSerializer(clientes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de clientes"""
        total_clientes = Cliente.objects.count()
        clientes_activos = Cliente.objects.filter(activo=True).count()
        clientes_nuevos_mes = Cliente.objects.filter(
            fecha_registro__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        # Clientes por tipo
        por_tipo = Cliente.objects.values('tipo_cliente').annotate(
            total=Count('id')
        ).order_by('tipo_cliente')
        
        return Response({
            'total_clientes': total_clientes,
            'clientes_activos': clientes_activos,
            'clientes_nuevos_mes': clientes_nuevos_mes,
            'distribucion_por_tipo': list(por_tipo)
        })
    
    @action(detail=True, methods=['get'])
    def historial_pedidos(self, request, pk=None):
        """Historial de pedidos de un cliente"""
        cliente = self.get_object()
        from pedidos.models import Pedido
        from pedidos.serializers import PedidoResumenSerializer
        
        pedidos = Pedido.objects.filter(cliente=cliente).order_by('-fecha_pedido')
        serializer = PedidoResumenSerializer(pedidos, many=True)
        
        # Estadísticas del cliente
        total_pedidos = pedidos.count()
        total_gastado = pedidos.aggregate(Sum('precio_total'))['precio_total__sum'] or 0
        pedidos_pendientes = pedidos.exclude(estado='entregado').count()
        
        return Response({
            'cliente': ClienteSerializer(cliente).data,
            'pedidos': serializer.data,
            'estadisticas': {
                'total_pedidos': total_pedidos,
                'total_gastado': total_gastado,
                'pedidos_pendientes': pedidos_pendientes
            }
        })