import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Star, 
  User,
  Building,
  ShoppingCart,
  DollarSign,
  Clock,
  Package
} from 'lucide-react';
import { clientesAPI } from '../../services/api';

const ClientDetail = ({ client, onClose, onEdit, onReload }) => {
  const [historialPedidos, setHistorialPedidos] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistorialPedidos();
  }, [client.id]);

  const loadHistorialPedidos = async () => {
    try {
      setLoading(true);
      const response = await clientesAPI.getHistorialPedidos(client.id);
      setHistorialPedidos(response.data);
    } catch (error) {
      console.error('Error cargando historial:', error);
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

  const getClientTypeInfo = (tipo) => {
    const types = {
      particular: { 
        label: 'Particular', 
        color: '#6b7280', 
        bgColor: '#f3f4f6',
        icon: User,
        description: 'Cliente individual'
      },
      empresa: { 
        label: 'Empresa', 
        color: '#2563eb', 
        bgColor: '#dbeafe',
        icon: Building,
        description: 'Cliente corporativo'
      },
      mayorista: { 
        label: 'Mayorista', 
        color: '#7c3aed', 
        bgColor: '#ede9fe',
        icon: Star,
        description: 'Cliente mayorista'
      }
    };
    return types[tipo] || types.particular;
  };

  const getEstadoColor = (estado) => {
    const estados = {
      recibido: { color: '#2563eb', bgColor: '#dbeafe' },
      en_diseno: { color: '#f59e0b', bgColor: '#fffbeb' },
      aprobado: { color: '#059669', bgColor: '#ecfdf5' },
      en_proceso: { color: '#dc2626', bgColor: '#fef2f2' },
      terminado: { color: '#7c3aed', bgColor: '#ede9fe' },
      entregado: { color: '#059669', bgColor: '#dcfce7' },
      cancelado: { color: '#6b7280', bgColor: '#f3f4f6' }
    };
    return estados[estado] || estados.recibido;
  };

  const typeInfo = getClientTypeInfo(client.tipo_cliente);
  const TypeIcon = typeInfo.icon;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <TypeIcon size={28} color={typeInfo.color} />
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {client.nombre}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
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
                {client.descuento_especial > 0 && (
                  <span style={{
                    backgroundColor: '#dcfce7',
                    color: '#059669',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {client.descuento_especial}% Descuento
                  </span>
                )}
                {!client.activo && (
                  <span style={{
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    Inactivo
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onEdit(client)}
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
          <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
            {/* Información del cliente */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                Información de Contacto
              </h3>
              
              <div style={{ space: '1rem' }}>
                {/* Teléfono */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Phone size={18} color="#6b7280" />
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937' }}>{client.telefono}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Teléfono principal</div>
                  </div>
                </div>

                {/* Email */}
                {client.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Mail size={18} color="#6b7280" />
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>{client.email}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Correo electrónico</div>
                    </div>
                  </div>
                )}

                {/* Dirección */}
                {client.direccion && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                    <MapPin size={18} color="#6b7280" style={{ marginTop: '0.125rem' }} />
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>{client.direccion}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Dirección</div>
                    </div>
                  </div>
                )}

                {/* Fecha de registro */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Calendar size={18} color="#6b7280" />
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937' }}>{formatDate(client.fecha_registro)}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Cliente desde</div>
                  </div>
                </div>

                {/* Última compra */}
                {client.ultima_compra && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <ShoppingCart size={18} color="#6b7280" />
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>{formatDate(client.ultima_compra)}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Última compra</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas */}
              {client.notas && (
                <div style={{ marginTop: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                    Notas
                  </h4>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontStyle: 'italic'
                  }}>
                    {client.notas}
                  </div>
                </div>
              )}
            </div>

            {/* Estadísticas */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                Estadísticas del Cliente
              </h3>
              
              {loading ? (
                <div className="loading">
                  <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Cargando estadísticas...</p>
                </div>
              ) : historialPedidos ? (
                <div>
                  {/* Estadísticas principales */}
                  <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{
                      backgroundColor: '#f3f4f6',
                      padding: '1rem',
                      borderRadius: '0.375rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                        {historialPedidos.estadisticas.total_pedidos}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Pedidos</div>
                    </div>
                    
                    <div style={{
                      backgroundColor: '#ecfdf5',
                      padding: '1rem',
                      borderRadius: '0.375rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                        {formatCurrency(historialPedidos.estadisticas.total_gastado)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Gastado</div>
                    </div>
                  </div>

                  {historialPedidos.estadisticas.pedidos_pendientes > 0 && (
                    <div style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #f59e0b',
                      borderRadius: '0.375rem',
                      padding: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} color="#f59e0b" />
                        <span style={{ fontWeight: '500', color: '#92400e' }}>
                          {historialPedidos.estadisticas.pedidos_pendientes} pedido{historialPedidos.estadisticas.pedidos_pendientes !== 1 ? 's' : ''} pendiente{historialPedidos.estadisticas.pedidos_pendientes !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280' }}>
                  <Package size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                  <p>No se pudo cargar el historial</p>
                </div>
              )}
            </div>
          </div>

          {/* Historial de pedidos */}
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Historial de Pedidos
            </h3>
            
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem' }}>Cargando historial...</p>
              </div>
            ) : historialPedidos && historialPedidos.pedidos.length > 0 ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {historialPedidos.pedidos.map((pedido) => {
                  const estadoColor = getEstadoColor(pedido.estado);
                  return (
                    <div key={pedido.id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      padding: '1rem',
                      marginBottom: '0.5rem',
                      backgroundColor: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: '600', color: '#1f2937' }}>
                              Pedido #{pedido.id}
                            </span>
                            <span style={{
                              backgroundColor: estadoColor.bgColor,
                              color: estadoColor.color,
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              {pedido.estado_display}
                            </span>
                          </div>
                          
                          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                            {formatDateTime(pedido.fecha_pedido)}
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                              Entrega: {formatDate(pedido.fecha_entrega_prometida)}
                            </span>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                                {formatCurrency(pedido.precio_total)}
                              </div>
                              {pedido.saldo_pendiente > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                                  Saldo: {formatCurrency(pedido.saldo_pendiente)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <Package size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                <p>Este cliente aún no tiene pedidos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;