import React, { useState } from 'react';
import { X, Plus, Edit3, Trash2, Save, Folder } from 'lucide-react';
import { inventarioAPI } from '../../services/api';
import { useNotification } from '../Common/Notification';

const CategoryManager = ({ categories, onClose, onSuccess }) => {
  const [localCategories, setLocalCategories] = useState(categories);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });
  const [loading, setLoading] = useState(false);

  // Hook de notificaciones
  const { showSuccess, showError, showWarning, NotificationComponent } = useNotification();

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setFormData({ nombre: '', descripcion: '' });
    setShowForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      nombre: category.nombre,
      descripcion: category.descripcion || ''
    });
    setShowForm(true);
  };

  const handleDeleteCategory = async (category) => {
    // Mostrar confirmación personalizada
    const confirmMessage = `¿Estás seguro de eliminar la categoría "${category.nombre}"?\n\nEsto podría afectar los productos asociados y no se puede deshacer.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        await inventarioAPI.deleteCategoria(category.id);
        setLocalCategories(prev => prev.filter(cat => cat.id !== category.id));
        
        showSuccess(
          '¡Categoría eliminada!',
          `La categoría "${category.nombre}" ha sido eliminada exitosamente`,
          { duration: 4000 }
        );
      } catch (error) {
        console.error('Error:', error);
        
        let errorMessage = 'Error eliminando la categoría';
        if (error.response?.status === 400) {
          errorMessage = 'No se puede eliminar la categoría porque tiene productos asociados';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
        
        showError(
          'Error al eliminar',
          errorMessage,
          { duration: 6000 }
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      showWarning(
        'Formulario incompleto',
        'El nombre de la categoría es requerido',
        { duration: 4000 }
      );
      return;
    }

    // Validar que no exista otra categoría con el mismo nombre
    const nombreExiste = localCategories.some(cat => 
      cat.nombre.toLowerCase() === formData.nombre.toLowerCase() && 
      cat.id !== editingCategory?.id
    );
    
    if (nombreExiste) {
      showWarning(
        'Nombre duplicado',
        'Ya existe una categoría con ese nombre. Por favor, elige otro nombre.',
        { duration: 5000 }
      );
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editingCategory) {
        response = await inventarioAPI.updateCategoria(editingCategory.id, formData);
        setLocalCategories(prev => 
          prev.map(cat => cat.id === editingCategory.id ? response.data : cat)
        );
        showSuccess(
          '¡Categoría actualizada!',
          `La categoría "${formData.nombre}" ha sido actualizada exitosamente`,
          { duration: 4000 }
        );
      } else {
        response = await inventarioAPI.createCategoria(formData);
        setLocalCategories(prev => [...prev, response.data]);
        showSuccess(
          '¡Categoría creada!',
          `La categoría "${formData.nombre}" ha sido creada exitosamente`,
          { duration: 4000 }
        );
      }
      
      setShowForm(false);
      setFormData({ nombre: '', descripcion: '' });
      
    } catch (error) {
      console.error('Error:', error);
      
      let errorMessage = `Error ${editingCategory ? 'actualizando' : 'creando'} la categoría`;
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.nombre && error.response.data.nombre[0]) {
        errorMessage = error.response.data.nombre[0];
      }
      
      showError(
        editingCategory ? 'Error al actualizar' : 'Error al crear',
        errorMessage,
        { duration: 5000 }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onSuccess(); // Recargar categorías en el componente padre
    onClose();
  };

  return (
    <>
      {/* Componente de notificaciones */}
      {NotificationComponent}
      
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Folder size={24} color="#2563eb" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Gestión de Categorías
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleCreateCategory}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={16} />
                Nueva Categoría
              </button>
              <button
                onClick={handleClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  color: '#6b7280'
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
            {/* Formulario */}
            {showForm && (
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej: Hilos, Telas, Herramientas"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-input"
                      value={formData.descripcion}
                      onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Descripción opcional de la categoría"
                      rows="3"
                      style={{ resize: 'vertical' }}
                      disabled={loading}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      {loading ? (
                        <>
                          <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                          {editingCategory ? 'Actualizando...' : 'Creando...'}
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          {editingCategory ? 'Actualizar' : 'Crear'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowForm(false)}
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de categorías */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                Categorías Existentes ({localCategories.length})
              </h3>
              
              {localCategories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <Folder size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                  <p>No hay categorías creadas</p>
                  <button 
                    className="btn btn-primary"
                    onClick={handleCreateCategory}
                    style={{ marginTop: '1rem' }}
                  >
                    Crear Primera Categoría
                  </button>
                </div>
              ) : (
                <div style={{ space: '0.5rem' }}>
                  {localCategories.map((category) => (
                    <div key={category.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {category.nombre}
                        </div>
                        {category.descripcion && (
                          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            {category.descripcion}
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEditCategory(category)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            color: '#2563eb'
                          }}
                          title="Editar categoría"
                          disabled={loading}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            color: '#dc2626'
                          }}
                          title="Eliminar categoría"
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              <strong>💡 Consejo:</strong> Las categorías te ayudan a organizar tus productos. 
              No podrás eliminar una categoría que tenga productos asociados.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryManager;