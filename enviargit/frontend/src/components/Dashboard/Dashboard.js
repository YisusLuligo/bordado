import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  Package,
  Clock,
  CheckCircle
} from 'lucide-react';
import { finanzasAPI, inventarioAPI, pedidosAPI, clientesAPI } from '../../services/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    resumenFinanciero: null,
    alertasStock: [],
    estadisticasClientes: null,
    dashboardPedidos: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

      // Cargar datos en paralelo
      const [resumenFinanciero, alertasStock, estadisticasClientes, dashboardPedidos] = await Promise.all([
        finanzasAPI.getResumenGeneral(),
        inventarioAPI.getAlertasStock(),
        clientesAPI.getEstadisticasClientes(),
        pedidosAPI.getDashboardPedidos()
      ]);

      setDashboardData({
        resumenFinanciero: resumenFinanciero.data,
        alertasStock: alertasStock.data,
        estadisticasClientes: estadisticasClientes.data,
        dashboardPedidos: dashboardPedidos.data,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error cargando dashboard:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'Error cargando los datos del dashboard'
      }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (dashboardData.loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Cargando dashboard...</p>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="error">
        <h3>Error al cargar el dashboard</h3>
        <p>{dashboardData.error}</p>
        <button className="btn btn-primary" onClick={loadDashboardData}>
          Reintentar
        </button>
      </div>
    );
  }

  const { resumenFinanciero, alertasStock, estadisticasClientes, dashboardPedidos } = dashboardData;

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header del Dashboard */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          Dashboard Principal
        </h1>
        <p style={{ color: '#6b7280' }}>
          Resumen general de tu sistema de bordados
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        {/* Ingresos del día */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Ingresos Hoy</div>
            <DollarSign size={24} color="#059669" />
          </div>
          <div className="stat-card-value" style={{ color: '#059669' }}>
            {formatCurrency(resumenFinanciero?.ingresos_hoy || 0)}
          </div>
          <div className="stat-card-change positive">
            +{formatCurrency(resumenFinanciero?.ingresos_semana || 0)} esta semana
          </div>
        </div>

        {/* Pedidos en proceso */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Pedidos Activos</div>
            <Clock size={24} color="#2563eb" />
          </div>
          <div className="stat-card-value" style={{ color: '#2563eb' }}>
            {resumenFinanciero?.pedidos_en_proceso || 0}
          </div>
          <div className="stat-card-change">
            En proceso de bordado
          </div>
        </div>

        {/* Dinero por cobrar */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Por Cobrar</div>
            <TrendingUp size={24} color="#dc2626" />
          </div>
          <div className="stat-card-value" style={{ color: '#dc2626' }}>
            {formatCurrency(resumenFinanciero?.pedidos_pendientes_pago || 0)}
          </div>
          <div className="stat-card-change">
            Saldos pendientes
          </div>
        </div>

        {/* Productos bajo stock */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Alertas Stock</div>
            <AlertTriangle size={24} color="#f59e0b" />
          </div>
          <div className="stat-card-value" style={{ color: '#f59e0b' }}>
            {resumenFinanciero?.productos_bajo_stock || 0}
          </div>
          <div className="stat-card-change">
            Productos por reponer
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        {/* Alertas de Stock */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={20} color="#dc2626" />
              Productos Bajo Stock
            </h3>
          </div>
          {alertasStock && alertasStock.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {alertasStock.map((producto) => (
                <div key={producto.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#fef2f2'
                }}>
                  <div>
                    <p style={{ fontWeight: '500', color: '#1f2937' }}>{producto.nombre}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Stock: {producto.cantidad_actual} | Mínimo: {producto.stock_minimo}
                    </p>
                  </div>
                  <div style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem'
                  }}>
                    ¡REABASTECER!
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
              <p>¡Todos los productos tienen stock suficiente!</p>
            </div>
          )}
        </div>

        {/* Resumen de Clientes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="#2563eb" />
              Estadísticas de Clientes
            </h3>
          </div>
          {estadisticasClientes && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Total de clientes:</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{estadisticasClientes.total_clientes}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Clientes activos:</span>
                <span style={{ fontWeight: '600', color: '#059669' }}>{estadisticasClientes.clientes_activos}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Nuevos este mes:</span>
                <span style={{ fontWeight: '600', color: '#2563eb' }}>{estadisticasClientes.clientes_nuevos_mes}</span>
              </div>
              
              {/* Distribución por tipo */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                  Distribución por Tipo
                </h4>
                {estadisticasClientes.distribucion_por_tipo?.map((tipo) => (
                  <div key={tipo.tipo_cliente} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0'
                  }}>
                    <span style={{ 
                      color: '#6b7280',
                      textTransform: 'capitalize'
                    }}>
                      {tipo.tipo_cliente}:
                    </span>
                    <span style={{ 
                      fontWeight: '500',
                      color: '#1f2937',
                      backgroundColor: '#f3f4f6',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem'
                    }}>
                      {tipo.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resumen Financiero del Mes */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="#059669" />
            Resumen Financiero del Mes
          </h3>
        </div>
        <div className="grid grid-cols-3">
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
              {formatCurrency(resumenFinanciero?.ingresos_mes || 0)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Ingresos del Mes</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
              {dashboardPedidos?.total_pedidos || 0}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total de Pedidos</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
              {formatCurrency(dashboardPedidos?.ingresos_pendientes || 0)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Ingresos Pendientes</div>
          </div>
        </div>
      </div>

      {/* Botón de actualizar */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button 
          className="btn btn-primary"
          onClick={loadDashboardData}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
        >
          <TrendingUp size={16} />
          Actualizar Dashboard
        </button>
      </div>
    </div>
  );
};

export default Dashboard;