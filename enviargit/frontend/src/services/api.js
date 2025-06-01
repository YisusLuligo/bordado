import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// === SERVICIOS DE INVENTARIO ===
export const inventarioAPI = {
  // Categorías
  getCategorias: () => api.get('/inventario/categorias/'),
  createCategoria: (data) => api.post('/inventario/categorias/', data),
  updateCategoria: (id, data) => api.put(`/inventario/categorias/${id}/`, data),
  deleteCategoria: (id) => api.delete(`/inventario/categorias/${id}/`),

  // Productos
  getProductos: (params = {}) => api.get('/inventario/productos/', { params }),
  getProducto: (id) => api.get(`/inventario/productos/${id}/`),
  createProducto: (data) => api.post('/inventario/productos/', data),
  updateProducto: (id, data) => api.put(`/inventario/productos/${id}/`, data),
  deleteProducto: (id) => api.delete(`/inventario/productos/${id}/`),
  getAlertasStock: () => api.get('/inventario/productos/alertas_stock/'),
  ajustarStock: (id, data) => api.post(`/inventario/productos/${id}/ajustar_stock/`, data),
};

// === SERVICIOS DE CLIENTES ===
export const clientesAPI = {
  getClientes: (params = {}) => api.get('/clientes/clientes/', { params }),
  getCliente: (id) => api.get(`/clientes/clientes/${id}/`),
  createCliente: (data) => api.post('/clientes/clientes/', data),
  updateCliente: (id, data) => api.put(`/clientes/clientes/${id}/`, data),
  deleteCliente: (id) => api.delete(`/clientes/clientes/${id}/`),
  getResumenClientes: () => api.get('/clientes/clientes/resumen/'),
  getEstadisticasClientes: () => api.get('/clientes/clientes/estadisticas/'),
  getHistorialPedidos: (id) => api.get(`/clientes/clientes/${id}/historial_pedidos/`),
};

// === SERVICIOS DE PEDIDOS ===
export const pedidosAPI = {
  getPedidos: (params = {}) => api.get('/pedidos/pedidos/', { params }),
  getPedido: (id) => api.get(`/pedidos/pedidos/${id}/`),
  createPedido: (data) => api.post('/pedidos/pedidos/', data),
  updatePedido: (id, data) => api.put(`/pedidos/pedidos/${id}/`, data),
  deletePedido: (id) => api.delete(`/pedidos/pedidos/${id}/`),
  getDashboardPedidos: () => api.get('/pedidos/pedidos/dashboard/'),
  cambiarEstado: (id, data) => api.post(`/pedidos/pedidos/${id}/cambiar_estado/`, data),
  agregarPago: (id, data) => api.post(`/pedidos/pedidos/${id}/agregar_pago/`, data),
};

// === SERVICIOS DE FINANZAS ===
export const finanzasAPI = {
  // Pagos de pedidos
  getPagos: (params = {}) => api.get('/finanzas/pagos-pedidos/', { params }),
  createPago: (data) => api.post('/finanzas/pagos-pedidos/', data),
  updatePago: (id, data) => api.put(`/finanzas/pagos-pedidos/${id}/`, data),
  deletePago: (id) => api.delete(`/finanzas/pagos-pedidos/${id}/`),

  // Ventas directas
  getVentas: (params = {}) => api.get('/finanzas/ventas-directas/', { params }),
  createVenta: (data) => api.post('/finanzas/ventas-directas/', data),

  // Dashboard financiero
  getResumenGeneral: () => api.get('/finanzas/dashboard/resumen_general/'),
  getProductosMasVendidos: (params = {}) => api.get('/finanzas/dashboard/productos_mas_vendidos/', { params }),
  getIngresosPorPeriodo: (params = {}) => api.get('/finanzas/dashboard/ingresos_por_periodo/', { params }),

  // Movimientos de inventario
  getMovimientos: (params = {}) => api.get('/finanzas/movimientos-inventario/', { params }),
};

// === UTILIDADES ===
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Estados de pedidos con colores para la UI
export const ESTADOS_PEDIDO = {
  recibido: { label: 'Recibido', color: 'blue', bgColor: 'bg-blue-100' },
  en_diseno: { label: 'En Diseño', color: 'yellow', bgColor: 'bg-yellow-100' },
  aprobado: { label: 'Aprobado', color: 'green', bgColor: 'bg-green-100' },
  en_proceso: { label: 'En Proceso', color: 'orange', bgColor: 'bg-orange-100' },
  terminado: { label: 'Terminado', color: 'purple', bgColor: 'bg-purple-100' },
  entregado: { label: 'Entregado', color: 'green', bgColor: 'bg-green-200' },
  cancelado: { label: 'Cancelado', color: 'red', bgColor: 'bg-red-100' },
};

// Tipos de cliente con descuentos
export const TIPOS_CLIENTE = {
  particular: { label: 'Particular', color: 'gray' },
  empresa: { label: 'Empresa', color: 'blue' },
  mayorista: { label: 'Mayorista', color: 'purple' },
};

export default api;