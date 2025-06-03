// components/Reports/AdvancedReports.js
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Calendar,
  Download,
  Filter,
  DollarSign,
  Package,
  Users,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { finanzasAPI, pedidosAPI, clientesAPI, inventarioAPI } from '../../services/api';

const AdvancedReports = () => {
  const [activeReport, setActiveReport] = useState('rentabilidad');
  const [dateRange, setDateRange] = useState('30'); // días
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const reports = [
    {
      id: 'rentabilidad',
      name: 'Análisis de Rentabilidad',
      icon: DollarSign,
      description: 'Ingresos, costos y márgenes de ganancia'
    },
    {
      id: 'productos',
      name: 'Performance de Productos',
      icon: Package,
      description: 'Productos más vendidos y análisis de stock'
    },
    {
      id: 'clientes',
      name: 'Análisis de Clientes',
      icon: Users,
      description: 'Comportamiento y valor de clientes'
    },
    {
      id: 'operacional',
      name: 'Eficiencia Operacional',
      icon: Clock,
      description: 'Tiempos de entrega y productividad'
    }
  ];

  useEffect(() => {
    loadReportData();
  }, [activeReport, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      switch (activeReport) {
        case 'rentabilidad':
          await loadRentabilidadData();
          break;
        case 'productos':
          await loadProductosData();
          break;
        case 'clientes':
          await loadClientesData();
          break;
        case 'operacional':
          await loadOperacionalData();
          break;
      }
    } catch (error) {
      console.error('Error cargando reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRentabilidadData = async () => {
    const [resumenResponse, ventasResponse, ingresosPorDiaResponse] = await Promise.all([
      finanzasAPI.getResumenGeneral(),
      finanzasAPI.getProductosMasVendidos({ dias: dateRange }),
      finanzasAPI.getIngresosPorPeriodo({ dias: dateRange })
    ]);

    // Calcular métricas de rentabilidad
    const totalIngresos = ingresosPorDiaResponse.data.reduce((sum, dia) => sum + dia.total, 0);
    const totalCostos = ventasResponse.data.reduce((sum, producto) => {
      return sum + (producto.total_vendido - producto.ganancia);
    }, 0);
    
    const margenBruto = totalIngresos - totalCostos;
    const porcentajeMargen = totalIngresos > 0 ? (margenBruto / totalIngresos) * 100 : 0;

    setReportData({
      totalIngresos,
      totalCostos,
      margenBruto,
      porcentajeMargen,
      ingresosPorDia: ingresosPorDiaResponse.data,
      productosRentables: ventasResponse.data.slice(0, 5),
      promedioVentaDiaria: totalIngresos / parseInt(dateRange),
      resumenGeneral: resumenResponse.data
    });
  };

  const loadProductosData = async () => {
    const [productosResponse, stockResponse, ventasResponse] = await Promise.all([
      inventarioAPI.getProductos(),
      inventarioAPI.getAlertasStock(),
      finanzasAPI.getProductosMasVendidos({ dias: dateRange })
    ]);

    // Análisis de rotación de inventario
    const totalProductos = productosResponse.data.length;
    const productosConStock = productosResponse.data.filter(p => p.cantidad_actual > 0).length;
    const productosStockBajo = stockResponse.data.length;
    
    // Calcular valor total del inventario
    const valorInventario = productosResponse.data.reduce((sum, producto) => {
      return sum + (producto.cantidad_actual * producto.precio_compra);
    }, 0);

    setReportData({
      totalProductos,
      productosConStock,
      productosStockBajo,
      valorInventario,
      productosVendidos: ventasResponse.data,
      rotacionPromedio: ventasResponse.data.length > 0 ? 
        ventasResponse.data.reduce((sum, p) => sum + p.cantidad_vendida, 0) / ventasResponse.data.length : 0,
      productos: productosResponse.data.slice(0, 10)
    });
  };

  const loadClientesData = async () => {
    const [estadisticasResponse, pedidosResponse] = await Promise.all([
      clientesAPI.getEstadisticasClientes(),
      pedidosAPI.getPedidos()
    ]);

    // Análisis de clientes
    const clientesPorMes = {};
    const ventasPorCliente = {};
    
    pedidosResponse.data.forEach(pedido => {
      const mes = new Date(pedido.fecha_pedido).getMonth();
      clientesPorMes[mes] = (clientesPorMes[mes] || 0) + 1;
      
      const clienteId = pedido.cliente;
      if (!ventasPorCliente[clienteId]) {
        ventasPorCliente[clienteId] = {
          nombre: pedido.cliente_nombre,
          totalPedidos: 0,
          totalGastado: 0
        };
      }
      ventasPorCliente[clienteId].totalPedidos += 1;
      ventasPorCliente[clienteId].totalGastado += parseFloat(pedido.precio_total);
    });

    const topClientes = Object.values(ventasPorCliente)
      .sort((a, b) => b.totalGastado - a.totalGastado)
      .slice(0, 5);

    setReportData({
      estadisticas: estadisticasResponse.data,
      clientesPorMes: Object.entries(clientesPorMes).map(([mes, count]) => ({
        mes: parseInt(mes),
        clientes: count
      })),
      topClientes,
      valorPromedioCliente: topClientes.length > 0 ? 
        topClientes.reduce((sum, c) => sum + c.totalGastado, 0) / topClientes.length : 0
    });
  };

  const loadOperacionalData = async () => {
    const pedidosResponse = await pedidosAPI.getPedidos();
    
    // Análisis de tiempos y eficiencia
    const pedidosEntregados = pedidosResponse.data.filter(p => p.estado === 'entregado');
    const pedidosEnProceso = pedidosResponse.data.filter(p => 
      ['en_proceso', 'terminado'].includes(p.estado)
    );

    // Calcular tiempos promedio
    let tiempoPromedioEntrega = 0;
    if (pedidosEntregados.length > 0) {
      const totalDias = pedidosEntregados.reduce((sum, pedido) => {
        const fechaPedido = new Date(pedido.fecha_pedido);
        const fechaEntrega = new Date(pedido.fecha_entrega_real || pedido.fecha_entrega_prometida);
        const dias = Math.ceil((fechaEntrega - fechaPedido) / (1000 * 60 * 60 * 24));
        return sum + dias;
      }, 0);
      tiempoPromedioEntrega = totalDias / pedidosEntregados.length;
    }

    // Análisis de cumplimiento
    const entregasAPTiempo = pedidosEntregados.filter(pedido => {
      const fechaEntrega = new Date(pedido.fecha_entrega_real);
      const fechaPrometida = new Date(pedido.fecha_entrega_prometida);
      return fechaEntrega <= fechaPrometida;
    }).length;

    const porcentajeCumplimiento = pedidosEntregados.length > 0 ? 
      (entregasAPTiempo / pedidosEntregados.length) * 100 : 0;

    setReportData({
      pedidosEntregados: pedidosEntregados.length,
      pedidosEnProceso: pedidosEnProceso.length,
      tiempoPromedioEntrega,
      porcentajeCumplimiento,
      entregasAPTiempo,
      entregasTarde: pedidosEntregados.length - entregasAPTiempo,
      productividadDiaria: pedidosEntregados.length / parseInt(dateRange)
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportReport = () => {
    // Funcionalidad de exportación
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-${activeReport}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const renderRentabilidadReport = () => (
    <div>
      {/* KPIs principales */}
      <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Ingresos Totales</div>
            <DollarSign size={24} color="#059669" />
          </div>
          <div className="stat-card-value" style={{ color: '#059669' }}>
            {formatCurrency(reportData.totalIngresos)}
          </div>
          <div className="stat-card-change">
            {formatCurrency(reportData.promedioVentaDiaria)}/día
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Costos</div>
            <TrendingUp size={24} color="#dc2626" />
          </div>
          <div className="stat-card-value" style={{ color: '#dc2626' }}>
            {formatCurrency(reportData.totalCostos)}
          </div>
          <div className="stat-card-change">
            {((reportData.totalCostos / reportData.totalIngresos) * 100).toFixed(1)}% de ingresos
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Margen Bruto</div>
            <Target size={24} color="#2563eb" />
          </div>
          <div className="stat-card-value" style={{ color: '#2563eb' }}>
            {formatCurrency(reportData.margenBruto)}
          </div>
          <div className="stat-card-change positive">
            {reportData.porcentajeMargen.toFixed(1)}% margen
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Eficiencia</div>
            <Zap size={24} color="#7c3aed" />
          </div>
          <div className="stat-card-value" style={{ color: '#7c3aed' }}>
            {reportData.porcentajeMargen > 30 ? 'Excelente' : 
             reportData.porcentajeMargen > 20 ? 'Buena' : 'Mejorable'}
          </div>
          <div className="stat-card-change">
            {reportData.productosRentables.length} productos top
          </div>
        </div>
      </div>

      {/* Gráfico de ingresos por día */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title">Tendencia de Ingresos</h3>
        <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '2px', padding: '1rem 0' }}>
          {reportData.ingresosPorDia.slice(-15).map((dia, index) => {
            const maxValue = Math.max(...reportData.ingresosPorDia.map(d => d.total));
            const height = maxValue > 0 ? (dia.total / maxValue) * 180 : 0;
            
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
                title={`${new Date(dia.fecha).toLocaleDateString('es-CO')}: ${formatCurrency(dia.total)}`}
              />
            );
          })}
        </div>
      </div>

      {/* Productos más rentables */}
      <div className="card">
        <h3 className="card-title">Productos Más Rentables</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Vendido</th>
                <th>Ganancia</th>
                <th>Margen %</th>
              </tr>
            </thead>
            <tbody>
              {reportData.productosRentables.map((producto, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: '500' }}>{producto.producto_nombre}</td>
                  <td>{formatCurrency(producto.total_vendido)}</td>
                  <td style={{ color: '#059669', fontWeight: '600' }}>
                    {formatCurrency(producto.ganancia)}
                  </td>
                  <td>
                    <span style={{
                      backgroundColor: producto.ganancia > 0 ? '#dcfce7' : '#fef2f2',
                      color: producto.ganancia > 0 ? '#059669' : '#dc2626',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      {((producto.ganancia / producto.total_vendido) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProductosReport = () => (
    <div>
      <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Total Productos</div>
            <Package size={24} color="#2563eb" />
          </div>
          <div className="stat-card-value">{reportData.totalProductos}</div>
          <div className="stat-card-change">
            {reportData.productosConStock} con stock
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Valor Inventario</div>
            <DollarSign size={24} color="#059669" />
          </div>
          <div className="stat-card-value" style={{ color: '#059669' }}>
            {formatCurrency(reportData.valorInventario)}
          </div>
          <div className="stat-card-change">
            Inversión actual
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Stock Bajo</div>
            <AlertTriangle size={24} color="#f59e0b" />
          </div>
          <div className="stat-card-value" style={{ color: '#f59e0b' }}>
            {reportData.productosStockBajo}
          </div>
          <div className="stat-card-change">
            Requieren atención
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Rotación</div>
            <TrendingUp size={24} color="#7c3aed" />
          </div>
          <div className="stat-card-value">{reportData.rotacionPromedio.toFixed(1)}</div>
          <div className="stat-card-change">
            Unidades/producto
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        <div className="card">
          <h3 className="card-title">Productos Más Vendidos</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {reportData.productosVendidos.slice(0, 8).map((producto, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: index < 7 ? '1px solid #e5e7eb' : 'none'
              }}>
                <div>
                  <div style={{ fontWeight: '500' }}>{producto.producto_nombre}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {producto.cantidad_vendida} unidades
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: '#059669' }}>
                    {formatCurrency(producto.total_vendido)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Análisis de Stock</h3>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            {/* Gráfico circular simple */}
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: `conic-gradient(
                #059669 0deg ${(reportData.productosConStock / reportData.totalProductos) * 360}deg,
                #f59e0b ${(reportData.productosConStock / reportData.totalProductos) * 360}deg ${((reportData.productosConStock + reportData.productosStockBajo) / reportData.totalProductos) * 360}deg,
                #dc2626 ${((reportData.productosConStock + reportData.productosStockBajo) / reportData.totalProductos) * 360}deg 360deg
              )`,
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 'bold'
              }}>
                {((reportData.productosConStock / reportData.totalProductos) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          
          <div style={{ space: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#059669', borderRadius: '50%' }}></div>
                Con Stock
              </span>
              <span style={{ fontWeight: '500' }}>{reportData.productosConStock}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></div>
                Stock Bajo
              </span>
              <span style={{ fontWeight: '500' }}>{reportData.productosStockBajo}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#dc2626', borderRadius: '50%' }}></div>
                Sin Stock
              </span>
              <span style={{ fontWeight: '500' }}>
                {reportData.totalProductos - reportData.productosConStock - reportData.productosStockBajo}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClientesReport = () => (
    <div>
      <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Total Clientes</div>
            <Users size={24} color="#2563eb" />
          </div>
          <div className="stat-card-value">{reportData.estadisticas.total_clientes}</div>
          <div className="stat-card-change">
            {reportData.estadisticas.clientes_activos} activos
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Nuevos Este Mes</div>
            <TrendingUp size={24} color="#059669" />
          </div>
          <div className="stat-card-value" style={{ color: '#059669' }}>
            {reportData.estadisticas.clientes_nuevos_mes}
          </div>
          <div className="stat-card-change positive">
            Crecimiento mensual
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Valor Promedio</div>
            <DollarSign size={24} color="#7c3aed" />
          </div>
          <div className="stat-card-value" style={{ color: '#7c3aed' }}>
            {formatCurrency(reportData.valorPromedioCliente)}
          </div>
          <div className="stat-card-change">
            Por cliente top
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Retención</div>
            <Target size={24} color="#f59e0b" />
          </div>
          <div className="stat-card-value">
            {reportData.topClientes.filter(c => c.totalPedidos > 1).length}
          </div>
          <div className="stat-card-change">
            Clientes recurrentes
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        <div className="card">
          <h3 className="card-title">Top 5 Clientes</h3>
          <div style={{ space: '1rem' }}>
            {reportData.topClientes.map((cliente, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 0',
                borderBottom: index < 4 ? '1px solid #e5e7eb' : 'none'
              }}>
                <div>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>
                    {cliente.nombre}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {cliente.totalPedidos} pedido{cliente.totalPedidos !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: '#059669' }}>
                    {formatCurrency(cliente.totalGastado)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {formatCurrency(cliente.totalGastado / cliente.totalPedidos)}/pedido
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Distribución por Tipo</h3>
          <div style={{ space: '1rem' }}>
            {reportData.estadisticas.distribucion_por_tipo?.map((tipo, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: index < reportData.estadisticas.distribucion_por_tipo.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}>
                <span style={{ 
                  textTransform: 'capitalize',
                  fontWeight: '500'
                }}>
                  {tipo.tipo_cliente}
                </span>
                <span style={{
                  backgroundColor: '#f3f4f6',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.25rem',
                  fontWeight: '600'
                }}>
                  {tipo.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOperacionalReport = () => (
    <div>
      <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Tiempo Promedio</div>
            <Clock size={24} color="#2563eb" />
          </div>
          <div className="stat-card-value">{reportData.tiempoPromedioEntrega.toFixed(1)}</div>
          <div className="stat-card-change">
            Días de entrega
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Cumplimiento</div>
            <Target size={24} color={reportData.porcentajeCumplimiento >= 80 ? "#059669" : "#f59e0b"} />
          </div>
          <div className="stat-card-value" style={{ 
            color: reportData.porcentajeCumplimiento >= 80 ? '#059669' : '#f59e0b' 
          }}>
            {reportData.porcentajeCumplimiento.toFixed(1)}%
          </div>
          <div className="stat-card-change">
            A tiempo
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Productividad</div>
            <Zap size={24} color="#7c3aed" />
          </div>
          <div className="stat-card-value" style={{ color: '#7c3aed' }}>
            {reportData.productividadDiaria.toFixed(1)}
          </div>
          <div className="stat-card-change">
            Pedidos/día
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">En Proceso</div>
            <Clock size={24} color="#f59e0b" />
          </div>
          <div className="stat-card-value" style={{ color: '#f59e0b' }}>
            {reportData.pedidosEnProceso}
          </div>
          <div className="stat-card-change">
            Pedidos activos
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        <div className="card">
          <h3 className="card-title">Cumplimiento de Entregas</h3>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: `conic-gradient(
                #059669 0deg ${(reportData.entregasAPTiempo / reportData.pedidosEntregados) * 360}deg,
                #dc2626 ${(reportData.entregasAPTiempo / reportData.pedidosEntregados) * 360}deg 360deg
              )`,
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 'bold'
              }}>
                {reportData.porcentajeCumplimiento.toFixed(0)}%
              </div>
            </div>
          </div>
          
          <div style={{ space: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#059669', borderRadius: '50%' }}></div>
                A Tiempo
              </span>
              <span style={{ fontWeight: '500' }}>{reportData.entregasAPTiempo}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#dc2626', borderRadius: '50%' }}></div>
                Tarde
              </span>
              <span style={{ fontWeight: '500' }}>{reportData.entregasTarde}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Recomendaciones</h3>
          <div style={{ space: '1rem' }}>
            {reportData.porcentajeCumplimiento < 80 && (
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #f59e0b',
                borderRadius: '0.375rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontWeight: '500', color: '#92400e', marginBottom: '0.5rem' }}>
                  Mejorar Puntualidad
                </div>
                <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                  Tu cumplimiento está por debajo del 80%. Considera optimizar procesos.
                </div>
              </div>
            )}
            
            {reportData.tiempoPromedioEntrega > 7 && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #dc2626',
                borderRadius: '0.375rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontWeight: '500', color: '#991b1b', marginBottom: '0.5rem' }}>
                  Reducir Tiempos
                </div>
                <div style={{ fontSize: '0.875rem', color: '#991b1b' }}>
                  Tiempo promedio alto. Revisa cuellos de botella en producción.
                </div>
              </div>
            )}
            
            {reportData.pedidosEnProceso > 10 && (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #2563eb',
                borderRadius: '0.375rem',
                padding: '1rem'
              }}>
                <div style={{ fontWeight: '500', color: '#1e40af', marginBottom: '0.5rem' }}>
                  Alta Demanda
                </div>
                <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                  Muchos pedidos activos. Considera aumentar capacidad.
                </div>
              </div>
            )}
            
            {reportData.porcentajeCumplimiento >= 90 && (
              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #059669',
                borderRadius: '0.375rem',
                padding: '1rem'
              }}>
                <div style={{ fontWeight: '500', color: '#065f46', marginBottom: '0.5rem' }}>
                  ¡Excelente Trabajo!
                </div>
                <div style={{ fontSize: '0.875rem', color: '#065f46' }}>
                  Mantén este nivel de cumplimiento. Considera promocionar puntualidad.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading" style={{ padding: '3rem' }}>
          <div className="spinner"></div>
          <p>Generando reporte...</p>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <BarChart3 size={64} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
          <p>No se pudieron cargar los datos del reporte</p>
        </div>
      );
    }

    switch (activeReport) {
      case 'rentabilidad':
        return renderRentabilidadReport();
      case 'productos':
        return renderProductosReport();
      case 'clientes':
        return renderClientesReport();
      case 'operacional':
        return renderOperacionalReport();
      default:
        return null;
    }
  };

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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Reportes y Análisis Avanzado
          </h2>
          <p style={{ color: '#6b7280' }}>
            Análisis profundo del rendimiento de tu negocio
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 3 meses</option>
            <option value="365">Último año</option>
          </select>
          
          <button
            onClick={exportReport}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {/* Navegación de reportes */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '0.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflowX: 'auto'
        }}>
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  backgroundColor: activeReport === report.id ? '#2563eb' : 'transparent',
                  color: activeReport === report.id ? 'white' : '#6b7280'
                }}
              >
                <Icon size={16} />
                {report.name}
              </button>
            );
          })}
        </div>
        
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          {reports.find(r => r.id === activeReport)?.description}
        </div>
      </div>

      {/* Contenido del reporte */}
      {renderContent()}
    </div>
  );
};

export default AdvancedReports;