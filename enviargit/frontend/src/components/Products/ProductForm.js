import React, { useState, useEffect } from 'react';
import { X, Save, Package } from 'lucide-react';
import { inventarioAPI } from '../../services/api';

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

  useEffect(() => {
    if (mode === 'edit' && product) {
      setFormData({
        nombre: product.nombre || '',
        categoria: product.categoria || '',
        marca: product.marca || '',
        color: product.color || '',
        cantidad_actual: product.cantidad_actual || 0,
        stock_minimo: product.stock_minimo || 5,
        precio_compra: product.precio_compra || '',
        precio_venta: product.precio_venta || '',
        proveedor: product.proveedor || ''
      });
    }
  }, [product, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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

    if (!formData.precio_compra || parseFloat(formData.precio_compra) <= 0) {
      newErrors.precio_compra = 'El precio de compra debe ser mayor a 0';
    }

    if (!formData.precio_venta || parseFloat(formData.precio_venta) <= 0) {
      newErrors.precio_venta = 'El precio de venta debe ser mayor a 0';
    }

    if (parseFloat(formData.precio_venta) <= parseFloat(formData.precio_compra)) {
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
      return;
    }

    setLoading(true);
    
    try {
      const dataToSend = {
        ...formData,
        precio_compra: parseFloat(formData.precio_compra),
        precio_venta: parseFloat(formData.precio_venta),
        cantidad_actual: parseInt(formData.cantidad_actual),
        stock_minimo: parseInt(formData.stock_minimo)
      };

      if (mode === 'edit') {
        await inventarioAPI.updateProducto(product.id, dataToSend);
        alert('Producto actualizado exitosamente');
      } else {
        await inventarioAPI.createProducto(dataToSend);
        alert('Producto creado exitosamente');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert(`Error ${mode === 'edit' ? 'actualizando' : 'creando'} producto`);
    } finally {
      setLoading(false);
    }
  };

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
                  Cantidad Actual
                </label>
                <input
                  type="number"
                  name="cantidad_actual"
                  className="form-input"
                  value={formData.cantidad_actual}
                  onChange={handleChange}
                  min="0"
                />
                {errors.cantidad_actual && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.cantidad_actual}
                  </div>
                )}
              </div>

              {/* Stock mínimo */}
              <div className="form-group">
                <label className="form-label">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  name="stock_minimo"
                  className="form-input"
                  value={formData.stock_minimo}
                  onChange={handleChange}
                  min="0"
                />
                {errors.stock_minimo && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.stock_minimo}
                  </div>
                )}
              </div>

              {/* Precio de compra */}
              <div className="form-group">
                <label className="form-label">
                  Precio de Compra *
                </label>
                <input
                  type="number"
                  name="precio_compra"
                  className="form-input"
                  value={formData.precio_compra}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
                {errors.precio_compra && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.precio_compra}
                  </div>
                )}
              </div>

              {/* Precio de venta */}
              <div className="form-group">
                <label className="form-label">
                  Precio de Venta *
                </label>
                <input
                  type="number"
                  name="precio_venta"
                  className="form-input"
                  value={formData.precio_venta}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
                {errors.precio_venta && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.precio_venta}
                  </div>
                )}
              </div>
            </div>

            {/* Cálculo de margen */}
            {formData.precio_compra && formData.precio_venta && (
              <div style={{
                backgroundColor: '#f3f4f6',
                padding: '1rem',
                borderRadius: '0.375rem',
                marginTop: '1rem'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  <strong>Margen de ganancia:</strong> $
                  {(parseFloat(formData.precio_venta) - parseFloat(formData.precio_compra)).toLocaleString('es-CO')} 
                  ({(((parseFloat(formData.precio_venta) - parseFloat(formData.precio_compra)) / parseFloat(formData.precio_compra)) * 100).toFixed(1)}%)
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
            borderTop: '1px solid #e5e7eb'
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
  );
};

export default ProductForm;