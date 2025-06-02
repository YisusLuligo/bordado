import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  ShoppingCart, 
  Users, 
  Package,
  AlertTriangle,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { finanzasAPI, inventarioAPI, pedidosAPI, clientesAPI } from '../../services/api';

const FinancialDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    resumenGeneral: null,
    productosVendidos: [],
    ingresosPorPeriodo: [],
    loading: true,
    error: null
  });

  const [selectedPeriod, setSelectedPeriod] = useState(30); // días

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

      const [resumenGeneral, productosVendidos, ingresosPorPeriodo] = await Promise.all([
        finanzasAPI.getResumenGeneral(),
        finanzasAPI.getProductosMasVendidos({ dias: selectedPeriod }),
        finanzasAPI.getIngresosPorPeriodo({ dias: selectedPeriod })
      ]);

      setDashboardData({
        resumenGeneral: resumenGeneral.data,
        productosVendidos: productosVendidos.data,
        ingresosPorPeriodo: ingresosPorPeriodo.data,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error cargando dashboard financiero:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'Error cargando datos del dashboard'
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  if (dashboardData.loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>Cargando dashboard financiero...</p>
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

  const { resumenGeneral, productosVendidos, ingresosPorPeriodo } = dashboardData;

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header con controles */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Dashboard Financiero
          </h2>
          <p style={{ color: '#6b7280' }}>
            Análisis financiero y métricas de rendimiento
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Selector de período */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 3 meses</option>
            <option value={365}>Último año</option>
          </select>
          
          {/* Botón actualizar */}
          <button
            onClick={loadDashboardData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-4" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Ingresos del día */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Ingresos Hoy</div>
            <DollarSign size={24} color="#059669" />
          </div>
          <div className="stat-card-value" style={{ color: '#059669' }}>
            {formatCurrency(resumenGeneral?.ingresos_hoy || 0)}
          </div>
          <div className="stat-card-change positive">
            Esta semana: {formatCurrency(resumenGeneral?.ingresos_semana || 0)}
          </div>
        </div>

        {/* Ingresos del mes */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Ingresos del Mes</div>
            <TrendingUp size={24} color="#2563eb" />
          </div>
          <div className="stat-card-value" style={{ color: '#2563eb' }}>
            {formatCurrency(resumenGeneral?.ingresos_mes || 0)}
          </div>
          <div className="stat-card-change">
            Meta mensual
          </div>
        </div>

        {/* Saldos pendientes */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Por Cobrar</div>
            <AlertTriangle size={24} color="#f59e0b" />
          </div>
          <div className="stat-card-value" style={{ color: '#f59e0b' }}>
            {formatCurrency(resumenGeneral?.pedidos_pendientes_pago || 0)}
          </div>
          <div className="stat-card-change">
            Saldos pendientes
          </div>
        </div>

        {/* Productos bajo stock */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Alertas Stock</div>
            <Package size={24} color="#dc2626" />
          </div>
          <div className="stat-card-value" style={{ color: '#dc2626' }}>
            {resumenGeneral?.productos_bajo_stock || 0}
          </div>
          <div className="stat-card-change">
            Requieren atención
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
        {/* Gráfico de ingresos por período */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={20} color="#2563eb" />
              Ingresos por Día (Últimos {selectedPeriod} días)
            </h3>
          </div>
          
          {ingresosPorPeriodo.length > 0 ? (
            <div>
              {/* Gráfico simple con barras CSS */}
              <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '2px', padding: '1rem 0' }}>
                {ingresosPorPeriodo.slice(-15).map((item, index) => {
                  const maxValue = Math.max(...ingresosPorPeriodo.map(i => i.total));
                  const height = maxValue > 0 ? (item.total / maxValue) * 180 : 0;
                  
                  return (
                    <div
                      key={index}
                      style={{
                        flex: 1,
                        height: `${height}px`,
                        backgroundColor: '#3b82f6',
                        borderRadius: '2px 2px 0 0',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                      title={`${formatDate(item.fecha)}: ${formatCurrency(item.total)}`}
                    />
                  );
                })}
              </div>
              
              {/* Resumen del período */}
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '1rem',
                borderRadius: '0.375rem',
                marginTop: '1rem'
              }}>
                <div className="grid grid-cols-3" style={{ gap: '1rem', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      {formatCurrency(ingresosPorPeriodo.reduce((sum, item) => sum + item.total, 0))}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Período</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#059669' }}>
                      {formatCurrency(ingresosPorPeriodo.reduce((sum, item) => sum + item.ingresos_servicios, 0))}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Servicios</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#2563eb' }}>
                      {formatCurrency(ingresosPorPeriodo.reduce((sum, item) => sum + item.ingresos_ventas, 0))}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ventas</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <BarChart3 size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
              <p>No hay datos de ingresos para mostrar</p>
            </div>
          )}
        </div>

        {/* Productos más vendidos */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={20} color="#059669" />
              Productos Más Vendidos
            </h3>
          </div>
          
          {productosVendidos.length > 0 ? (
            <div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {productosVendidos.slice(0, 5).map((producto, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: index < 4 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>
                        {producto.producto_nombre}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {producto.cantidad_vendida} unidades
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', color: '#059669' }}>
                        {formatCurrency(producto.total_vendido)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Ganancia: {formatCurrency(producto.ganancia)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {productosVendidos.length > 5 && (
                <div style={{
                  textAlign: 'center',
                  padding: '1rem',
                  borderTop: '1px solid #e5e7eb',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  +{productosVendidos.length - 5} productos más
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <ShoppingCart size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
              <p>No hay ventas de productos para mostrar</p>
            </div>
          )}
        </div>
      </div>

      {/* Resumen de estado del negocio */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="#059669" />
            Estado General del Negocio
          </h3>
        </div>
        
        <div className="grid grid-cols-4" style={{ gap: '2rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '0.5rem' }}>
              {resumenGeneral?.pedidos_en_proceso || 0}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Pedidos en Proceso</div>
          </div>
          
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669', marginBottom: '0.5rem' }}>
              {resumenGeneral?.clientes_nuevos_mes || 0}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Clientes Nuevos (Mes)</div>
          </div>
          
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
              {Math.round(((resumenGeneral?.ingresos_mes || 0) / 1000000) * 10) / 10}M
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Facturación Mensual</div>
          </div>
          
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed', marginBottom: '0.5rem' }}>
              {productosVendidos.length > 0 ? 
                Math.round((productosVendidos.reduce((sum, p) => sum + p.ganancia, 0) / 
                           productosVendidos.reduce((sum, p) => sum + p.total_vendido, 0)) * 100) || 0 
                : 0}%
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Margen Promedio</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;