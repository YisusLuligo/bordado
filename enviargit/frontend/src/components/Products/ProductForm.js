import React, { useState, useEffect } from 'react';
import { X, Save, Package, DollarSign } from 'lucide-react';
import { inventarioAPI } from '../../services/api';
import { useNotification } from '../Common/Notification';

const ProductForm = ({ product, categories, mode, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    marca: '',
    color: '',
    cantidad_actual: 0,
    stock_minimo: 5,
    precio_compra: '',
    precio_venta: '',
    proveedor: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Hook de notificaciones
  const { showSuccess, showError, showWarning, NotificationComponent } = useNotification();

  useEffect(() => {
    if (mode === 'edit' && product) {
      setFormData({
        nombre: product.nombre || '',
        categoria: product.categoria || '',
        marca: product.marca || '',
        color: product.color || '',
        cantidad_actual: Math.floor(product.cantidad_actual) || 0, // Solo números enteros
        stock_minimo: Math.floor(product.stock_minimo) || 5, // Solo números enteros
        precio_compra: product.precio_compra || '',
        precio_venta: product.precio_venta || '',
        proveedor: product.proveedor || ''
      });
    }
  }, [product, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Para campos de cantidad, solo permitir números enteros
    if (name === 'cantidad_actual' || name === 'stock_minimo') {
      const intValue = parseInt(value) || 0;
      if (intValue < 0) {
        showWarning(
          'Valor inválido',
          'Las cantidades no pueden ser negativas',
          { duration: 3000 }
        );
        return;
      }
      setFormData(prev => ({
        ...prev,
        [name]: intValue
      }));
    } 
    // Para campos de precio, validar que sean números positivos
    else if (name === 'precio_compra' || name === 'precio_venta') {
      // Permitir solo números y punto decimal
      const numberRegex = /^\d*\.?\d*$/;
      if (value === '' || numberRegex.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      } else {
        showWarning(
          'Formato inválido',
          'Los precios solo pueden contener números y un punto decimal',
          { duration: 3000 }
        );
      }
    } 
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.categoria) {
      newErrors.categoria = 'La categoría es requerida';
    }

    const precioCompra = parseFloat(formData.precio_compra);
    const precioVenta = parseFloat(formData.precio_venta);

    if (!formData.precio_compra || precioCompra <= 0) {
      newErrors.precio_compra = 'El precio de compra debe ser mayor a 0';
    }

    if (!formData.precio_venta || precioVenta <= 0) {
      newErrors.precio_venta = 'El precio de venta debe ser mayor a 0';
    }

    if (precioCompra > 0 && precioVenta > 0 && precioVenta <= precioCompra) {
      newErrors.precio_venta = 'El precio de venta debe ser mayor al precio de compra';
    }

    if (formData.cantidad_actual < 0) {
      newErrors.cantidad_actual = 'La cantidad no puede ser negativa';
    }

    if (formData.stock_minimo < 0) {
      newErrors.stock_minimo = 'El stock mínimo no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showWarning(
        'Formulario incompleto',
        'Por favor corrige los errores antes de continuar',
        { duration: 4000 }
      );
      return;
    }

    // Validación adicional de precios
    const precioCompra = parseFloat(formData.precio_compra);
    const precioVenta = parseFloat(formData.precio_venta);
    const margen = ((precioVenta - precioCompra) / precioCompra) * 100;
    
    if (margen < 10) {
      const continuar = window.confirm(
        `El margen de ganancia es muy bajo (${margen.toFixed(1)}%).\n\n` +
        `Precio de compra: $${precioCompra.toLocaleString('es-CO')}\n` +
        `Precio de venta: $${precioVenta.toLocaleString('es-CO')}\n` +
        `Ganancia: $${(precioVenta - precioCompra).toLocaleString('es-CO')}\n\n` +
        `¿Estás seguro de continuar?`
      );
      
      if (!continuar) {
        return;
      }
    }

    setLoading(true);
    
    try {
      const dataToSend = {
        ...formData,
        precio_compra: precioCompra,
        precio_venta: precioVenta,
        cantidad_actual: parseInt(formData.cantidad_actual),
        stock_minimo: parseInt(formData.stock_minimo)
      };

      if (mode === 'edit') {
        await inventarioAPI.updateProducto(product.id, dataToSend);
        showSuccess(
          '¡Producto actualizado!',
          `${formData.nombre} ha sido actualizado exitosamente`,
          { duration: 5000 }
        );
      } else {
        await inventarioAPI.createProducto(dataToSend);
        showSuccess(
          '¡Producto creado!',
          `${formData.nombre} ha sido agregado al inventario con éxito`,
          { duration: 5000 }
        );
      }
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (error) {
      console.error('Error:', error);
      
      let errorMessage = `Error ${mode === 'edit' ? 'actualizando' : 'creando'} el producto`;
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data) {
        // Manejar errores de validación del backend
        const errorData = error.response.data;
        if (errorData.nombre && errorData.nombre[0]) {
          errorMessage = `Nombre: ${errorData.nombre[0]}`;
        } else if (errorData.precio_compra && errorData.precio_compra[0]) {
          errorMessage = `Precio de compra: ${errorData.precio_compra[0]}`;
        } else if (errorData.precio_venta && errorData.precio_venta[0]) {
          errorMessage = `Precio de venta: ${errorData.precio_venta[0]}`;
        }
      }
      
      showError(
        mode === 'edit' ? 'Error al actualizar' : 'Error al crear',
        errorMessage,
        { duration: 6000 }
      );
    } finally {
      setLoading(false);
    }
  };

  // Sugerencias de precios comunes
  const getSugerenciasPrecios = () => {
    const precioCompra = parseFloat(formData.precio_compra);
    if (precioCompra > 0) {
      return [
        { label: '+30%', valor: (precioCompra * 1.3).toFixed(0) },
        { label: '+50%', valor: (precioCompra * 1.5).toFixed(0) },
        { label: '+100%', valor: (precioCompra * 2).toFixed(0) }
      ];
    }
    return [];
  };

  const sugerenciasPrecios = getSugerenciasPrecios();

  return (
    <>
      {/* Componente de notificaciones */}
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
          maxWidth: '600px',
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
              <Package size={24} color="#2563eb" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {mode === 'edit' ? 'Editar Producto' : 'Nuevo Producto'}
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

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ padding: '1.5rem' }}>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                {/* Nombre */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    className="form-input"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Hilo Madeira Rayon"
                  />
                  {errors.nombre && (
                    <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errors.nombre}
                    </div>
                  )}
                </div>

                {/* Categoría */}
                <div className="form-group">
                  <label className="form-label">
                    Categoría *
                  </label>
                  <select
                    name="categoria"
                    className="form-input"
                    value={formData.categoria}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                  {errors.categoria && (
                    <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errors.categoria}
                    </div>
                  )}
                </div>

                {/* Marca */}
                <div className="form-group">
                  <label className="form-label">
                    Marca
                  </label>
                  <input
                    type="text"
                    name="marca"
                    className="form-input"
                    value={formData.marca}
                    onChange={handleChange}
                    placeholder="Ej: Madeira"
                  />
                </div>

                {/* Color */}
                <div className="form-group">
                  <label className="form-label">
                    Color
                  </label>
                  <input
                    type="text"
                    name="color"
                    className="form-input"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="Ej: Rojo"
                  />
                </div>

                {/* Proveedor */}
                <div className="form-group">
                  <label className="form-label">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    name="proveedor"
                    className="form-input"
                    value={formData.proveedor}
                    onChange={handleChange}
                    placeholder="Ej: Distribuidora Textil"
                  />
                </div>

                {/* Cantidad actual */}
                <div className="form-group">
                  <label className="form-label">
                    Cantidad Actual (unidades)
                  </label>
                  <input
                    type="number"
                    name="cantidad_actual"
                    className="form-input"
                    value={formData.cantidad_actual}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="0"
                  />
                  {errors.cantidad_actual && (
                    <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errors.cantidad_actual}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    ⚠️ Solo números enteros (ej: 1, 2, 3...)
                  </div>
                </div>

                {/* Stock mínimo */}
                <div className="form-group">
                  <label className="form-label">
                    Stock Mínimo (unidades)
                  </label>
                  <input
                    type="number"
                    name="stock_minimo"
                    className="form-input"
                    value={formData.stock_minimo}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="5"
                  />
                  {errors.stock_minimo && (
                    <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errors.stock_minimo}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Te alertará cuando llegue a este número
                  </div>
                </div>

                {/* Precio de compra */}
                <div className="form-group">
                  <label className="form-label">
                    Precio de Compra *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign 
                      size={16} 
                      style={{ 
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7280',
                        pointerEvents: 'none'
                      }}
                    />
                    <input
                      type="text"
                      name="precio_compra"
                      className="form-input"
                      value={formData.precio_compra}
                      onChange={handleChange}
                      placeholder="Ej: 15000"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                  {errors.precio_compra && (
                    <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errors.precio_compra}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    💰 Precio al que compras el producto
                  </div>
                </div>

                {/* Precio de venta */}
                <div className="form-group">
                  <label className="form-label">
                    Precio de Venta *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign 
                      size={16} 
                      style={{ 
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7280',
                        pointerEvents: 'none'
                      }}
                    />
                    <input
                      type="text"
                      name="precio_venta"
                      className="form-input"
                      value={formData.precio_venta}
                      onChange={handleChange}
                      placeholder="Ej: 25000"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                  {errors.precio_venta && (
                    <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errors.precio_venta}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    💸 Precio al que vendes el producto
                  </div>
                  
                  {/* Sugerencias de precios */}
                  {sugerenciasPrecios.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#374151', marginBottom: '0.25rem' }}>
                        💡 Sugerencias basadas en tu precio de compra:
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {sugerenciasPrecios.map((sugerencia, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, precio_venta: sugerencia.valor }))}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              backgroundColor: '#f3f4f6',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              color: '#374151'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#e5e7eb';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#f3f4f6';
                            }}
                          >
                            {sugerencia.label}: ${parseInt(sugerencia.valor).toLocaleString('es-CO')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cálculo de margen */}
              {formData.precio_compra && formData.precio_venta && (
                <div style={{
                  backgroundColor: parseFloat(formData.precio_venta) > parseFloat(formData.precio_compra) 
                    ? (((parseFloat(formData.precio_venta) - parseFloat(formData.precio_compra)) / parseFloat(formData.precio_compra)) * 100) >= 30 
                      ? '#ecfdf5' 
                      : '#fffbeb'
                    : '#fef2f2',
                  border: `1px solid ${
                    parseFloat(formData.precio_venta) > parseFloat(formData.precio_compra) 
                      ? (((parseFloat(formData.precio_venta) - parseFloat(formData.precio_compra)) / parseFloat(formData.precio_compra)) * 100) >= 30 
                        ? '#a7f3d0' 
                        : '#fcd34d'
                      : '#fecaca'
                  }`,
                  borderRadius: '0.375rem',
                  padding: '1rem',
                  marginTop: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      fontSize: '1.25rem',
                      color: parseFloat(formData.precio_venta) > parseFloat(formData.precio_compra) 
                        ? (((parseFloat(formData.precio_venta) - parseFloat(formData.precio_compra)) / parseFloat(formData.precio_compra)) * 100) >= 30 
                          ? '#059669' 
                          : '#f59e0b'
                        : '#dc2626'
                    }}>
                      {parseFloat(formData.precio_venta) > parseFloat(formData.precio_compra) 
                        ? (((parseFloat(formData.precio_venta) - parseFloat(formData.precio_compra)) / parseFloat(formData.precio_compra)) * 100) >= 30 
                          ? '🎯' 
                          : '⚠️'
                        : '❌'
                      }
                    </div>
                    <strong style={{ color: '#374151' }}>Análisis de Margen:</strong>
                  </div>
                  
                  <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Ganancia por unidad:</strong> $
                      {(parseFloat(formData.precio_venta) - parseFloat(formData.precio_compra)).toLocaleString('es-CO')}
                    </div>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Margen de ganancia:</strong> {
                        parseFloat(formData.precio_compra) > 0 
                          ? (((parseFloat(formData.precio_venta) - parseFloat(formData.precio_compra)) / parseFloat(formData.precio_compra)) * 100).toFixed(1)
                          : '0'
                      }%
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontStyle: 'italic',
                      color: parseFloat(formData.precio_venta) > parseFloat(formData.precio_compra) 
                        ? (((parseFloat(formData.precio_venta) - parseFloat(formData.precio_compra)) / parseFloat(formData.precio_compra)) * 100) >= 30 
                          ? '#059669' 
                          : '#92400e'
                        : '#991b1b'
                    }}>
                      {parseFloat(formData.precio_venta) <= parseFloat(formData.precio_compra) 
                        ? 'El precio de venta debe ser mayor al precio de compra'
                        : (((parseFloat(formData.precio_venta) - parseFloat(formData.precio_compra)) / parseFloat(formData.precio_compra)) * 100) >= 30 
                          ? 'Excelente margen de ganancia'
                          : 'Margen bajo - considera aumentar el precio de venta'
                      }
                    </div>
                  </div>
                </div>
              )}
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
                className="btn btn-primary"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                    {mode === 'edit' ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {mode === 'edit' ? 'Actualizar Producto' : 'Crear Producto'}
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

export default ProductForm;