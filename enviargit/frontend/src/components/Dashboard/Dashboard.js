import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  RefreshCw
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
    
    // ⭐ NUEVO: Auto-actualizar cada 30 segundos
    const interval = setInterval(() => {
      loadDashboardData(true); // true = silencioso (sin mostrar loading)
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) {
        setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      }

      // ⭐ CORREGIDO: Cargar datos en paralelo con mejor manejo de errores
      const promises = [
        finanzasAPI.getResumenGeneral().catch(err => {
          console.warn('Error en resumen financiero:', err);
          return { data: null };
        }),
        inventarioAPI.getAlertasStock().catch(err => {
          console.warn('Error en alertas stock:', err);
          return { data: [] };
        }),
        clientesAPI.getEstadisticasClientes().catch(err => {
          console.warn('Error en estadísticas clientes:', err);
          return { data: null };
        }),
        pedidosAPI.getDashboardPedidos().catch(err => {
          console.warn('Error en dashboard pedidos:', err);
          return { data: null };
        })
      ];

      const [resumenFinanciero, alertasStock, estadisticasClientes, dashboardPedidos] = await Promise.all(promises);

      setDashboardData({
        resumenFinanciero: resumenFinanciero.data,
        alertasStock: alertasStock.data,
        estadisticasClientes: estadisticasClientes.data,
        dashboardPedidos: dashboardPedidos.data,
        loading: false,
        error: null
      });

      // ⭐ NUEVO: Log para debug
      console.log('Dashboard actualizado:', {
        pedidos: dashboardPedidos.data,
        finanzas: resumenFinanciero.data
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
    }).format(amount || 0);
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
        <button className="btn btn-primary" onClick={() => loadDashboardData()}>
          <RefreshCw size={16} style={{ marginRight: '0.5rem' }} />
          Reintentar
        </button>
      </div>
    );
  }

  const { resumenFinanciero, alertasStock, estadisticasClientes, dashboardPedidos } = dashboardData;

  // ⭐ NUEVO: Valores por defecto mejorados
  const safeResumen = resumenFinanciero || {
    ingresos_hoy: 0,
    ingresos_semana: 0,
    pedidos_en_proceso: 0,
    pedidos_pendientes_pago: 0,
    productos_bajo_stock: 0
  };

  const safePedidos = dashboardPedidos || {
    total_pedidos: 0,
    pedidos_activos: 0,
    ingresos_pendientes: 0
  };

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header del Dashboard */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem' 
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Dashboard Principal
          </h1>
          <p style={{ color: '#6b7280' }}>
            Resumen general de tu sistema de bordados • Actualizado: {new Date().toLocaleTimeString('es-CO')}
          </p>
        </div>
        
        {/* ⭐ NUEVO: Botón de actualización manual */}
        <button
          onClick={() => loadDashboardData()}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
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
            {formatCurrency(safeResumen.ingresos_hoy)}
          </div>
          <div className="stat-card-change positive">
            +{formatCurrency(safeResumen.ingresos_semana)} esta semana
          </div>
        </div>

        {/* Pedidos en proceso - ⭐ CORREGIDO */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Pedidos Activos</div>
            <Clock size={24} color="#2563eb" />
          </div>
          <div className="stat-card-value" style={{ color: '#2563eb' }}>
            {safePedidos.pedidos_activos || safeResumen.pedidos_en_proceso}
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
            {formatCurrency(safePedidos.ingresos_pendientes || safeResumen.pedidos_pendientes_pago)}
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
            {alertasStock?.length || safeResumen.productos_bajo_stock}
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
                  backgroundColor: producto.cantidad_actual <= 0 ? '#fef2f2' : '#fffbeb'
                }}>
                  <div>
                    <p style={{ fontWeight: '500', color: '#1f2937' }}>{producto.nombre}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Stock: {Math.floor(producto.cantidad_actual)} | Mínimo: {producto.stock_minimo}
                    </p>
                  </div>
                  <div style={{
                    backgroundColor: producto.cantidad_actual <= 0 ? '#dc2626' : '#f59e0b',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem'
                  }}>
                    {producto.cantidad_actual <= 0 ? '¡SIN STOCK!' : '¡REABASTECER!'}
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
          {estadisticasClientes ? (
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
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <Users size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
              <p>Cargando estadísticas de clientes...</p>
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
              {formatCurrency(safeResumen.ingresos_mes)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Ingresos del Mes</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
              {safePedidos.total_pedidos}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total de Pedidos</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
              {formatCurrency(safePedidos.ingresos_pendientes)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Ingresos Pendientes</div>
          </div>
        </div>
      </div>

      {/* ⭐ NUEVO: Información de actualización automática */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '0.5rem',
        border: '1px solid #bae6fd'
      }}>
        <p style={{ 
          fontSize: '0.875rem', 
          color: '#1e40af',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <RefreshCw size={14} />
          Dashboard se actualiza automáticamente cada 30 segundos
        </p>
      </div>
    </div>
  );
};

export default Dashboard;