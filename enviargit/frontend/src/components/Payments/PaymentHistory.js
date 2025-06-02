import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Eye,
  Download,
  User,
  FileText,
  CheckCircle
} from 'lucide-react';
import { finanzasAPI } from '../../services/api';
import { useNotification } from '../Common/Notification';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Hook de notificaciones
  const { showSuccess, showError, showInfo, NotificationComponent } = useNotification();

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (selectedMethod) params.metodo_pago = selectedMethod;
      if (dateFrom) params.fecha_desde = dateFrom;
      if (dateTo) params.fecha_hasta = dateTo;
      
      const response = await finanzasAPI.getPagos(params);
      setPayments(response.data);
    } catch (err) {
      setError('Error cargando historial de pagos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recargar cuando cambien los filtros de fecha/método
  useEffect(() => {
    loadPayments();
  }, [selectedMethod, dateFrom, dateTo]);

  // Filtrar por búsqueda en el frontend
  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.id.toString().includes(searchLower) ||
      (payment.pedido_info?.id && payment.pedido_info.id.toString().includes(searchLower)) ||
      (payment.pedido_info?.cliente_nombre && payment.pedido_info.cliente_nombre.toLowerCase().includes(searchLower)) ||
      (payment.concepto && payment.concepto.toLowerCase().includes(searchLower)) ||
      (payment.notas && payment.notas.toLowerCase().includes(searchLower))
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

  const getPaymentMethodIcon = (method) => {
    const icons = {
      efectivo: { icon: Banknote, color: '#059669' },
      transferencia: { icon: Smartphone, color: '#2563eb' },
      tarjeta: { icon: CreditCard, color: '#7c3aed' }
    };
    return icons[method] || { icon: DollarSign, color: '#6b7280' };
  };

  const calculateTotals = () => {
    return {
      total: filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.monto), 0),
      efectivo: filteredPayments.filter(p => p.metodo_pago === 'efectivo').reduce((sum, payment) => sum + parseFloat(payment.monto), 0),
      transferencia: filteredPayments.filter(p => p.metodo_pago === 'transferencia').reduce((sum, payment) => sum + parseFloat(payment.monto), 0),
      tarjeta: filteredPayments.filter(p => p.metodo_pago === 'tarjeta').reduce((sum, payment) => sum + parseFloat(payment.monto), 0)
    };
  };

  // ⭐ ARREGLADA: Función para exportar historial
const exportReport = () => {
  if (filteredPayments.length === 0) {
    showError(
      'Sin datos para exportar',
      'No hay pagos para exportar con los filtros actuales',
      { duration: 4000 }
    );
    return;
  }

  try {
    // Preparar datos para CSV
    const csvHeaders = [
      'ID Pago',
      'Pedido #',
      'Cliente',
      'Fecha',
      'Monto',
      'Método de Pago',
      'Concepto',
      'Notas'
    ];

    const csvData = filteredPayments.map(payment => [
      payment.id,
      payment.pedido_info?.id || payment.pedido,
      payment.pedido_info?.cliente_nombre || 'Cliente no disponible',
      formatDateTime(payment.fecha_pago),
      payment.monto,
      payment.metodo_pago_display || payment.metodo_pago,
      payment.concepto,
      payment.notas || ''
    ]);

    // Crear contenido CSV
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(field => {
        // Escapar comas y comillas en los campos
        if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(','))
    ].join('\n');

    // Agregar BOM para UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Crear enlace de descarga
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Nombre de archivo con fecha
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const fileName = `historial-pagos-${timestamp}.csv`;
    link.setAttribute('download', fileName);
    
    // Simular click para descargar
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Mostrar notificación de éxito
    const totals = calculateTotals();
    showSuccess(
      '✅ Historial exportado exitosamente',
      `Se exportaron ${filteredPayments.length} pagos por un total de ${formatCurrency(totals.total)} al archivo ${fileName}`,
      { duration: 6000 }
    );

  } catch (error) {
    console.error('Error exportando:', error);
    showError(
      'Error al exportar',
      'Hubo un problema al generar el archivo. Inténtalo de nuevo.',
      { duration: 5000 }
    );
  }


    try {
      // Preparar datos para CSV
      const csvHeaders = [
        'ID Pago',
        'Pedido #',
        'Cliente',
        'Fecha',
        'Monto',
        'Método de Pago',
        'Concepto',
        'Notas'
      ];

      const csvData = filteredPayments.map(payment => [
        payment.id,
        payment.pedido_info?.id || payment.pedido,
        payment.pedido_info?.cliente_nombre || 'Cliente no disponible',
        formatDateTime(payment.fecha_pago),
        payment.monto,
        payment.metodo_pago_display || payment.metodo_pago,
        payment.concepto,
        payment.notas || ''
      ]);

      // Crear contenido CSV
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => {
          // Escapar comas y comillas en los campos
          if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        }).join(','))
      ].join('\n');

      // Agregar BOM para UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Nombre de archivo con fecha
      const now = new Date();
      const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const fileName = `historial-pagos-${timestamp}.csv`;
      link.setAttribute('download', fileName);
      
      // Simular click para descargar
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Mostrar notificación de éxito
      const totals = calculateTotals();
      showSuccess(
        '✅ Historial exportado exitosamente',
        `Se exportaron ${filteredPayments.length} pagos por un total de ${formatCurrency(totals.total)} al archivo ${fileName}`,
        { duration: 6000 }
      );

    } catch (error) {
      console.error('Error exportando:', error);
      showError(
        'Error al exportar',
        'Hubo un problema al generar el archivo. Inténtalo de nuevo.',
        { duration: 5000 }
      );
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>Cargando historial de pagos...</p>
      </div>
    );
  }

  return (
    <>
      {/* Componente de notificaciones */}
      {NotificationComponent}
      
      <div style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Historial de Pagos
          </h2>
          <p style={{ color: '#6b7280' }}>
            Registro completo de todos los pagos recibidos por pedidos
          </p>
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
                  placeholder="# pago, # pedido, cliente, concepto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Método de pago */}
            <div>
              <label className="form-label">Método de Pago</label>
              <select
                className="form-input"
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
              >
                <option value="">Todos los métodos</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
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

          {/* Botón limpiar filtros */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedMethod('');
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
            Resumen de Pagos
          </h3>
          <div className="grid grid-cols-4" style={{ gap: '1rem', textAlign: 'center' }}>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.375rem'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                {formatCurrency(totals.total)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Total ({filteredPayments.length} pagos)
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#ecfdf5',
              padding: '1rem',
              borderRadius: '0.375rem'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669' }}>
                {formatCurrency(totals.efectivo)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Efectivo
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#dbeafe',
              padding: '1rem',
              borderRadius: '0.375rem'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>
                {formatCurrency(totals.transferencia)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Transferencias
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#ede9fe',
              padding: '1rem',
              borderRadius: '0.375rem'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#7c3aed' }}>
                {formatCurrency(totals.tarjeta)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Tarjetas
              </div>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="error">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadPayments}>
              Reintentar
            </button>
          </div>
        )}

        {/* Lista de pagos */}
        {filteredPayments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <DollarSign size={64} color="#6b7280" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>No hay pagos</h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              {searchTerm || selectedMethod || dateFrom || dateTo
                ? 'No se encontraron pagos con los filtros aplicados'
                : 'No hay pagos registrados aún'
              }
            </p>
          </div>
        ) : (
          <div className="card">
            {/* Header de la tabla */}
            <div style={{ 
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <span style={{ color: '#6b7280' }}>
                {filteredPayments.length} pago{filteredPayments.length !== 1 ? 's' : ''} encontrado{filteredPayments.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Lista de pagos */}
            <div style={{ space: '1rem' }}>
              {filteredPayments.map((payment) => {
                const methodInfo = getPaymentMethodIcon(payment.metodo_pago);
                const MethodIcon = methodInfo.icon;
                
                return (
                  <div key={payment.id} style={{
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
                          <MethodIcon size={20} color={methodInfo.color} />
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                            Pago #{payment.id}
                          </h3>
                          <span style={{
                            backgroundColor: methodInfo.color + '20',
                            color: methodInfo.color,
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}>
                            {payment.metodo_pago_display || payment.metodo_pago}
                          </span>
                        </div>

                        <div className="grid grid-cols-3" style={{ gap: '1rem', marginBottom: '1rem' }}>
                          {/* Pedido relacionado */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={14} color="#6b7280" />
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                              Pedido #{payment.pedido_info?.id || payment.pedido}
                            </span>
                          </div>

                          {/* Cliente */}
                          {payment.pedido_info?.cliente_nombre && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <User size={14} color="#6b7280" />
                              <span style={{ color: '#374151', fontSize: '0.875rem' }}>
                                {payment.pedido_info.cliente_nombre}
                              </span>
                            </div>
                          )}

                          {/* Fecha */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={14} color="#6b7280" />
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                              {formatDateTime(payment.fecha_pago)}
                            </span>
                          </div>
                        </div>

                        {/* Concepto */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '0.25rem' }}>
                            {payment.concepto}
                          </div>
                          {payment.notas && (
                            <div style={{ 
                              fontSize: '0.875rem', 
                              color: '#6b7280',
                              fontStyle: 'italic'
                            }}>
                              {payment.notas}
                            </div>
                          )}
                        </div>

                        {/* Monto destacado */}
                        <div style={{
                          backgroundColor: '#f9fafb',
                          padding: '0.75rem',
                          borderRadius: '0.375rem',
                          display: 'inline-block'
                        }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669' }}>
                            {formatCurrency(payment.monto)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Monto recibido
                          </div>
                        </div>
                      </div>

                      {/* ⭐ NUEVA: Información adicional en lugar del botón roto */}
                      <div style={{ marginLeft: '1rem', textAlign: 'right' }}>
                        <div style={{
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <CheckCircle size={16} color="#059669" />
                          <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>
                            Pago Confirmado
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación o botón cargar más */}
            {filteredPayments.length > 20 && (
              <div style={{
                textAlign: 'center',
                padding: '1rem',
                borderTop: '1px solid #e5e7eb',
                marginTop: '1rem'
              }}>
                <button className="btn btn-secondary">
                  Ver más pagos
                </button>
              </div>
            )}
          </div>
        )}

        {/* ⭐ ARREGLADO: Botón exportar con funcionalidad completa */}
        {filteredPayments.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button 
              className="btn btn-primary"
              onClick={exportReport}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
            >
              <Download size={16} />
              Exportar Historial ({filteredPayments.length} pagos)
            </button>
            <div style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280', 
              marginTop: '0.5rem' 
            }}>
              📁 Se descargará un archivo CSV con todos los pagos mostrados
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PaymentHistory;