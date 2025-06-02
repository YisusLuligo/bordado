// components/Common/AlertSystem.js
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Package, 
  Clock, 
  DollarSign, 
  Users,
  X,
  Bell,
  CheckCircle
} from 'lucide-react';
import { inventarioAPI, pedidosAPI, clientesAPI, finanzasAPI } from '../../services/api';

const AlertSystem = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAlerts, setShowAlerts] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  useEffect(() => {
    loadAlerts();
    // Actualizar alertas cada 5 minutos
    const interval = setInterval(loadAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      
      const [stockResponse, pedidosResponse, finanzasResponse] = await Promise.all([
        inventarioAPI.getAlertasStock(),
        pedidosAPI.getPedidos({ estado: 'en_proceso,terminado' }),
        finanzasAPI.getResumenGeneral()
      ]);

      const newAlerts = [];

      // 1. ALERTAS DE STOCK BAJO
      if (stockResponse.data && stockResponse.data.length > 0) {
        stockResponse.data.forEach(producto => {
          if (producto.cantidad_actual <= 0) {
            newAlerts.push({
              id: `stock-${producto.id}`,
              type: 'critical',
              icon: Package,
              title: 'Producto sin stock',
              message: `${producto.nombre} se quedó sin inventario`,
              priority: 'high',
              category: 'stock'
            });
          } else if (producto.necesita_restock) {
            newAlerts.push({
              id: `low-stock-${producto.id}`,
              type: 'warning',
              icon: AlertTriangle,
              title: 'Stock bajo',
              message: `${producto.nombre} tiene solo ${Math.floor(producto.cantidad_actual)} unidades`,
              priority: 'medium',
              category: 'stock'
            });
          }
        });
      }

      // 2. ALERTAS DE PEDIDOS PRÓXIMOS A VENCER
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      pedidosResponse.data.forEach(pedido => {
        const fechaEntrega = new Date(pedido.fecha_entrega_prometida);
        const diffDays = Math.ceil((fechaEntrega - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1 && diffDays >= 0 && pedido.estado !== 'entregado') {
          newAlerts.push({
            id: `pedido-urgente-${pedido.id}`,
            type: 'warning',
            icon: Clock,
            title: diffDays === 0 ? 'Entrega HOY' : 'Entrega MAÑANA',
            message: `Pedido #${pedido.id} - ${pedido.cliente_nombre}`,
            priority: 'high',
            category: 'pedidos',
            action: {
              label: 'Ver Pedido',
              onClick: () => console.log('Ir a pedido:', pedido.id)
            }
          });
        }
      });

      // 3. ALERTAS DE PAGOS PENDIENTES IMPORTANTES
      const saldosPendientes = finanzasResponse.data?.pedidos_pendientes_pago || 0;
      if (saldosPendientes > 500000) { // Más de 500k pendientes
        newAlerts.push({
          id: 'pagos-pendientes',
          type: 'info',
          icon: DollarSign,
          title: 'Pagos pendientes altos',
          message: `$${saldosPendientes.toLocaleString('es-CO')} en saldos por cobrar`,
          priority: 'medium',
          category: 'finanzas'
        });
      }

      // 4. ALERTA DE PRODUCTOS MÁS VENDIDOS (para restock preventivo)
      try {
        const ventasResponse = await finanzasAPI.getProductosMasVendidos({ dias: 7 });
        if (ventasResponse.data && ventasResponse.data.length > 0) {
          const topProduct = ventasResponse.data[0];
          // Verificar si el producto más vendido tiene bajo stock
          const stockInfo = await inventarioAPI.getProducto(topProduct.producto_id);
          if (stockInfo.data && stockInfo.data.necesita_restock) {
            newAlerts.push({
              id: `trending-${topProduct.producto_id}`,
              type: 'info',
              icon: Package,
              title: 'Producto popular bajo en stock',
              message: `${topProduct.producto_nombre} es muy vendido y necesita restock`,
              priority: 'medium',
              category: 'tendencias'
            });
          }
        }
      } catch (error) {
        // Si falla, no es crítico
        console.log('Error cargando tendencias:', error);
      }

      // Filtrar alertas ya descartadas
      const filteredAlerts = newAlerts.filter(alert => !dismissedAlerts.has(alert.id));
      
      setAlerts(filteredAlerts);
    } catch (error) {
      console.error('Error cargando alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertColor = (type) => {
    const colors = {
      critical: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' },
      warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
      info: { bg: '#eff6ff', border: '#2563eb', text: '#1e40af' },
      success: { bg: '#ecfdf5', border: '#059669', text: '#065f46' }
    };
    return colors[type] || colors.info;
  };

  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const sortedAlerts = alerts.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  if (loading && alerts.length === 0) {
    return null; // No mostrar nada mientras carga
  }

  return (
    <>
      {/* Botón de alertas flotante */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000
      }}>
        <button
          onClick={() => setShowAlerts(true)}
          style={{
            position: 'relative',
            backgroundColor: alerts.length > 0 ? '#dc2626' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          title={`${alerts.length} alertas activas`}
        >
          <Bell size={20} />
          {alerts.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#fbbf24',
              color: '#1f2937',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {alerts.length > 9 ? '9+' : alerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Panel de alertas */}
      {showAlerts && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          zIndex: 1001,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            marginTop: '4rem'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                  Alertas del Sistema
                </h3>
              </div>
              <button
                onClick={() => setShowAlerts(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  color: '#6b7280'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Resumen */}
            {alerts.length > 0 && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                  {criticalCount > 0 && (
                    <span style={{ color: '#dc2626', fontWeight: '500' }}>
                      ⚠️ {criticalCount} crítica{criticalCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span style={{ color: '#f59e0b', fontWeight: '500' }}>
                      🔔 {warningCount} importante{warningCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Lista de alertas */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {alerts.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 1rem', 
                  color: '#6b7280' 
                }}>
                  <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                  <h4 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>
                    ¡Todo está bien!
                  </h4>
                  <p style={{ fontSize: '0.875rem' }}>
                    No hay alertas que requieran tu atención en este momento.
                  </p>
                </div>
              ) : (
                <div style={{ padding: '0.5rem' }}>
                  {sortedAlerts.map((alert) => {
                    const colors = getAlertColor(alert.type);
                    const Icon = alert.icon;
                    
                    return (
                      <div key={alert.id} style={{
                        backgroundColor: colors.bg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '0.375rem',
                        padding: '1rem',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                            <Icon size={20} color={colors.border} style={{ marginTop: '0.125rem' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontWeight: '600', 
                                color: colors.text, 
                                marginBottom: '0.25rem',
                                fontSize: '0.875rem'
                              }}>
                                {alert.title}
                              </div>
                              <div style={{ 
                                fontSize: '0.875rem', 
                                color: colors.text,
                                lineHeight: '1.4'
                              }}>
                                {alert.message}
                              </div>
                              
                              {alert.action && (
                                <button
                                  onClick={alert.action.onClick}
                                  style={{
                                    marginTop: '0.5rem',
                                    backgroundColor: colors.border,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    padding: '0.25rem 0.75rem',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {alert.action.label}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              color: colors.text,
                              opacity: 0.7
                            }}
                            title="Descartar alerta"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Última actualización: {new Date().toLocaleTimeString('es-CO')}
                </span>
                <button
                  onClick={loadAlerts}
                  disabled={loading}
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertSystem;