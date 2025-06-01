import React, { useState } from 'react';
import { 
  X, 
  Edit3, 
  DollarSign, 
  User, 
  Calendar, 
  Clock, 
  Package, 
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';
import { pedidosAPI } from '../../services/api';

const OrderDetail = ({ order, onClose, onEdit, onAddPayment, onReload }) => {
  const [changingState, setChangingState] = useState(false);
  const [newState, setNewState] = useState('');

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

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStateInfo = (estado) => {
    const states = {
      recibido: { 
        label: 'Recibido', 
        color: '#2563eb', 
        bgColor: '#dbeafe',
        icon: Package,
        description: 'Pedido recibido y registrado'
      },
      en_diseno: { 
        label: 'En Diseño', 
        color: '#f59e0b', 
        bgColor: '#fffbeb',
        icon: Edit3,
        description: 'Diseñando el bordado'
      },
      aprobado: { 
        label: 'Aprobado', 
        color: '#059669', 
        bgColor: '#ecfdf5',
        icon: CheckCircle,
        description: 'Diseño aprobado por el cliente'
      },
      en_proceso: { 
        label: 'En Proceso', 
        color: '#dc2626', 
        bgColor: '#fef2f2',
        icon: Clock,
        description: 'Bordado en proceso de elaboración'
      },
      terminado: { 
        label: 'Terminado', 
        color: '#7c3aed', 
        bgColor: '#ede9fe',
        icon: CheckCircle,
        description: 'Bordado terminado, listo para entrega'
      },
      entregado: { 
        label: 'Entregado', 
        color: '#059669', 
        bgColor: '#dcfce7',
        icon: CheckCircle,
        description: 'Pedido entregado al cliente'
      },
      cancelado: { 
        label: 'Cancelado', 
        color: '#6b7280', 
        bgColor: '#f3f4f6',
        icon: X,
        description: 'Pedido cancelado'
      }
    };
    return states[estado] || states.recibido;
  };

  const getNextStates = (currentState) => {
    const stateFlow = {
      recibido: ['en_diseno', 'cancelado'],
      en_diseno: ['aprobado', 'recibido', 'cancelado'],
      aprobado: ['en_proceso', 'en_diseno', 'cancelado'],
      en_proceso: ['terminado', 'aprobado'],
      terminado: ['entregado', 'en_proceso'],
      entregado: [], // Estado final
      cancelado: ['recibido'] // Permitir reactivar
    };
    return stateFlow[currentState] || [];
  };

  const handleStateChange = async () => {
    if (!newState) return;
    
    setChangingState(true);
    try {
      await pedidosAPI.cambiarEstado(order.id, { estado: newState });
      alert('Estado cambiado exitosamente');
      onReload();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error cambiando estado');
    } finally {
      setChangingState(false);
    }
  };

  const isOrderOverdue = () => {
    const today = new Date();
    const deliveryDate = new Date(order.fecha_entrega_prometida);
    return deliveryDate < today && !['entregado', 'cancelado'].includes(order.estado);
  };

  const currentStateInfo = getStateInfo(order.estado);
  const CurrentStateIcon = currentStateInfo.icon;
  const nextStates = getNextStates(order.estado);
  const overdue = isOrderOverdue();

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
        maxWidth: '1000px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CurrentStateIcon size={28} color={currentStateInfo.color} />
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Pedido #{order.id}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{
                  backgroundColor: currentStateInfo.bgColor,
                  color: currentStateInfo.color,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {currentStateInfo.label}
                </span>
                {overdue && (
                  <span style={{
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    VENCIDO
                  </span>
                )}
                {order.saldo_pendiente > 0 && (
                  <span style={{
                    backgroundColor: '#fffbeb',
                    color: '#f59e0b',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    SALDO PENDIENTE
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onEdit(order)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Edit3 size={16} />
              Editar
            </button>
            {order.saldo_pendiente > 0 && (
              <button
                onClick={() => onAddPayment(order)}
                className="btn btn-success"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <DollarSign size={16} />
                Registrar Pago
              </button>
            )}
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
          <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
            {/* Información del cliente */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={20} />
                Información del Cliente
              </h3>
              
              {order.cliente_info ? (
                <div style={{ space: '1rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                      {order.cliente_info.nombre}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'capitalize' }}>
                      {order.cliente_info.tipo_cliente}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Phone size={16} color="#6b7280" />
                    <span style={{ color: '#374151', fontSize: '0.875rem' }}>
                      {order.cliente_info.telefono}
                    </span>
                  </div>

                  {order.cliente_info.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Mail size={16} color="#6b7280" />
                      <span style={{ color: '#374151', fontSize: '0.875rem' }}>
                        {order.cliente_info.email}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#6b7280' }}>
                  Información del cliente no disponible
                </div>
              )}
            </div>

            {/* Fechas importantes */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} />
                Fechas Importantes
              </h3>
              
              <div style={{ space: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Fecha del Pedido
                  </div>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>
                    {formatDateTime(order.fecha_pedido)}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Fecha de Entrega Prometida
                  </div>
                  <div style={{ 
                    fontWeight: '500', 
                    color: overdue ? '#dc2626' : '#1f2937'
                  }}>
                    {formatDate(order.fecha_entrega_prometida)}
                    {overdue && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', marginLeft: '0.5rem' }}>
                        (VENCIDO)
                      </span>
                    )}
                  </div>
                </div>

                {order.fecha_entrega_real && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Fecha de Entrega Real
                    </div>
                    <div style={{ fontWeight: '500', color: '#059669' }}>
                      {formatDateTime(order.fecha_entrega_real)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detalles del pedido */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} />
              Detalles del Trabajo
            </h3>
            
            <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    Tipo de Bordado
                  </div>
                  <div style={{
                    backgroundColor: '#f3f4f6',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    textTransform: 'capitalize',
                    fontWeight: '500'
                  }}>
                    {order.tipo_bordado_display || order.tipo_bordado}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    Descripción
                  </div>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '1rem',
                    borderRadius: '0.375rem',
                    lineHeight: '1.5'
                  }}>
                    {order.descripcion}
                  </div>
                </div>
              </div>

              <div>
                {order.especificaciones && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      Especificaciones Técnicas
                    </div>
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '1rem',
                      borderRadius: '0.375rem',
                      lineHeight: '1.5'
                    }}>
                      {order.especificaciones}
                    </div>
                  </div>
                )}

                {order.notas_internas && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      Notas Internas
                    </div>
                    <div style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fcd34d',
                      padding: '1rem',
                      borderRadius: '0.375rem',
                      lineHeight: '1.5',
                      fontStyle: 'italic'
                    }}>
                      {order.notas_internas}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Información financiera */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} />
              Información Financiera
            </h3>
            
            <div style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '1.5rem'
            }}>
              <div className="grid grid-cols-3" style={{ gap: '2rem', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                    {formatCurrency(order.precio_total)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Precio Total
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                    {formatCurrency(order.adelanto_pagado)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Pagado
                  </div>
                </div>

                <div>
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold', 
                    color: order.saldo_pendiente > 0 ? '#dc2626' : '#059669'
                  }}>
                    {formatCurrency(order.saldo_pendiente)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Saldo Pendiente
                  </div>
                </div>
              </div>

              {order.esta_pagado && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '0.375rem',
                  textAlign: 'center',
                  color: '#065f46',
                  fontWeight: '500'
                }}>
                  ✅ Pedido completamente pagado
                </div>
              )}
            </div>
          </div>

          {/* Cambio de estado */}
          {nextStates.length > 0 && (
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '0.5rem',
              padding: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                Cambiar Estado del Pedido
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Estado actual: <strong>{currentStateInfo.label}</strong>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {currentStateInfo.description}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <select
                  className="form-input"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Seleccionar nuevo estado</option>
                  {nextStates.map(state => {
                    const stateInfo = getStateInfo(state);
                    return (
                      <option key={state} value={state}>
                        {stateInfo.label}
                      </option>
                    );
                  })}
                </select>

                <button
                  onClick={handleStateChange}
                  disabled={!newState || changingState}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {changingState ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                      Cambiando...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} />
                      Cambiar Estado
                    </>
                  )}
                </button>
              </div>

              {newState && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  <strong>Nuevo estado:</strong> {getStateInfo(newState).label}<br />
                  <span style={{ color: '#6b7280' }}>{getStateInfo(newState).description}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;