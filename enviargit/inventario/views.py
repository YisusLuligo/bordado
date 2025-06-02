from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, F
from django.db import transaction
from .models import Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    
    def get_queryset(self):
        return Categoria.objects.all().order_by('nombre')

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()  # ← ESTA LÍNEA ES IMPORTANTE
    serializer_class = ProductoSerializer
    
    def get_queryset(self):
        queryset = Producto.objects.select_related('categoria').all()
        
        # Filtros opcionales
        categoria = self.request.query_params.get('categoria', None)
        bajo_stock = self.request.query_params.get('bajo_stock', None)
        buscar = self.request.query_params.get('buscar', None)
        
        if categoria:
            queryset = queryset.filter(categoria_id=categoria)
        
        if bajo_stock == 'true':
            queryset = queryset.filter(cantidad_actual__lte=F('stock_minimo'))
        
        if buscar:
            queryset = queryset.filter(
                Q(nombre__icontains=buscar) |
                Q(marca__icontains=buscar) |
                Q(color__icontains=buscar)
            )
        
        return queryset.order_by('-fecha_creacion')
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Crear producto con optimización"""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Validaciones adicionales
            data = serializer.validated_data
            
            if data['precio_venta'] <= data['precio_compra']:
                return Response(
                    {'error': 'El precio de venta debe ser mayor al precio de compra'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Guardar el producto
            producto = serializer.save()
            
            # Respuesta exitosa
            response_serializer = self.get_serializer(producto)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Error creando producto: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """Actualizar producto con optimización"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            
            # Validaciones adicionales
            data = serializer.validated_data
            
            if 'precio_venta' in data and 'precio_compra' in data:
                if data['precio_venta'] <= data['precio_compra']:
                    return Response(
                        {'error': 'El precio de venta debe ser mayor al precio de compra'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif 'precio_venta' in data and data['precio_venta'] <= instance.precio_compra:
                return Response(
                    {'error': 'El precio de venta debe ser mayor al precio de compra'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif 'precio_compra' in data and instance.precio_venta <= data['precio_compra']:
                return Response(
                    {'error': 'El precio de venta debe ser mayor al precio de compra'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Guardar cambios
            producto = serializer.save()
            
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Error actualizando producto: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def alertas_stock(self, request):
        """Productos que necesitan restock"""
        productos_bajo_stock = Producto.objects.select_related('categoria').filter(
            cantidad_actual__lte=F('stock_minimo')
        ).order_by('cantidad_actual')
        
        serializer = self.get_serializer(productos_bajo_stock, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ajustar_stock(self, request, pk=None):
        """Ajustar stock de un producto"""
        try:
            producto = self.get_object()
            nueva_cantidad = request.data.get('nueva_cantidad')
            motivo = request.data.get('motivo', '')
            
            if nueva_cantidad is None:
                return Response(
                    {'error': 'nueva_cantidad es requerida'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not motivo:
                return Response(
                    {'error': 'motivo es requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            nueva_cantidad = float(nueva_cantidad)
            if nueva_cantidad < 0:
                return Response(
                    {'error': 'La cantidad no puede ser negativa'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Crear movimiento de inventario
            from finanzas.models import MovimientoInventario
            
            cantidad_anterior = producto.cantidad_actual
            producto.cantidad_actual = nueva_cantidad
            producto.save()
            
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
            return Response({
                'mensaje': 'Stock ajustado exitosamente',
                'producto': serializer.data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error ajustando stock: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )