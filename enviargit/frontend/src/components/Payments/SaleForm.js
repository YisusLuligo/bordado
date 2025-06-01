import React, { useState, useEffect } from 'react';
import { X, Save, ShoppingCart, Plus, Trash2, Calculator, AlertTriangle } from 'lucide-react';
import { finanzasAPI } from '../../services/api';
import { useNotification } from '../Common/Notification';

const SaleForm = ({ clients, products, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    cliente: '',
    metodo_pago: 'efectivo',
    notas: ''
  });
  
  const [saleItems, setSaleItems] = useState([
    { producto: '', cantidad: 1, precio_unitario: 0 }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [validatingStock, setValidatingStock] = useState(false);

  // Hook de notificaciones
  const { showSuccess, showError, showWarning, NotificationComponent } = useNotification();

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...saleItems];
    
    // Para cantidad, solo permitir números enteros
    if (field === 'cantidad') {
      const intValue = parseInt(value) || 1;
      newItems[index] = { ...newItems[index], [field]: intValue };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    // Si cambia el producto, actualizar precio automáticamente
    if (field === 'producto') {
      const selectedProduct = products.find(p => p.id == value);
      if (selectedProduct) {
        newItems[index].precio_unitario = selectedProduct.precio_venta;
      }
    }
    
    setSaleItems(newItems);
    
    // Limpiar errores relacionados
    if (errors[`item_${index}_${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`item_${index}_${field}`]: ''
      }));
    }
  };

  const addItem = () => {
    setSaleItems([...saleItems, { producto: '', cantidad: 1, precio_unitario: 0 }]);
  };

  const removeItem = (index) => {
    if (saleItems.length > 1) {
      setSaleItems(saleItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = saleItems.reduce((sum, item) => {
      return sum + (parseInt(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0);
    }, 0);
    
    const selectedClient = clients.find(c => c.id == formData.cliente);
    const descuentoPorcentaje = selectedClient?.descuento_especial || 0;
    const descuento = subtotal * (descuentoPorcentaje / 100);
    const total = subtotal - descuento;
    
    return { subtotal, descuento, total, descuentoPorcentaje };
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validar que hay al menos un producto
    const validItems = saleItems.filter(item => 
      item.producto && 
      parseInt(item.cantidad) > 0 && 
      parseFloat(item.precio_unitario) > 0
    );
    
    if (validItems.length === 0) {
      newErrors.items = 'Debe agregar al menos un producto válido';
    }
    
    // Validar stock disponible
    for (let i = 0; i < saleItems.length; i++) {
      const item = saleItems[i];
      if (item.producto) {
        const product = products.find(p => p.id == item.producto);
        if (product && parseInt(item.cantidad) > Math.floor(product.cantidad_actual)) {
          newErrors[`item_${i}_cantidad`] = `Stock insuficiente. Disponible: ${Math.floor(product.cantidad_actual)}`;
        }
        
        if (!item.cantidad || parseInt(item.cantidad) <= 0) {
          newErrors[`item_${i}_cantidad`] = 'La cantidad debe ser mayor a 0';
        }
        
        if (!item.precio_unitario || parseFloat(item.precio_unitario) <= 0) {
          newErrors[`item_${i}_precio`] = 'El precio debe ser mayor a 0';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showWarning('Formulario incompleto', 'Por favor corrige los errores antes de continuar');
      return;
    }

    setLoading(true);
    setValidatingStock(true);
    
    try {
      const totals = calculateTotals();
      const validItems = saleItems.filter(item => 
        item.producto && 
        parseInt(item.cantidad) > 0 && 
        parseFloat(item.precio_unitario) > 0
      );
      
      // Preparar datos para enviar
      const saleData = {
        cliente: formData.cliente || null,
        subtotal: totals.subtotal.toFixed(2),
        descuento: totals.descuento.toFixed(2),
        total: totals.total.toFixed(2),
        metodo_pago: formData.metodo_pago,
        pagado: true,
        notas: formData.notas,
        detalles: validItems.map(item => ({
          producto: parseInt(item.producto),
          cantidad: parseInt(item.cantidad), // Solo números enteros
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal: (parseInt(item.cantidad) * parseFloat(item.precio_unitario)).toFixed(2)
        }))
      };

      const response = await finanzasAPI.createVenta(saleData);
      
      if (response.status === 201) {
        showSuccess(
          '¡Venta registrada!', 
          `Venta por ${formatCurrency(totals.total)} registrada exitosamente. El stock se actualizó automáticamente.`,
          { duration: 5000 }
        );
        
        // Cerrar modal después de un breve delay para que se vea la notificación
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error completo:', error);
      
      let errorMessage = 'Error registrando la venta';
      
      if (error.response?.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }
      
      showError('Error en la venta', errorMessage);
    } finally {
      setLoading(false);
      setValidatingStock(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getAvailableStock = (product) => {
    return Math.floor(product.cantidad_actual);
  };

  const totals = calculateTotals();

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
          maxWidth: '900px',
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
              <ShoppingCart size={24} color="#059669" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Nueva Venta Directa
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
              {/* Información del cliente */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                  Información del Cliente
                </h3>
                
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Cliente (Opcional)</label>
                    <select
                      name="cliente"
                      className="form-input"
                      value={formData.cliente}
                      onChange={handleFormChange}
                    >
                      <option value="">Cliente general</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.nombre}
                          {client.descuento_especial > 0 && ` (${client.descuento_especial}% desc.)`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Método de Pago</label>
                    <select
                      name="metodo_pago"
                      className="form-input"
                      value={formData.metodo_pago}
                      onChange={handleFormChange}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                    Productos a Vender
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Plus size={16} />
                    Agregar Producto
                  </button>
                </div>

                {errors.items && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#fef2f2',
                    borderRadius: '0.375rem',
                    border: '1px solid #fecaca'
                  }}>
                    <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    {errors.items}
                  </div>
                )}

                {saleItems.map((item, index) => {
                  const selectedProduct = products.find(p => p.id == item.producto);
                  const availableStock = selectedProduct ? getAvailableStock(selectedProduct) : 0;
                  
                  return (
                    <div key={index} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      padding: '1rem',
                      marginBottom: '1rem',
                      backgroundColor: selectedProduct && availableStock <= 0 ? '#fef2f2' : 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: '500', color: '#1f2937' }}>
                          Producto {index + 1}
                        </span>
                        {saleItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#dc2626',
                              padding: '0.25rem'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-4" style={{ gap: '1rem' }}>
                        {/* Producto */}
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label">Producto</label>
                          <select
                            className="form-input"
                            value={item.producto}
                            onChange={(e) => handleItemChange(index, 'producto', e.target.value)}
                          >
                            <option value="">Seleccionar producto</option>
                            {products.map(product => {
                              const stock = getAvailableStock(product);
                              return (
                                <option 
                                  key={product.id} 
                                  value={product.id}
                                  disabled={stock <= 0}
                                >
                                  {product.nombre} - Stock: {stock} - {formatCurrency(product.precio_venta)}
                                  {stock <= 0 && ' (SIN STOCK)'}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Cantidad */}
                        <div className="form-group">
                          <label className="form-label">Cantidad</label>
                          <input
                            type="number"
                            className="form-input"
                            value={item.cantidad}
                            onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                            min="1"
                            step="1"
                            max={selectedProduct ? getAvailableStock(selectedProduct) : 999999}
                          />
                          {errors[`item_${index}_cantidad`] && (
                            <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                              {errors[`item_${index}_cantidad`]}
                            </div>
                          )}
                        </div>

                        {/* Precio unitario */}
                        <div className="form-group">
                          <label className="form-label">Precio Unit.</label>
                          <input
                            type="number"
                            className="form-input"
                            value={item.precio_unitario}
                            onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)}
                            min="0.01"
                            step="0.01"
                          />
                          {errors[`item_${index}_precio`] && (
                            <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                              {errors[`item_${index}_precio`]}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stock warning */}
                      {selectedProduct && availableStock <= 0 && (
                        <div style={{
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          marginTop: '1rem',
                          color: '#dc2626'
                        }}>
                          <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                          ⚠️ Este producto no tiene stock disponible
                        </div>
                      )}

                      {/* Subtotal del item */}
                      {item.producto && item.cantidad && item.precio_unitario && (
                        <div style={{
                          backgroundColor: '#f9fafb',
                          padding: '0.5rem',
                          borderRadius: '0.25rem',
                          marginTop: '1rem',
                          textAlign: 'right'
                        }}>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Subtotal: </span>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>
                            {formatCurrency(parseInt(item.cantidad) * parseFloat(item.precio_unitario))}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Notas */}
              <div style={{ marginBottom: '2rem' }}>
                <div className="form-group">
                  <label className="form-label">Notas (Opcional)</label>
                  <textarea
                    name="notas"
                    className="form-input"
                    value={formData.notas}
                    onChange={handleFormChange}
                    rows="3"
                    placeholder="Notas adicionales sobre la venta..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Resumen de totales */}
              {totals.total > 0 && (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '0.5rem',
                  padding: '1.5rem'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calculator size={18} />
                    Resumen de la Venta
                  </h4>
                  
                  <div style={{ fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Subtotal:</span>
                      <span style={{ fontWeight: '600' }}>{formatCurrency(totals.subtotal)}</span>
                    </div>
                    
                    {totals.descuento > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#dc2626' }}>
                        <span>Descuento ({totals.descuentoPorcentaje}%):</span>
                        <span style={{ fontWeight: '600' }}>-{formatCurrency(totals.descuento)}</span>
                      </div>
                    )}
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      borderTop: '1px solid #bae6fd',
                      paddingTop: '0.5rem',
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      color: '#1f2937'
                    }}>
                      <span>Total a Cobrar:</span>
                      <span>{formatCurrency(totals.total)}</span>
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
                className="btn btn-success"
                disabled={loading || totals.total <= 0 || validatingStock}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                    {validatingStock ? 'Validando stock...' : 'Registrando Venta...'}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Registrar Venta
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

export default SaleForm;