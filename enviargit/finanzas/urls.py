from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VentaDirectaViewSet, 
    PagoPedidoViewSet, 
    MovimientoInventarioViewSet, 
    DashboardFinancieroViewSet
)

router = DefaultRouter()
router.register(r'ventas-directas', VentaDirectaViewSet)
router.register(r'pagos-pedidos', PagoPedidoViewSet)
router.register(r'movimientos-inventario', MovimientoInventarioViewSet)
router.register(r'dashboard', DashboardFinancieroViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]