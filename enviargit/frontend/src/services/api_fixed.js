import axios from 'axios';

// =========================================
// CONFIGURACIÓN MEJORADA DE API
// =========================================

/**
 * Detectar la URL base del API según el entorno
 */
function detectApiBaseUrl() {
  // En desarrollo
  if (process.env.NODE_ENV === 'development') {
    return process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';
  }
  
  // En producción/ejecutable
  if (process.env.REACT_APP_IS_EXECUTABLE === 'true') {
    const host = process.env.REACT_APP_BACKEND_HOST || '127.0.0.1';
    const port = process.env.REACT_APP_BACKEND_PORT || '8000';
    return `http://${host}:${port}/api`;
  }
  
  // URLs de fallback para diferentes puertos comunes
  const fallbackUrls = [
    'http://127.0.0.1:8000/api',
    'http://localhost:8000/api',
    'http://127.0.0.1:8001/api',
    'http://localhost:8001/api'
  ];
  
  return process.env.REACT_APP_API_URL || fallbackUrls[0];
}

// URL base del API
const API_BASE_URL = detectApiBaseUrl();

console.log(`🔧 API configurada en: ${API_BASE_URL}`);

// =========================================
// CONFIGURACIÓN DE AXIOS
// =========================================

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// =========================================
// INTERCEPTORES DE REQUEST
// =========================================

api.interceptors.request.use(
  (config) => {
    // Log de requests en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // Agregar timestamp para evitar cache
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

// =========================================
// INTERCEPTORES DE RESPONSE
// =========================================

// Contador de reintentos por request
const retryCount = new Map();

api.interceptors.response.use(
  (response) => {
    // Log de responses exitosas en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    
    // Limpiar contador de reintentos en respuesta exitosa
    const requestKey = `${response.config.method}-${response.config.url}`;
    retryCount.delete(requestKey);
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (!originalRequest) {
      console.error('❌ Error sin configuración de request:', error);
      return Promise.reject(error);
    }
    
    const requestKey = `${originalRequest.method}-${originalRequest.url}`;
    const maxRetries = parseInt(process.env.REACT_APP_RETRY_ATTEMPTS) || 3;
    const currentRetries = retryCount.get(requestKey) || 0;
    
    // Determinar si debemos reintentar
    const shouldRetry = (
      !originalRequest._retry && 
      currentRetries < maxRetries &&
      (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET' ||
        (error.response && [502, 503, 504].includes(error.response.status))
      )
    );
    
    if (shouldRetry) {
      originalRequest._retry = true;
      retryCount.set(requestKey, currentRetries + 1);
      
      console.warn(`⚠️ Reintentando request (${currentRetries + 1}/${maxRetries}): ${originalRequest.url}`);
      
      // Esperar antes de reintentar (backoff exponencial)
      const delay = Math.min(1000 * Math.pow(2, currentRetries), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return api(originalRequest);
    }
    
    // Limpiar contador después de agotar reintentos
    retryCount.delete(requestKey);
    
    // Mejorar mensajes de error
    let errorMessage = 'Error de conexión';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté funcionando.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'La conexión tardó demasiado. Verifica tu conexión de red.';
    } else if (error.response) {
      errorMessage = `Error del servidor: ${error.response.status} - ${error.response.statusText}`;
      
      // Log detallado del error
      console.error('❌ Error de API:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: originalRequest.url,
        method: originalRequest.method,
        data: error.response.data
      });
    } else {
      console.error('❌ Error de red:', error.message);
    }
    
    // Crear error mejorado
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.isNetworkError = !error.response;
    enhancedError.status = error.response?.status;
    
    return Promise.reject(enhancedError);
  }
);

// =========================================
// FUNCIÓN DE VERIFICACIÓN DE CONEXIÓN
// =========================================

export const checkConnection = async () => {
  try {
    console.log('🔍 Verificando conexión con backend...');
    const response = await api.get('/inventario/categorias/', { timeout: 5000 });
    console.log('✅ Conexión con backend exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión con backend:', error.message);
    return false;
  }
};

// =========================================
// FUNCIÓN DE ESPERA PARA BACKEND
// =========================================

export const waitForBackend = async (maxAttempts = 30, interval = 2000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔍 Verificando backend (${attempt}/${maxAttempts})...`);
    
    const isConnected = await checkConnection();
    
    if (isConnected) {
      console.log('✅ Backend disponible!');
      return true;
    }
    
    if (attempt < maxAttempts) {
      console.log(`⏳ Esperando ${interval/1000}s antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  console.error('❌ Backend no disponible después de todos los intentos');
  return false;
};

// =========================================
// SERVICIOS DE API (MANTENER EXISTENTES)
// =========================================

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

// =========================================
// UTILIDADES
// =========================================

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

// =========================================
// CONFIGURACIÓN DE DESARROLLO
// =========================================

// Verificar conexión al cargar el módulo en desarrollo
if (process.env.NODE_ENV === 'development') {
  checkConnection().then(isConnected => {
    if (isConnected) {
      console.log('🔗 API del frontend conectada correctamente al backend');
    } else {
      console.warn('⚠️ No se pudo conectar al backend. Verifica que esté funcionando.');
    }
  });
}

// Exportar configuración para debugging
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: api.defaults.timeout,
  isExecutable: process.env.REACT_APP_IS_EXECUTABLE === 'true',
  nodeEnv: process.env.NODE_ENV,
};

export default api;