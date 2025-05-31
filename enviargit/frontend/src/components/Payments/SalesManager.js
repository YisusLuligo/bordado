import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ShoppingCart, 
  Search, 
  Calendar, 
  DollarSign, 
  Package,
  User,
  Eye,
  Trash2
} from 'lucide-react';
import { finanzasAPI, clientesAPI, inventarioAPI } from '../../services/api';
import SaleForm from './SaleForm';

const SalesManager = () => {
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Estados para nueva venta
  const [showNewSale, setShowNewSale] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [salesResponse, clientsResponse, productsResponse] = await Promise.all([
        finanzasAPI.getVentas(),
        clientesAPI.getResumenClientes(),
        inventarioAPI.getProductos()
      ]);
      
      setSales(salesResponse.data);
      setClients(clientsResponse.data);
      setProducts(productsResponse.data);
    } catch (err) {
      setError('Error cargando datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (selectedClient) params.cliente = selectedClient;
      if (dateFrom) params.fecha_desde = dateFrom;
      if (dateTo) params.fecha_hasta = dateTo;
      
      const response = await finanzasAPI.getVentas(params);
      setSales(response.data);
    } catch (err) {
      setError('Error cargando ventas');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recargar cuando cambien los filtros
  useEffect(() => {
    if (clients.length > 0) {
      loadSales();
    }
  }, [selectedClient, dateFrom, dateTo]);

  // Filtrar por búsqueda en el frontend
  const filteredSales = sales.filter(sale => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.id.toString().includes(searchLower) ||
      (sale.cliente_info?.nombre && sale.cliente_info.nombre.toLowerCase().includes(searchLower))
    );
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const calculateTotals = () => {
    return {
      total: filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0),
      count: filteredSales.length,
      averageTicket: filteredSales.length > 0 ? 
        filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0) / filteredSales.length : 0
    };
  };

  const handleSaleSuccess = () => {
    setShowNewSale(false);
    loadInitialData(); // Recargar todo para actualizar productos y ventas
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>Cargando ventas directas...</p>
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Ventas Directas
          </h2>
          <p style={{ color: '#6b7280' }}>
            Registro de ventas directas de productos del inventario
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowNewSale(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} />
          Nueva Venta
        </button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
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
                placeholder="# venta, cliente..."
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

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setSelectedClient('');
              setDateFrom('');
              setDateTo('');
            }}
            style={{ fontSize: '0.875rem' }}
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Resumen de totales */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
          Resumen de Ventas
        </h3>
        <div className="grid grid-cols-3" style={{ gap: '1rem', textAlign: 'center' }}>
          <div style={{
            backgroundColor: '#ecfdf5',
            padding: '1rem',
            borderRadius: '0.375rem'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669' }}>
              {formatCurrency(totals.total)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Total Vendido
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#dbeafe',
            padding: '1rem',
            borderRadius: '0.375rem'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>
              {totals.count}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Número de Ventas
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#ede9fe',
            padding: '1rem',
            borderRadius: '0.375rem'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#7c3aed' }}>
              {formatCurrency(totals.averageTicket)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Ticket Promedio
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadSales}>
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de ventas */}
      {filteredSales.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <ShoppingCart size={64} color="#6b7280" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>No hay ventas directas</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {searchTerm || selectedClient || dateFrom || dateTo
              ? 'No se encontraron ventas con los filtros aplicados'
              : 'Comienza registrando tu primera venta directa'
            }
          </p>
          {!searchTerm && !selectedClient && !dateFrom && !dateTo && (
            <button 
              className="btn btn-primary" 
              onClick={() => setShowNewSale(true)}
            >
              <Plus size={16} style={{ marginRight: '0.5rem' }} />
              Registrar Primera Venta
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          {/* Header de la lista */}
          <div style={{ 
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <span style={{ color: '#6b7280' }}>
              {filteredSales.length} venta{filteredSales.length !== 1 ? 's' : ''} encontrada{filteredSales.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Lista de ventas */}
          <div style={{ space: '1rem' }}>
            {filteredSales.map((sale) => (
              <div key={sale.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                marginBottom: '1rem',
                backgroundColor: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {/* Información principal */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <ShoppingCart size={20} color="#059669" />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                        Venta #{sale.id}
                      </h3>
                      <span style={{
                        backgroundColor: sale.pagado ? '#dcfce7' : '#fef2f2',
                        color: sale.pagado ? '#059669' : '#dc2626',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {sale.pagado ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3" style={{ gap: '1rem', marginBottom: '1rem' }}>
                      {/* Cliente */}
                      {sale.cliente_info ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User size={14} color="#6b7280" />
                          <span style={{ color: '#374151', fontSize: '0.875rem' }}>
                            {sale.cliente_info.nombre}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User size={14} color="#6b7280" />
                          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            Cliente general
                          </span>
                        </div>
                      )}

                      {/* Fecha */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} color="#6b7280" />
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          {formatDateTime(sale.fecha_venta)}
                        </span>
                      </div>

                      {/* Método de pago */}
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'capitalize' }}>
                        {sale.metodo_pago_display || sale.metodo_pago}
                      </div>
                    </div>

                    {/* Productos vendidos */}
                    {sale.detalles && sale.detalles.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                          Productos vendidos:
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {sale.detalles.map((detalle, index) => (
                            <span key={index} style={{
                              backgroundColor: '#f3f4f6',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              color: '#374151'
                            }}>
                              {detalle.producto_info?.nombre || 'Producto'} x{detalle.cantidad}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Información financiera */}
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '0.75rem',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>
                          {formatCurrency(sale.total)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          Total de la venta
                        </div>
                      </div>
                      
                      {sale.descuento > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                            -{formatCurrency(sale.descuento)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Descuento
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notas */}
                    {sale.notas && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#fffbeb',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        color: '#92400e',
                        fontStyle: 'italic'
                      }}>
                        {sale.notas}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                    <button
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para nueva venta */}
      {showNewSale && (
        <SaleForm
          clients={clients}
          products={products}
          onSuccess={handleSaleSuccess}
          onCancel={() => setShowNewSale(false)}
        />
      )}
    </div>
  );
};

export default SalesManager;