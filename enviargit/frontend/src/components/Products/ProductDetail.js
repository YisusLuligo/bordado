import React, { useState } from 'react';
import { X, Edit3, Settings, Save, AlertTriangle, Package } from 'lucide-react';
import { inventarioAPI } from '../../services/api';

const ProductDetail = ({ product, onClose, onEdit, onReload }) => {
  const [showStockAdjust, setShowStockAdjust] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    nueva_cantidad: product.cantidad_actual,
    motivo: ''
  });
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStockStatus = () => {
    if (product.cantidad_actual <= 0) {
      return { text: 'Sin Stock', color: '#dc2626', bgColor: '#fef2f2', icon: AlertTriangle };
    } else if (product.necesita_restock) {
      return { text: 'Stock Bajo', color: '#f59e0b', bgColor: '#fffbeb', icon: AlertTriangle };
    } else {
      return { text: 'Stock Suficiente', color: '#059669', bgColor: '#ecfdf5', icon: Package };
    }
  };

  const handleStockAdjustment = async () => {
    if (!adjustmentData.motivo.trim()) {
      alert('El motivo del ajuste es requerido');
      return;
    }

    setLoading(true);
    try {
      await inventarioAPI.ajustarStock(product.id, adjustmentData);
      alert('Stock ajustado exitosamente');
      setShowStockAdjust(false);
      onReload();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error ajustando stock');
    } finally {
      setLoading(false);
    }
  };

  const stockStatus = getStockStatus();
  const StatusIcon = stockStatus.icon;

  return (
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
        maxWidth: '700px',
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
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              {product.nombre}
            </h2>
            <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0' }}>
              {product.marca && `${product.marca} • `}
              {product.color && `Color: ${product.color}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onEdit(product)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Edit3 size={16} />
              Editar
            </button>
            <button
              onClick={onClose}
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
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {/* Estado del stock */}
          <div style={{
            backgroundColor: stockStatus.bgColor,
            border: `1px solid ${stockStatus.color}20`,
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <StatusIcon size={24} color={stockStatus.color} />
            <div>
              <div style={{ fontWeight: '600', color: stockStatus.color }}>
                {stockStatus.text}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {product.cantidad_actual} unidades disponibles • Mínimo requerido: {product.stock_minimo}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
            {/* Información del producto */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                Información del Producto
              </h3>
              
              <div style={{ space: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    Categoría
                  </label>
                  <div style={{ 
                    backgroundColor: '#f3f4f6',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    marginTop: '0.25rem'
                  }}>
                    {product.categoria_nombre}
                  </div>
                </div>

                {product.marca && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                      Marca
                    </label>
                    <div style={{ marginTop: '0.25rem', color: '#1f2937' }}>
                      {product.marca}
                    </div>
                  </div>
                )}

                {product.color && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                      Color
                    </label>
                    <div style={{ marginTop: '0.25rem', color: '#1f2937' }}>
                      {product.color}
                    </div>
                  </div>
                )}

                {product.proveedor && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                      Proveedor
                    </label>
                    <div style={{ marginTop: '0.25rem', color: '#1f2937' }}>
                      {product.proveedor}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Precios e inventario */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                Precios e Inventario
              </h3>
              
              <div style={{ space: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    Precio de Compra
                  </label>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginTop: '0.25rem' }}>
                    {formatCurrency(product.precio_compra)}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    Precio de Venta
                  </label>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#059669', marginTop: '0.25rem' }}>
                    {formatCurrency(product.precio_venta)}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                    <strong>Margen de ganancia:</strong><br />
                    {formatCurrency(product.precio_venta - product.precio_compra)} 
                    ({(((product.precio_venta - product.precio_compra) / product.precio_compra) * 100).toFixed(1)}%)
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    Stock Actual
                  </label>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginTop: '0.25rem' }}>
                    {product.cantidad_actual} unidades
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    Stock Mínimo
                  </label>
                  <div style={{ fontSize: '1rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {product.stock_minimo} unidades
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Información de Fechas
            </h3>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                  Fecha de Creación
                </label>
                <div style={{ marginTop: '0.25rem', color: '#6b7280' }}>
                  {formatDate(product.fecha_creacion)}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                  Última Actualización
                </label>
                <div style={{ marginTop: '0.25rem', color: '#6b7280' }}>
                  {formatDate(product.fecha_actualizacion)}
                </div>
              </div>
            </div>
          </div>

          {/* Ajuste de stock */}
          {!showStockAdjust ? (
            <div style={{ marginTop: '2rem' }}>
              <button
                onClick={() => setShowStockAdjust(true)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Settings size={16} />
                Ajustar Stock
              </button>
            </div>
          ) : (
            <div style={{
              marginTop: '2rem',
              backgroundColor: '#f9fafb',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                Ajustar Stock
              </h4>
              
              <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Nueva Cantidad</label>
                  <input
                    type="number"
                    className="form-input"
                    value={adjustmentData.nueva_cantidad}
                    onChange={(e) => setAdjustmentData(prev => ({
                      ...prev,
                      nueva_cantidad: parseInt(e.target.value) || 0
                    }))}
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">Diferencia</label>
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    color: adjustmentData.nueva_cantidad - product.cantidad_actual >= 0 ? '#059669' : '#dc2626'
                  }}>
                    {adjustmentData.nueva_cantidad - product.cantidad_actual >= 0 ? '+' : ''}
                    {adjustmentData.nueva_cantidad - product.cantidad_actual}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Motivo del Ajuste *</label>
                <input
                  type="text"
                  className="form-input"
                  value={adjustmentData.motivo}
                  onChange={(e) => setAdjustmentData(prev => ({
                    ...prev,
                    motivo: e.target.value
                  }))}
                  placeholder="Ej: Reposición de inventario, Corrección por conteo físico..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleStockAdjustment}
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                      Ajustando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Confirmar Ajuste
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowStockAdjust(false)}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;