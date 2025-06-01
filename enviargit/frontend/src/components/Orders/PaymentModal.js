import React, { useState } from 'react';
import { X, Save, DollarSign, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { finanzasAPI } from '../../services/api';
import { useNotification } from '../Common/Notification';

const PaymentModal = ({ order, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    monto: '',
    metodo_pago: 'efectivo',
    concepto: 'Pago parcial',
    notas: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Hook de notificaciones
  const { showSuccess, showError, showWarning, NotificationComponent } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0';
    }

    if (parseFloat(formData.monto) > order.saldo_pendiente) {
      newErrors.monto = `El monto no puede ser mayor al saldo pendiente (${formatCurrency(order.saldo_pendiente)})`;
    }

    if (!formData.concepto.trim()) {
      newErrors.concepto = 'El concepto es requerido';
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
    
    try {
      const dataToSend = {
        pedido: order.id,
        monto: parseFloat(formData.monto),
        metodo_pago: formData.metodo_pago,
        concepto: formData.concepto,
        notas: formData.notas
      };

      await finanzasAPI.createPago(dataToSend);
      
      const newBalance = order.saldo_pendiente - parseFloat(formData.monto);
      const isFullyPaid = newBalance <= 0;
      
      showSuccess(
        '¡Pago registrado exitosamente!',
        isFullyPaid 
          ? `Pedido #${order.id} completamente pagado. Total recibido: ${formatCurrency(parseFloat(formData.monto))}`
          : `Pago de ${formatCurrency(parseFloat(formData.monto))} registrado. Saldo pendiente: ${formatCurrency(newBalance)}`,
        { duration: 6000 }
      );
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.error || 'Error registrando pago';
      showError('Error en el pago', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      efectivo: Banknote,
      transferencia: Smartphone,
      tarjeta: CreditCard
    };
    return icons[method] || Banknote;
  };

  const PaymentIcon = getPaymentMethodIcon(formData.metodo_pago);

  const calculateNewBalance = () => {
    const paymentAmount = parseFloat(formData.monto) || 0;
    return order.saldo_pendiente - paymentAmount;
  };

  const getConceptoSuggestion = () => {
    const newBalance = calculateNewBalance();
    if (newBalance <= 0) {
      return 'Pago final';
    } else if (order.adelanto_pagado === 0) {
      return 'Adelanto inicial';
    } else {
      return 'Pago parcial';
    }
  };

  // Actualizar concepto automáticamente basado en el monto
  React.useEffect(() => {
    if (formData.monto) {
      const suggestion = getConceptoSuggestion();
      setFormData(prev => ({
        ...prev,
        concepto: suggestion
      }));
    }
  }, [formData.monto]);

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
              <DollarSign size={24} color="#059669" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Registrar Pago
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

          {/* Información del pedido */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Pedido #{order.id} - {order.cliente_nombre}
            </h3>
            
            <div className="grid grid-cols-3" style={{ gap: '1rem', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {formatCurrency(order.precio_total)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Total
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#059669' }}>
                  {formatCurrency(order.adelanto_pagado)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Pagado
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#dc2626' }}>
                  {formatCurrency(order.saldo_pendiente)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Saldo
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ padding: '1.5rem' }}>
              {/* Monto */}
              <div className="form-group">
                <label className="form-label">Monto del Pago *</label>
                <input
                  type="number"
                  name="monto"
                  className="form-input"
                  value={formData.monto}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max={order.saldo_pendiente}
                  placeholder="0.00"
                  style={{ fontSize: '1.125rem', fontWeight: '500' }}
                />
                {errors.monto && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.monto}
                  </div>
                )}
                
                {/* Botones de monto rápido */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, monto: order.saldo_pendiente }))}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    Pago completo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, monto: (order.saldo_pendiente / 2).toFixed(0) }))}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    50%
                  </button>
                </div>
              </div>

              {/* Método de pago */}
              <div className="form-group">
                <label className="form-label">Método de Pago</label>
                <div style={{ position: 'relative' }}>
                  <select
                    name="metodo_pago"
                    className="form-input"
                    value={formData.metodo_pago}
                    onChange={handleChange}
                    style={{ paddingLeft: '2.5rem' }}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                  <PaymentIcon 
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
                </div>
              </div>

              {/* Concepto */}
              <div className="form-group">
                <label className="form-label">Concepto *</label>
                <input
                  type="text"
                  name="concepto"
                  className="form-input"
                  value={formData.concepto}
                  onChange={handleChange}
                  placeholder="Ej: Adelanto inicial, Pago parcial, Pago final"
                />
                {errors.concepto && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.concepto}
                  </div>
                )}
              </div>

              {/* Notas */}
              <div className="form-group">
                <label className="form-label">Notas (Opcional)</label>
                <textarea
                  name="notas"
                  className="form-input"
                  value={formData.notas}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Notas adicionales sobre el pago..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Vista previa del resultado */}
              {formData.monto && (
                <div style={{
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '0.375rem',
                  padding: '1rem',
                  marginTop: '1rem'
                }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#065f46', marginBottom: '0.5rem' }}>
                    Resumen del Pago
                  </h4>
                  <div style={{ fontSize: '0.875rem', color: '#059669' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Monto a registrar:</span>
                      <span style={{ fontWeight: '600' }}>{formatCurrency(parseFloat(formData.monto))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Total pagado (después):</span>
                      <span style={{ fontWeight: '600' }}>
                        {formatCurrency(order.adelanto_pagado + parseFloat(formData.monto))}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #a7f3d0', paddingTop: '0.25rem' }}>
                      <span>Nuevo saldo pendiente:</span>
                      <span style={{ fontWeight: '600' }}>
                        {formatCurrency(calculateNewBalance())}
                      </span>
                    </div>
                    
                    {calculateNewBalance() <= 0 && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: '#d1fae5',
                        borderRadius: '0.25rem',
                        textAlign: 'center',
                        fontWeight: '600'
                      }}>
                        🎉 ¡Pedido completamente pagado!
                      </div>
                    )}
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
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Registrar Pago
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

export default PaymentModal;