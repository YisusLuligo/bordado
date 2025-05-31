import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  AlertTriangle,
  Package,
  Eye,
  Trash2,
  Settings
} from 'lucide-react';
import { inventarioAPI } from '../../services/api';
import ProductForm from './ProductForm';
import ProductDetail from './ProductDetail';
import CategoryManager from './CategoryManager';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  
  // Estados para modales
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' o 'edit'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [productsResponse, categoriesResponse] = await Promise.all([
        inventarioAPI.getProductos({
          categoria: selectedCategory,
          bajo_stock: showLowStock ? 'true' : undefined
        }),
        inventarioAPI.getCategorias()
      ]);
      
      setProducts(productsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (err) {
      setError('Error cargando productos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recargar inmediatamente cuando cambien otros filtros
  useEffect(() => {
    loadData();
  }, [selectedCategory, showLowStock]);

  // Filtrar productos en el frontend por búsqueda
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (product.nombre && product.nombre.toLowerCase().includes(searchLower)) ||
      (product.marca && product.marca.toLowerCase().includes(searchLower)) ||
      (product.color && product.color.toLowerCase().includes(searchLower)) ||
      (product.categoria_nombre && product.categoria_nombre.toLowerCase().includes(searchLower))
    );
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowDetail(true);
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto "${product.nombre}"?`)) {
      try {
        await inventarioAPI.deleteProducto(product.id);
        loadData(); // Recargar lista
        alert('Producto eliminado exitosamente');
      } catch (err) {
        alert('Error eliminando producto');
        console.error('Error:', err);
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadData(); // Recargar lista
  };

  const getStockStatus = (product) => {
    if (product.cantidad_actual <= 0) {
      return { text: 'Sin Stock', color: '#dc2626', bgColor: '#fef2f2' };
    } else if (product.necesita_restock) {
      return { text: 'Stock Bajo', color: '#f59e0b', bgColor: '#fffbeb' };
    } else {
      return { text: 'Stock OK', color: '#059669', bgColor: '#ecfdf5' };
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>Cargando productos...</p>
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
            Gestión de Inventario
          </h1>
          <p style={{ color: '#6b7280' }}>
            Administra productos, categorías y control de stock
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowCategoryModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Settings size={16} />
            Categorías
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleCreateProduct}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem',
          alignItems: 'end'
        }}>
          {/* Búsqueda */}
          <div>
            <label className="form-label">Buscar productos</label>
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
                placeholder="Buscar por nombre, marca o color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {/* Filtro por categoría */}
          <div>
            <label className="form-label">Categoría</label>
            <select
              className="form-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          {/* Filtro de stock bajo */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
              />
              <span className="form-label" style={{ margin: 0 }}>Solo productos bajo stock</span>
            </label>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadData}>
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de productos */}
      {filteredProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Package size={64} color="#6b7280" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>No hay productos</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {searchTerm || selectedCategory || showLowStock 
              ? 'No se encontraron productos con los filtros aplicados'
              : 'Comienza agregando tu primer producto al inventario'
            }
          </p>
          {!searchTerm && !selectedCategory && !showLowStock && (
            <button className="btn btn-primary" onClick={handleCreateProduct}>
              <Plus size={16} style={{ marginRight: '0.5rem' }} />
              Agregar Primer Producto
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          {/* Resumen */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <span style={{ color: '#6b7280' }}>
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            </span>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#059669' }}>
                ● {filteredProducts.filter(p => !p.necesita_restock && p.cantidad_actual > 0).length} Stock OK
              </span>
              <span style={{ color: '#f59e0b' }}>
                ● {filteredProducts.filter(p => p.necesita_restock).length} Stock Bajo
              </span>
              <span style={{ color: '#dc2626' }}>
                ● {filteredProducts.filter(p => p.cantidad_actual <= 0).length} Sin Stock
              </span>
            </div>
          </div>

          {/* Tabla de productos */}
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precio Compra</th>
                  <th>Precio Venta</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1f2937' }}>
                            {product.nombre}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {product.marca && `${product.marca} • `}
                            {product.color && `Color: ${product.color}`}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem'
                        }}>
                          {product.categoria_nombre}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: '500' }}>
                            {product.cantidad_actual}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Mín: {product.stock_minimo}
                          </div>
                        </div>
                      </td>
                      <td>{formatCurrency(product.precio_compra)}</td>
                      <td>{formatCurrency(product.precio_venta)}</td>
                      <td>
                        <span style={{
                          backgroundColor: stockStatus.bgColor,
                          color: stockStatus.color,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleViewProduct(product)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              color: '#6b7280'
                            }}
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              color: '#2563eb'
                            }}
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              color: '#dc2626'
                            }}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      {showForm && (
        <ProductForm
          product={selectedProduct}
          categories={categories}
          mode={formMode}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showDetail && selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setShowDetail(false)}
          onEdit={handleEditProduct}
          onReload={loadData}
        />
      )}

      {showCategoryModal && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default ProductList;