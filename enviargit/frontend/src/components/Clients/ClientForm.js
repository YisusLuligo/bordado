import React, { useState, useEffect } from 'react';
import { X, Save, Users, Building, Star, User } from 'lucide-react';
import { clientesAPI } from '../../services/api';
import { useNotification } from '../Common/Notification';

const ClientForm = ({ client, mode, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    tipo_cliente: 'particular',
    descuento_especial: 0,
    activo: true,
    notas: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ⭐ Hook de notificaciones
  const { showSuccess, showError, showWarning, NotificationComponent } = useNotification();

  useEffect(() => {
    if (mode === 'edit' && client) {
      setFormData({
        nombre: client.nombre || '',
        telefono: client.telefono || '',
        email: client.email || '',
        direccion: client.direccion || '',
        tipo_cliente: client.tipo_cliente || 'particular',
        descuento_especial: client.descuento_especial || 0,
        activo: client.activo !== undefined ? client.activo : true,
        notas: client.notas || ''
      });
    }
  }, [client, mode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (formData.telefono.trim().length < 7) {
      newErrors.telefono = 'El teléfono debe tener al menos 7 dígitos';
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'El email no tiene un formato válido';
    }

    if (formData.descuento_especial < 0 || formData.descuento_especial > 100) {
      newErrors.descuento_especial = 'El descuento debe estar entre 0 y 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showWarning(
        'Formulario incompleto',
        'Por favor corrige los errores marcados en rojo antes de continuar',
        { duration: 4000 }
      );
      return;
    }

    setLoading(true);
    
    try {
      const dataToSend = {
        ...formData,
        descuento_especial: parseFloat(formData.descuento_especial),
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim()
      };

      if (mode === 'edit') {
        const response = await clientesAPI.updateCliente(client.id, dataToSend);
        
        // ⭐ MEJORADO: Mensaje más específico y detallado
        const descuentoText = formData.descuento_especial > 0 
          ? ` Descuento aplicado: ${formData.descuento_especial}%` 
          : '';
        const estadoText = formData.activo ? '' : ' (Cliente marcado como inactivo)';
        
        showSuccess(
          '¡Cliente actualizado exitosamente!',
          `Los datos de ${formData.nombre} han sido actualizados correctamente.${descuentoText}${estadoText}`,
          { duration: 5000 }
        );
      } else {
        const response = await clientesAPI.createCliente(dataToSend);
        
        // ⭐ MEJORADO: Mensaje más específico con siguiente paso
        const descuentoText = formData.descuento_especial > 0 
          ? ` con ${formData.descuento_especial}% de descuento automático` 
          : '';
        
        showSuccess(
          '¡Cliente creado exitosamente!',
          `${formData.nombre} ha sido agregado al sistema${descuentoText}. Ya puedes crear pedidos para este cliente.`,
          { duration: 6000 }
        );
      }
      
      // ⭐ NUEVO: Cerrar modal después de mostrar notificación
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (error) {
      console.error('Error:', error);
      
      // ⭐ MEJORADO: Manejo de errores más específico y detallado
      let errorMessage = `Error ${mode === 'edit' ? 'actualizando' : 'creando'} cliente`;
      let errorTitle = mode === 'edit' ? 'Error al actualizar cliente' : 'Error al crear cliente';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data) {
        // Manejar errores de validación específicos del backend
        const errorData = error.response.data;
        if (errorData.nombre && errorData.nombre[0]) {
          errorMessage = `Problema con el nombre: ${errorData.nombre[0]}`;
        } else if (errorData.telefono && errorData.telefono[0]) {
          errorMessage = `Problema con el teléfono: ${errorData.telefono[0]}`;
        } else if (errorData.email && errorData.email[0]) {
          errorMessage = `Problema con el email: ${errorData.email[0]}`;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.response?.status === 400) {
        errorMessage = 'Los datos enviados no son válidos. Revisa la información e inténtalo de nuevo.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Ya existe un cliente con estos datos (teléfono o email duplicado).';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Error del servidor. Por favor inténtalo más tarde.';
        errorTitle = 'Error del servidor';
      } else if (!error.response) {
        errorMessage = 'Error de conexión. Verifica tu internet e inténtalo de nuevo.';
        errorTitle = 'Sin conexión';
      }
      
      showError(
        errorTitle,
        errorMessage,
        { duration: 7000 }
      );
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      particular: User,
      empresa: Building,
      mayorista: Star
    };
    return icons[type] || User;
  };

  const TypeIcon = getTypeIcon(formData.tipo_cliente);

  return (
    <>
      {/* ⭐ Componente de notificaciones */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={24} color="#2563eb" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {mode === 'edit' ? `Editar Cliente: ${client?.nombre}` : 'Nuevo Cliente'}
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
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ padding: '1.5rem' }}>
              {/* Información básica */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                  Información Básica
                </h3>
                
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  {/* Nombre */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      className="form-input"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Ej: María García López o Textiles La Esperanza SAS"
                      disabled={loading}
                      style={{
                        borderColor: errors.nombre ? '#dc2626' : undefined
                      }}
                    />
                    {errors.nombre && (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.nombre}
                      </div>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div className="form-group">
                    <label className="form-label">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      className="form-input"
                      value={formData.telefono}
                      onChange={handleChange}
                      placeholder="Ej: 300-555-0123"
                      disabled={loading}
                      style={{
                        borderColor: errors.telefono ? '#dc2626' : undefined
                      }}
                    />
                    {errors.telefono && (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.telefono}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Ej: cliente@email.com"
                      disabled={loading}
                      style={{
                        borderColor: errors.email ? '#dc2626' : undefined
                      }}
                    />
                    {errors.email && (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.email}
                      </div>
                    )}
                  </div>

                  {/* Dirección */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">
                      Dirección
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      className="form-input"
                      value={formData.direccion}
                      onChange={handleChange}
                      placeholder="Ej: Calle 15 #23-45, Armenia, Quindío"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Información comercial */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                  Información Comercial
                </h3>
                
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  {/* Tipo de cliente */}
                  <div className="form-group">
                    <label className="form-label">
                      Tipo de Cliente
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        name="tipo_cliente"
                        className="form-input"
                        value={formData.tipo_cliente}
                        onChange={handleChange}
                        style={{ paddingLeft: '2.5rem' }}
                        disabled={loading}
                      >
                        <option value="particular">Particular</option>
                        <option value="empresa">Empresa</option>
                        <option value="mayorista">Mayorista</option>
                      </select>
                      <TypeIcon 
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
                    
                    {/* Descripción del tipo */}
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      {formData.tipo_cliente === 'particular' && 'Cliente individual sin descuentos especiales'}
                      {formData.tipo_cliente === 'empresa' && 'Empresa con posibles descuentos corporativos'}
                      {formData.tipo_cliente === 'mayorista' && 'Cliente mayorista con descuentos por volumen'}
                    </div>
                  </div>

                  {/* Descuento especial */}
                  <div className="form-group">
                    <label className="form-label">
                      Descuento Especial (%)
                    </label>
                    <input
                      type="number"
                      name="descuento_especial"
                      className="form-input"
                      value={formData.descuento_especial}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0.00"
                      disabled={loading}
                      style={{
                        borderColor: errors.descuento_especial ? '#dc2626' : undefined
                      }}
                    />
                    {errors.descuento_especial && (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.descuento_especial}
                      </div>
                    )}
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Descuento que se aplicará automáticamente a sus pedidos
                    </div>
                  </div>
                </div>

                {/* Vista previa del descuento */}
                {formData.descuento_especial > 0 && (
                  <div style={{
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '0.375rem',
                    padding: '0.75rem',
                    marginTop: '1rem'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: '#059669' }}>
                      <strong>💰 Vista previa del descuento:</strong><br />
                      Si el pedido es de $100,000, el cliente pagará{' '}
                      <strong>${(100000 * (1 - formData.descuento_especial / 100)).toLocaleString('es-CO')}</strong>
                      {' '}(ahorro de ${(100000 * formData.descuento_especial / 100).toLocaleString('es-CO')})
                    </div>
                  </div>
                )}
              </div>

              {/* Información adicional */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                  Información Adicional
                </h3>
                
                <div>
                  {/* Estado activo */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="activo"
                        checked={formData.activo}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <span className="form-label" style={{ margin: 0 }}>Cliente activo</span>
                    </label>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Los clientes inactivos no aparecerán en las listas de selección para nuevos pedidos
                    </div>
                  </div>

                  {/* Notas */}
                  <div className="form-group">
                    <label className="form-label">
                      Notas
                    </label>
                    <textarea
                      name="notas"
                      className="form-input"
                      value={formData.notas}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Notas adicionales sobre el cliente, preferencias, observaciones especiales..."
                      style={{ resize: 'vertical' }}
                      disabled={loading}
                    />
                  </div>
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
                disabled={loading || !formData.nombre.trim() || !formData.telefono.trim()}
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
                    {mode === 'edit' ? 'Actualizar Cliente' : 'Crear Cliente'}
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

export default ClientForm;