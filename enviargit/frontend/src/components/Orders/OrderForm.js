import React, { useState, useEffect } from 'react';
import { X, Save, ClipboardList, Calendar, DollarSign, User } from 'lucide-react';
import { pedidosAPI } from '../../services/api';
import { useNotification } from '../Common/Notification';

const OrderForm = ({ order, clients, mode, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    cliente: '',
    fecha_entrega_prometida: '',
    tipo_bordado: 'computarizado',
    descripcion: '',
    especificaciones: '',
    precio_total: '',
    adelanto_pagado: 0,
    notas_internas: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Hook de notificaciones
  const { showSuccess, showError, showWarning, NotificationComponent } = useNotification();

  useEffect(() => {
    if (mode === 'edit' && order) {
      const deliveryDate = new Date(order.fecha_entrega_prometida);
      const formattedDate = deliveryDate.toISOString().split('T')[0];
      
      setFormData({
        cliente: order.cliente || '',
        fecha_entrega_prometida: formattedDate,
        tipo_bordado: order.tipo_bordado || 'computarizado',
        descripcion: order.descripcion || '',
        especificaciones: order.especificaciones || '',
        precio_total: order.precio_total || '',
        adelanto_pagado: order.adelanto_pagado || 0,
        notas_internas: order.notas_internas || ''
      });
    } else {
      // Para nuevos pedidos, establecer fecha mínima a mañana
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        fecha_entrega_prometida: tomorrowFormatted
      }));
    }
  }, [order, mode]);

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

    if (!formData.cliente) {
      newErrors.cliente = 'El cliente es requerido';
    }

    if (!formData.fecha_entrega_prometida) {
      newErrors.fecha_entrega_prometida = 'La fecha de entrega es requerida';
    } else {
      const deliveryDate = new Date(formData.fecha_entrega_prometida);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate <= today) {
        newErrors.fecha_entrega_prometida = 'La fecha de entrega debe ser posterior a hoy';
      }
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }

    if (!formData.precio_total || parseFloat(formData.precio_total) <= 0) {
      newErrors.precio_total = 'El precio total debe ser mayor a 0';
    }

    if (formData.adelanto_pagado < 0) {
      newErrors.adelanto_pagado = 'El adelanto no puede ser negativo';
    }

    if (parseFloat(formData.adelanto_pagado) > parseFloat(formData.precio_total)) {
      newErrors.adelanto_pagado = 'El adelanto no puede ser mayor al precio total';
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
        ...formData,
        precio_total: parseFloat(formData.precio_total),
        adelanto_pagado: parseFloat(formData.adelanto_pagado)
      };

      if (mode === 'edit') {
        await pedidosAPI.updatePedido(order.id, dataToSend);
        showSuccess(
          '¡Pedido actualizado!',
          `El pedido #${order.id} ha sido actualizado exitosamente`,
          { duration: 5000 }
        );
      } else {
        const response = await pedidosAPI.createPedido(dataToSend);
        const newOrderId = response.data.id;
        showSuccess(
          '¡Pedido creado!',
          `Pedido #${newOrderId} creado exitosamente para ${clients.find(c => c.id == formData.cliente)?.nombre || 'el cliente'}`,
          { duration: 6000 }
        );
      }
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.error || 
                          `Error ${mode === 'edit' ? 'actualizando' : 'creando'} pedido`;
      showError('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const selectedClient = clients.find(c => c.id == formData.cliente);
  const discountAmount = selectedClient?.descuento_especial > 0 
    ? (parseFloat(formData.precio_total) * selectedClient.descuento_especial / 100) 
    : 0;
  const finalPrice = parseFloat(formData.precio_total) - discountAmount;

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
          maxWidth: '800px',
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
              <ClipboardList size={24} color="#2563eb" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {mode === 'edit' ? `Editar Pedido #${order?.id}` : 'Nuevo Pedido'}
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
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} />
                  Información del Cliente
                </h3>
                
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  {/* Cliente */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Cliente *</label>
                    <select
                      name="cliente"
                      className="form-input"
                      value={formData.cliente}
                      onChange={handleChange}
                      disabled={mode === 'edit'} // No permitir cambiar cliente en edición
                    >
                      <option value="">Seleccionar cliente</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.nombre} - {client.telefono}
                          {client.descuento_especial > 0 && ` (${client.descuento_especial}% desc.)`}
                        </option>
                      ))}
                    </select>
                    {errors.cliente && (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.cliente}
                      </div>
                    )}
                    
                    {/* Información del cliente seleccionado */}
                    {selectedClient && (
                      <div style={{
                        backgroundColor: '#f3f4f6',
                        padding: '0.75rem',
                        borderRadius: '0.375rem',
                        marginTop: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {selectedClient.nombre}
                        </div>
                        <div style={{ color: '#6b7280' }}>
                          {selectedClient.telefono} • Tipo: {selectedClient.tipo_cliente}
                          {selectedClient.descuento_especial > 0 && (
                            <span style={{ color: '#059669', fontWeight: '500' }}>
                              {' '}• Descuento: {selectedClient.descuento_especial}%
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Información del pedido */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ClipboardList size={18} />
                  Detalles del Pedido
                </h3>
                
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  {/* Fecha de entrega */}
                  <div className="form-group">
                    <label className="form-label">Fecha de Entrega Prometida *</label>
                    <input
                      type="date"
                      name="fecha_entrega_prometida"
                      className="form-input"
                      value={formData.fecha_entrega_prometida}
                      onChange={handleChange}
                      min={getMinDate()}
                    />
                    {errors.fecha_entrega_prometida && (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.fecha_entrega_prometida}
                      </div>
                    )}
                  </div>

                  {/* Tipo de bordado */}
                  <div className="form-group">
                    <label className="form-label">Tipo de Bordado</label>
                    <select
                      name="tipo_bordado"
                      className="form-input"
                      value={formData.tipo_bordado}
                      onChange={handleChange}
                    >
                      <option value="computarizado">Computarizado</option>
                      <option value="manual">Manual</option>
                      <option value="combinado">Combinado</option>
                    </select>
                  </div>

                  {/* Descripción */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Descripción del Trabajo *</label>
                    <textarea
                      name="descripcion"
                      className="form-input"
                      value={formData.descripcion}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Describe qué tipo de bordado se realizará..."
                      style={{ resize: 'vertical' }}
                    />
                    {errors.descripcion && (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.descripcion}
                      </div>
                    )}
                  </div>

                  {/* Especificaciones */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Especificaciones Técnicas</label>
                    <textarea
                      name="especificaciones"
                      className="form-input"
                      value={formData.especificaciones}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Detalles técnicos: tamaño, colores, ubicación, materiales, etc."
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>

              {/* Información financiera */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DollarSign size={18} />
                  Información Financiera
                </h3>
                
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  {/* Precio total */}
                  <div className="form-group">
                    <label className="form-label">Precio Total *</label>
                    <input
                      type="number"
                      name="precio_total"
                      className="form-input"
                      value={formData.precio_total}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                    {errors.precio_total && (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.precio_total}
                      </div>
                    )}
                  </div>

                  {/* Adelanto */}
                  <div className="form-group">
                    <label className="form-label">Adelanto (Opcional)</label>
                    <input
                      type="number"
                      name="adelanto_pagado"
                      className="form-input"
                      value={formData.adelanto_pagado}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                    {errors.adelanto_pagado && (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.adelanto_pagado}
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumen financiero */}
                {formData.precio_total && selectedClient && (
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '1rem',
                    borderRadius: '0.375rem',
                    marginTop: '1rem'
                  }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      Resumen Financiero
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span>Precio base:</span>
                        <span>${parseFloat(formData.precio_total || 0).toLocaleString('es-CO')}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#059669' }}>
                          <span>Descuento ({selectedClient.descuento_especial}%):</span>
                          <span>-${discountAmount.toLocaleString('es-CO')}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', borderTop: '1px solid #e5e7eb', paddingTop: '0.25rem' }}>
                        <span>Total a pagar:</span>
                        <span>${finalPrice.toLocaleString('es-CO')}</span>
                      </div>
                      {formData.adelanto_pagado > 0 && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', color: '#059669' }}>
                            <span>Adelanto:</span>
                            <span>${parseFloat(formData.adelanto_pagado).toLocaleString('es-CO')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: '600' }}>
                            <span>Saldo pendiente:</span>
                            <span>${(finalPrice - parseFloat(formData.adelanto_pagado)).toLocaleString('es-CO')}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notas internas */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                  Notas Internas
                </h3>
                
                <div className="form-group">
                  <label className="form-label">Notas para el equipo de trabajo</label>
                  <textarea
                    name="notas_internas"
                    className="form-input"
                    value={formData.notas_internas}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Notas internas, observaciones, recordatorios..."
                    style={{ resize: 'vertical' }}
                  />
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
                    {mode === 'edit' ? 'Actualizar Pedido' : 'Crear Pedido'}
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

export default OrderForm;