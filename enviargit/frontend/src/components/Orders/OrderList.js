// components/Orders/OrderList.js - SIN FUNCIONALIDAD DE VENCIDO
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ClipboardList, 
  Eye, 
  Edit3, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertCircle,
  User,
  Calendar
} from 'lucide-react';
import { pedidosAPI, clientesAPI } from '../../services/api';
import OrderForm from './OrderForm';
import OrderDetail from './OrderDetail';
import PaymentModal from './PaymentModal';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [showPendingPayments, setShowPendingPayments] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Estados para modales
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formMode, setFormMode] = useState('create');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ordersResponse, clientsResponse] = await Promise.all([
        pedidosAPI.getPedidos(),
        clientesAPI.getResumenClientes()
      ]);
      
      setOrders(ordersResponse.data);
      setClients(clientsResponse.data);
    } catch (err) {
      setError('Error cargando datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (selectedClient) params.cliente = selectedClient;
      if (selectedState) params.estado = selectedState;
      if (showPendingPayments) params.pendiente_pago = 'true';
      if (dateFrom) params.fecha_desde = dateFrom;
      if (dateTo) params.fecha_hasta = dateTo;
      
      const response = await pedidosAPI.getPedidos(params);
      setOrders(response.data);
    } catch (err) {
      setError('Error cargando pedidos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recargar cuando cambien los filtros
  useEffect(() => {
    if (clients.length > 0) { // Solo ejecutar después de que se carguen los clientes
      loadOrders();
    }
  }, [selectedClient, selectedState, showPendingPayments, dateFrom, dateTo]);

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
      month: 'short',
      day: 'numeric',
    });
  };

  const getStateInfo = (estado) => {
    const states = {
      recibido: { 
        label: 'Recibido', 
        color: '#2563eb', 
        bgColor: '#dbeafe',
        icon: ClipboardList 
      },
      en_diseno: { 
        label: 'En Diseño', 
        color: '#f59e0b', 
        bgColor: '#fffbeb',
        icon: Edit3 
      },
      aprobado: { 
        label: 'Aprobado', 
        color: '#059669', 
        bgColor: '#ecfdf5',
        icon: CheckCircle 
      },
      en_proceso: { 
        label: 'En Proceso', 
        color: '#dc2626', 
        bgColor: '#fef2f2',
        icon: Clock 
      },
      terminado: { 
        label: 'Terminado', 
        color: '#7c3aed', 
        bgColor: '#ede9fe',
        icon: CheckCircle 
      },
      entregado: { 
        label: 'Entregado', 
        color: '#059669', 
        bgColor: '#dcfce7',
        icon: CheckCircle 
      },
      cancelado: { 
        label: 'Cancelado', 
        color: '#6b7280', 
        bgColor: '#f3f4f6',
        icon: AlertCircle 
      }
    };
    return states[estado] || states.recibido;
  };

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleAddPayment = (order) => {
    setSelectedOrder(order);
    setShowPayment(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadOrders();
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    loadOrders();
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // ⭐ ELIMINADO: isOrderOverdue function completamente removida

  // Filtrar por búsqueda en el frontend
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toString().includes(searchLower) ||
      (order.cliente_nombre && order.cliente_nombre.toLowerCase().includes(searchLower)) ||
      (order.descripcion && order.descripcion.toLowerCase().includes(searchLower))
    );
  });

  if (loading && orders.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Gestión de Pedidos
          </h1>
          <p style={{ color: '#6b7280' }}>
            Administra todos los pedidos de bordado y su seguimiento
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleCreateOrder}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} />
          Nuevo Pedido
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
            Filtros y Búsqueda
          </h3>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {/* Búsqueda */}
          <div>
            <label className="form-label">Buscar</label>
            <div style={{ position: 'relative' }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }} 
              />
              <input
                type="text"
                className="form-input"
                placeholder="# pedido, cliente, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label className="form-label">Cliente</label>
            <select
              className="form-input"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="">Todos los clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="form-label">Estado</label>
            <select
              className="form-input"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="recibido">Recibido</option>
              <option value="en_diseno">En Diseño</option>
              <option value="aprobado">Aprobado</option>
              <option value="en_proceso">En Proceso</option>
              <option value="terminado">Terminado</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Fecha desde */}
          <div>
            <label className="form-label">Desde</label>
            <input
              type="date"
              className="form-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          {/* Fecha hasta */}
          <div>
            <label className="form-label">Hasta</label>
            <input
              type="date"
              className="form-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Pendientes de pago */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showPendingPayments}
              onChange={(e) => setShowPendingPayments(e.target.checked)}
            />
            <span className="form-label" style={{ margin: 0 }}>Solo con saldo pendiente</span>
          </label>

          {/* Botón limpiar filtros */}
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectedClient('');
              setSelectedState('');
              setShowPendingPayments(false);
              setDateFrom('');
              setDateTo('');
              setSearchTerm('');
            }}
            style={{ fontSize: '0.875rem' }}
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadOrders}>
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <ClipboardList size={64} color="#6b7280" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>No hay pedidos</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {searchTerm || selectedClient || selectedState || showPendingPayments || dateFrom || dateTo
              ? 'No se encontraron pedidos con los filtros aplicados'
              : 'Comienza creando tu primer pedido de bordado'
            }
          </p>
          {!searchTerm && !selectedClient && !selectedState && !showPendingPayments && !dateFrom && !dateTo && (
            <button className="btn btn-primary" onClick={handleCreateOrder}>
              <Plus size={16} style={{ marginRight: '0.5rem' }} />
              Crear Primer Pedido
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          {/* Resumen - ⭐ MODIFICADO: Sin contar vencidos */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <span style={{ color: '#6b7280' }}>
              {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''} encontrado{filteredOrders.length !== 1 ? 's' : ''}
            </span>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#f59e0b' }}>
                ● {filteredOrders.filter(o => ['recibido', 'en_diseno', 'aprobado'].includes(o.estado)).length} Pendientes
              </span>
              <span style={{ color: '#dc2626' }}>
                ● {filteredOrders.filter(o => ['en_proceso', 'terminado'].includes(o.estado)).length} En Proceso
              </span>
              <span style={{ color: '#059669' }}>
                ● {filteredOrders.filter(o => o.estado === 'entregado').length} Entregados
              </span>
              {/* ⭐ REMOVIDO: La línea de "Vencidos" completamente eliminada */}
            </div>
          </div>

          {/* Grid de pedidos */}
          <div className="grid grid-cols-1" style={{ gap: '1rem' }}>
            {filteredOrders.map((order) => {
              const stateInfo = getStateInfo(order.estado);
              const StateIcon = stateInfo.icon;
              // ⭐ REMOVIDO: const overdue = isOrderOverdue(order);
              
              return (
                <div key={order.id} style={{
                  // ⭐ MODIFICADO: Sin condición de overdue
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => handleViewOrder(order)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* Información principal */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <StateIcon size={20} color={stateInfo.color} />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                          Pedido #{order.id}
                        </h3>
                        <span style={{
                          backgroundColor: stateInfo.bgColor,
                          color: stateInfo.color,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {stateInfo.label}
                        </span>
                        {/* ⭐ REMOVIDO: Badge de "VENCIDO" completamente eliminado */}
                        {order.saldo_pendiente > 0 && (
                          <span style={{
                            backgroundColor: '#fffbeb',
                            color: '#f59e0b',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            SALDO PENDIENTE
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3" style={{ gap: '1rem', marginBottom: '1rem' }}>
                        {/* Cliente */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User size={16} color="#6b7280" />
                          <span style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '500' }}>
                            {order.cliente_nombre}
                          </span>
                        </div>

                        {/* Fecha de pedido */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={16} color="#6b7280" />
                          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            {formatDate(order.fecha_pedido)}
                          </span>
                        </div>

                        {/* Fecha de entrega - ⭐ MODIFICADO: Sin lógica de overdue */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={16} color="#6b7280" />
                          <span style={{ 
                            color: '#6b7280', 
                            fontSize: '0.875rem'
                          }}>
                            Entrega: {formatDate(order.fecha_entrega_prometida)}
                          </span>
                        </div>
                      </div>

                      {/* Descripción */}
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ 
                          color: '#374151', 
                          fontSize: '0.875rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {order.descripcion}
                        </p>
                      </div>

                      {/* Información financiera */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        backgroundColor: '#f9fafb',
                        padding: '0.75rem',
                        borderRadius: '0.375rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                            {formatCurrency(order.precio_total)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Precio Total
                          </div>
                        </div>
                        
                        {order.adelanto_pagado > 0 && (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#059669' }}>
                              {formatCurrency(order.adelanto_pagado)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              Pagado
                            </div>
                          </div>
                        )}
                        
                        {order.saldo_pendiente > 0 && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#dc2626' }}>
                              {formatCurrency(order.saldo_pendiente)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              Saldo
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrder(order);
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid #d1d5db',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          color: '#6b7280',
                          borderRadius: '0.375rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        title="Ver detalles"
                      >
                        <Eye size={14} />
                        <span style={{ fontSize: '0.75rem' }}>Ver</span>
                      </button>
                      
                      {order.saldo_pendiente > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddPayment(order);
                          }}
                          style={{
                            background: '#059669',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            color: 'white',
                            borderRadius: '0.375rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                          title="Registrar pago"
                        >
                          <DollarSign size={14} />
                          <span style={{ fontSize: '0.75rem' }}>Pagar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modales */}
      {showForm && (
        <OrderForm
          order={selectedOrder}
          clients={clients}
          mode={formMode}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showDetail && selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setShowDetail(false)}
          onEdit={handleEditOrder}
          onAddPayment={handleAddPayment}
          onReload={loadOrders}
        />
      )}

      {showPayment && selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default OrderList;