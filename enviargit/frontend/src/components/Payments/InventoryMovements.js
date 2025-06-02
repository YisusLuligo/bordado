import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ArrowUpCircle, 
  ArrowDownCircle,
  RefreshCw,
  Calendar,
  User,
  RotateCcw,
  Plus
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
  const [selectedType, setSelectedType] = useState('');
  const [dateFrom, setDateFrom] = useState('');

  // ⭐ NUEVO: Estado para modal de devolución
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Hook de notificaciones
  const { showSuccess, showError, showInfo, NotificationComponent } = useNotification();

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
      if (selectedType) params.tipo_movimiento = selectedType;
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
  }, [selectedProduct, selectedType, dateFrom]);

  // ⭐ ACTUALIZADO: Filtrar solo movimientos permitidos
  const filteredMovements = movements.filter(movement => {
    // Solo mostrar: salida_venta y devolucion
    const allowedTypes = ['salida_venta', 'devolucion'];
    if (!allowedTypes.includes(movement.tipo_movimiento)) {
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

  // ⭐ ACTUALIZADO: Solo tipos permitidos
  const getMovementTypeInfo = (tipo) => {
    const types = {
      salida_venta: { 
        label: 'Salida (Venta)', 
        color: '#2563eb', 
        bgColor: '#dbeafe',
        icon: ArrowDownCircle,
        description: 'Producto vendido directamente'
      },
      devolucion: { 
        label: 'Devolución', 
        color: '#059669', 
        bgColor: '#ecfdf5',
        icon: RotateCcw,
        description: 'Producto devuelto por cliente'
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
      salidas: filteredMovements.filter(m => m.tipo_movimiento === 'salida_venta').length,
      devoluciones: filteredMovements.filter(m => m.tipo_movimiento === 'devolucion').length
    };
  };

  // ⭐ NUEVA: Función para procesar devolución
const handleReturn = async (returnData) => {
  try {
    setLoading(true);
    
    const response = await finanzasAPI.createDevolucion({
      producto: returnData.producto,
      cantidad: returnData.cantidad,
      motivo: returnData.motivo,
      cliente: returnData.cliente,
      venta_original: returnData.venta_original || ''
    });

    if (response.data.success && response.data.notificacion) {
      const notif = response.data.notificacion;
      showSuccess(
        notif.titulo,
        notif.mensaje,
        { duration: notif.mostrar_por || 6000 }
      );
    } else {
      showSuccess(
        '✅ Devolución procesada exitosamente',
        `Se devolvieron ${returnData.cantidad} unidades de ${returnData.producto_nombre}. El stock se actualizó automáticamente.`,
        { duration: 6000 }
      );
    }

    setShowReturnModal(false);
    loadInitialData(); // Recargar datos
    
  } catch (error) {
    console.error('Error procesando devolución:', error);
    showError(
      'Error en devolución',
      error.response?.data?.error || 'No se pudo procesar la devolución. Inténtalo de nuevo.',
      { duration: 5000 }
    );
  } finally {
    setLoading(false);
  }
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
              Historial de ventas directas y devoluciones de productos
            </p>
          </div>
          
          {/* ⭐ NUEVO: Botón para registrar devolución */}
          <button 
            className="btn btn-primary"
            onClick={() => setShowReturnModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RotateCcw size={16} />
            Registrar Devolución
          </button>
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

            {/* ⭐ ACTUALIZADO: Solo tipos permitidos */}
            <div>
              <label className="form-label">Tipo de Movimiento</label>
              <select
                className="form-input"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                <option value="salida_venta">Salida (Venta)</option>
                <option value="devolucion">Devolución</option>
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
                setSelectedType('');
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

        {/* ⭐ ACTUALIZADO: Resumen simplificado */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
            Resumen de Movimientos
          </h3>
          <div className="grid grid-cols-3" style={{ gap: '1rem', textAlign: 'center' }}>
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
            
            <div style={{
              backgroundColor: '#ecfdf5',
              padding: '1rem',
              borderRadius: '0.375rem'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669' }}>
                {summary.devoluciones}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Devoluciones
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
              {searchTerm || selectedProduct || selectedType || dateFrom
                ? 'No se encontraron movimientos con los filtros aplicados'
                : 'No hay movimientos de inventario registrados'
              }
            </p>
            {!searchTerm && !selectedProduct && !selectedType && !dateFrom && (
              <div>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  Los movimientos aparecen automáticamente cuando:
                </p>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  • Se realizan ventas directas de productos<br />
                  • Se procesan devoluciones de clientes
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
                const isPositive = movement.tipo_movimiento === 'devolucion';
                
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
                              color: isPositive ? '#059669' : '#dc2626'
                            }}>
                              {isPositive ? '+' : '-'}{Math.abs(movement.cantidad)}
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

// ⭐ NUEVO: Componente para modal de devolución
// ⭐ NUEVO: Componente para modal de devolución
const ReturnModal = ({ products, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    producto: '',
    cantidad: 1,
    motivo: '',
    cliente: '',
    venta_original: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Hook de notificaciones
  const { showWarning, NotificationComponent } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cantidad') {
      const intValue = parseInt(value) || 1;
      if (intValue < 1) {
        showWarning(
          'Cantidad inválida',
          'La cantidad debe ser mayor a 0',
          { duration: 3000 }
        );
        return;
      }
      setFormData(prev => ({ ...prev, [name]: intValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Limpiar errores
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.producto) {
      newErrors.producto = 'Selecciona un producto';
    }

    if (!formData.cantidad || formData.cantidad < 1) {
      newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    }

    if (!formData.motivo.trim()) {
      newErrors.motivo = 'El motivo es requerido';
    }

    if (!formData.cliente.trim()) {
      newErrors.cliente = 'El nombre del cliente es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showWarning(
        'Formulario incompleto',
        'Por favor completa todos los campos requeridos',
        { duration: 4000 }
      );
      return;
    }

    setLoading(true);
    
    try {
      const selectedProduct = products.find(p => p.id == formData.producto);
      
      await onSuccess({
        ...formData,
        producto_nombre: selectedProduct?.nombre || 'Producto'
      });
    } catch (error) {
      console.error('Error en devolución:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {NotificationComponent}
      
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RotateCcw size={24} color="#059669" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Registrar Devolución
              </h2>
            </div>
            <button
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                color: '#6b7280'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Información */}
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '0.375rem',
            padding: '1rem',
            margin: '1.5rem',
            marginBottom: '0'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
              <strong>💡 Acerca de las devoluciones:</strong><br />
              • El stock del producto se aumentará automáticamente<br />
              • Se creará un registro en el historial de movimientos<br />
              • La devolución queda registrada para auditoría
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Producto *</label>
                <select
                  name="producto"
                  className="form-input"
                  value={formData.producto}
                  onChange={handleChange}
                  style={{
                    borderColor: errors.producto ? '#dc2626' : undefined
                  }}
                >
                  <option value="">Seleccionar producto</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.nombre} - Stock actual: {Math.floor(product.cantidad_actual)}
                    </option>
                  ))}
                </select>
                {errors.producto && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.producto}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Cantidad *</label>
                  <input
                    type="number"
                    name="cantidad"
                    className="form-input"
                    value={formData.cantidad}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    style={{
                      borderColor: errors.cantidad ? '#dc2626' : undefined
                    }}
                  />
                  {errors.cantidad && (
                    <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errors.cantidad}
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">Cliente *</label>
                  <input
                    type="text"
                    name="cliente"
                    className="form-input"
                    value={formData.cliente}
                    onChange={handleChange}
                    placeholder="Nombre del cliente"
                    style={{
                      borderColor: errors.cliente ? '#dc2626' : undefined
                    }}
                  />
                  {errors.cliente && (
                    <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errors.cliente}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Motivo de la Devolución *</label>
                <textarea
                  name="motivo"
                  className="form-input"
                  value={formData.motivo}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Explica el motivo de la devolución..."
                  style={{ 
                    resize: 'vertical',
                    borderColor: errors.motivo ? '#dc2626' : undefined
                  }}
                />
                {errors.motivo && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.motivo}
                  </div>
                )}
              </div>

              {/* Motivos rápidos */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                  💡 Motivos comunes:
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    'Producto defectuoso',
                    'No era lo esperado',
                    'Cambio de opinión',
                    'Error en la venta',
                    'Garantía'
                  ].map((motivo, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, motivo }))}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        color: '#374151'
                      }}
                    >
                      {motivo}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Venta Original (Opcional)</label>
                <input
                  type="text"
                  name="venta_original"
                  className="form-input"
                  value={formData.venta_original}
                  onChange={handleChange}
                  placeholder="# de venta o referencia"
                />
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Referencia de la venta original (opcional)
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              padding: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-success"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    Procesar Devolución
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default InventoryMovements;