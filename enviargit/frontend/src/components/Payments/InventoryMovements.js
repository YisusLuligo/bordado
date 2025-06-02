import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ArrowDownCircle,
  RefreshCw,
  Calendar,
  User
} from 'lucide-react';
import { finanzasAPI, inventarioAPI } from '../../services/api';
import { useNotification } from '../Common/Notification';

const InventoryMovements = () => {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [dateFrom, setDateFrom] = useState('');

  // Hook de notificaciones
  const { showSuccess, showError, NotificationComponent } = useNotification();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [movementsResponse, productsResponse] = await Promise.all([
        finanzasAPI.getMovimientos(),
        inventarioAPI.getProductos()
      ]);
      
      setMovements(movementsResponse.data);
      setProducts(productsResponse.data);
    } catch (err) {
      setError('Error cargando movimientos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (selectedProduct) params.producto = selectedProduct;
      if (dateFrom) params.fecha_desde = dateFrom;
      
      const response = await finanzasAPI.getMovimientos(params);
      setMovements(response.data);
    } catch (err) {
      setError('Error cargando movimientos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recargar cuando cambien los filtros
  useEffect(() => {
    if (products.length > 0) {
      loadMovements();
    }
  }, [selectedProduct, dateFrom]);

  // Filtrar solo movimientos de ventas directas
  const filteredMovements = movements.filter(movement => {
    // Solo mostrar salida_venta
    if (movement.tipo_movimiento !== 'salida_venta') {
      return false;
    }

    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (movement.producto_info?.nombre && movement.producto_info.nombre.toLowerCase().includes(searchLower)) ||
      (movement.motivo && movement.motivo.toLowerCase().includes(searchLower)) ||
      (movement.usuario && movement.usuario.toLowerCase().includes(searchLower))
    );
  });

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMovementTypeInfo = (tipo) => {
    const types = {
      salida_venta: { 
        label: 'Salida (Venta)', 
        color: '#2563eb', 
        bgColor: '#dbeafe',
        icon: ArrowDownCircle,
        description: 'Producto vendido directamente'
      }
    };
    return types[tipo] || { 
      label: tipo, 
      color: '#6b7280', 
      bgColor: '#f3f4f6',
      icon: Package,
      description: 'Movimiento de inventario'
    };
  };

  const calculateSummary = () => {
    return {
      total: filteredMovements.length,
      salidas: filteredMovements.filter(m => m.tipo_movimiento === 'salida_venta').length
    };
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>Cargando movimientos de inventario...</p>
      </div>
    );
  }

  return (
    <>
      {/* Componente de notificaciones */}
      {NotificationComponent}
      
      <div style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
              Movimientos de Inventario
            </h2>
            <p style={{ color: '#6b7280' }}>
              Historial de ventas directas de productos
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Búsqueda */}
            <div>
              <label className="form-label">Buscar</label>
              <div style={{ position: 'relative' }}>
                <Search 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    left: '0.75rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#6b7280'
                  }} 
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Producto, motivo, usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Producto */}
            <div>
              <label className="form-label">Producto</label>
              <select
                className="form-input"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Todos los productos</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha desde */}
            <div>
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedProduct('');
                setDateFrom('');
              }}
              style={{ fontSize: '0.875rem' }}
            >
              Limpiar Filtros
            </button>
            
            <button
              className="btn btn-secondary"
              onClick={loadMovements}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={14} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Resumen simplificado */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
            Resumen de Movimientos
          </h3>
          <div className="grid grid-cols-2" style={{ gap: '1rem', textAlign: 'center' }}>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.375rem'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                {summary.total}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Total Movimientos
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#dbeafe',
              padding: '1rem',
              borderRadius: '0.375rem'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>
                {summary.salidas}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Ventas Directas
              </div>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="error">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadMovements}>
              Reintentar
            </button>
          </div>
        )}

        {/* Lista de movimientos */}
        {filteredMovements.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Package size={64} color="#6b7280" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>No hay movimientos</h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              {searchTerm || selectedProduct || dateFrom
                ? 'No se encontraron movimientos con los filtros aplicados'
                : 'No hay movimientos de inventario registrados'
              }
            </p>
            {!searchTerm && !selectedProduct && !dateFrom && (
              <div>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  Los movimientos aparecen automáticamente cuando:
                </p>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  • Se realizan ventas directas de productos
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            {/* Header de la lista */}
            <div style={{ 
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <span style={{ color: '#6b7280' }}>
                {filteredMovements.length} movimiento{filteredMovements.length !== 1 ? 's' : ''} encontrado{filteredMovements.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Lista de movimientos */}
            <div style={{ space: '0.5rem' }}>
              {filteredMovements.map((movement) => {
                const typeInfo = getMovementTypeInfo(movement.tipo_movimiento);
                const TypeIcon = typeInfo.icon;
                
                return (
                  <div key={movement.id} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    padding: '1rem',
                    marginBottom: '0.5rem',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Información principal */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <TypeIcon size={18} color={typeInfo.color} />
                          <span style={{
                            backgroundColor: typeInfo.bgColor,
                            color: typeInfo.color,
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            {typeInfo.label}
                          </span>
                          <span style={{ fontWeight: '500', color: '#1f2937' }}>
                            {movement.producto_info?.nombre || 'Producto no encontrado'}
                          </span>
                        </div>

                        <div className="grid grid-cols-4" style={{ gap: '1rem', fontSize: '0.875rem' }}>
                          {/* Cantidad */}
                          <div>
                            <span style={{ color: '#6b7280' }}>Cantidad: </span>
                            <span style={{ 
                              fontWeight: '600', 
                              color: '#dc2626'
                            }}>
                              -{Math.abs(movement.cantidad)}
                            </span>
                          </div>

                          {/* Stock anterior → nuevo */}
                          <div>
                            <span style={{ color: '#6b7280' }}>Stock: </span>
                            <span style={{ fontWeight: '500', color: '#374151' }}>
                              {Math.floor(movement.cantidad_anterior)} → {Math.floor(movement.cantidad_nueva)}
                            </span>
                          </div>

                          {/* Fecha */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={12} color="#6b7280" />
                            <span style={{ color: '#6b7280' }}>
                              {formatDateTime(movement.fecha)}
                            </span>
                          </div>

                          {/* Usuario */}
                          {movement.usuario && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <User size={12} color="#6b7280" />
                              <span style={{ color: '#6b7280' }}>
                                {movement.usuario}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Motivo */}
                        {movement.motivo && (
                          <div style={{ 
                            marginTop: '0.5rem', 
                            fontSize: '0.875rem', 
                            color: '#374151',
                            fontStyle: 'italic'
                          }}>
                            💬 {movement.motivo}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InventoryMovements;