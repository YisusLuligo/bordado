from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, F  # ⬅️ Agregar F aquí
from django.db import models       # ⬅️ Agregar esta línea
from .models import Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer, ProductoStockSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    
    @action(detail=False, methods=['get'])
    def con_productos(self, request):
        """Categorías con la cantidad de productos que tienen"""
        categorias = Categoria.objects.all()
        data = []
        for categoria in categorias:
            data.append({
                'id': categoria.id,
                'nombre': categoria.nombre,
                'descripcion': categoria.descripcion,
                'total_productos': categoria.producto_set.count(),
                'productos_bajo_stock': categoria.producto_set.filter(
                    cantidad_actual__lte=models.F('stock_minimo')
                ).count()
            })
        return Response(data)

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.select_related('categoria')
    serializer_class = ProductoSerializer
    
    def get_queryset(self):
        queryset = Producto.objects.select_related('categoria')
        
        # Filtros opcionales
        categoria = self.request.query_params.get('categoria', None)
        buscar = self.request.query_params.get('buscar', None)
        bajo_stock = self.request.query_params.get('bajo_stock', None)
        
        if categoria:
            queryset = queryset.filter(categoria_id=categoria)
        
        if buscar:
            queryset = queryset.filter(
                Q(nombre__icontains=buscar) |
                Q(marca__icontains=buscar) |
                Q(color__icontains=buscar)
            )
        
        if bajo_stock == 'true':
            queryset = queryset.filter(cantidad_actual__lte=models.F('stock_minimo'))
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def alertas_stock(self, request):
        """Productos que necesitan restock"""
        productos = Producto.objects.filter(
            cantidad_actual__lte=models.F('stock_minimo')
        ).select_related('categoria')
        serializer = ProductoStockSerializer(productos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ajustar_stock(self, request, pk=None):
        """Ajustar stock de un producto"""
        producto = self.get_object()
        nueva_cantidad = request.data.get('nueva_cantidad')
        motivo = request.data.get('motivo', 'Ajuste manual')
        
        if nueva_cantidad is None:
            return Response(
                {'error': 'nueva_cantidad es requerida'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Guardar cantidad anterior
        cantidad_anterior = producto.cantidad_actual
        producto.cantidad_actual = nueva_cantidad
        producto.save()
        
        # Crear movimiento de inventario
        from finanzas.models import MovimientoInventario
        MovimientoInventario.objects.create(
            producto=producto,
            tipo_movimiento='ajuste',
            cantidad=nueva_cantidad - cantidad_anterior,
            cantidad_anterior=cantidad_anterior,
            cantidad_nueva=nueva_cantidad,
            motivo=motivo,
            usuario=request.user.username if request.user.is_authenticated else 'Sistema'
        )
        
        serializer = self.get_serializer(producto)
        return Response(serializer.data)