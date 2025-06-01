import React, { useState, useEffect } from 'react';
import { X, Save, Users, Building, Star, User } from 'lucide-react';
import { clientesAPI } from '../../services/api';

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
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
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
      return;
    }

    setLoading(true);
    
    try {
      const dataToSend = {
        ...formData,
        descuento_especial: parseFloat(formData.descuento_especial)
      };

      if (mode === 'edit') {
        await clientesAPI.updateCliente(client.id, dataToSend);
        alert('Cliente actualizado exitosamente');
      } else {
        await clientesAPI.createCliente(dataToSend);
        alert('Cliente creado exitosamente');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert(`Error ${mode === 'edit' ? 'actualizando' : 'creando'} cliente`);
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
              {mode === 'edit' ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                    placeholder="Ej: Calle 15 #23-45, Armenia"
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
                    <strong>Vista previa:</strong> Si el pedido es de $100,000, 
                    el cliente pagará ${(100000 * (1 - formData.descuento_especial / 100)).toLocaleString('es-CO')} 
                    (ahorro de ${(100000 * formData.descuento_especial / 100).toLocaleString('es-CO')})
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
                    />
                    <span className="form-label" style={{ margin: 0 }}>Cliente activo</span>
                  </label>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Los clientes inactivos no aparecerán en las listas de selección
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
                    placeholder="Notas adicionales sobre el cliente, preferencias, etc."
                    style={{ resize: 'vertical' }}
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
                  {mode === 'edit' ? 'Actualizar Cliente' : 'Crear Cliente'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;