import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  Edit3,
  Eye,
  Trash2,
  Star,
  Building,
  User
} from 'lucide-react';
import { clientesAPI } from '../../services/api';
import ClientForm from './ClientForm';
import ClientDetail from './ClientDetail';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  // Estados para modales
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formMode, setFormMode] = useState('create');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await clientesAPI.getClientes({
        tipo: selectedType,
        activo: showActiveOnly ? 'true' : undefined
      });
      
      setClients(response.data);
    } catch (err) {
      setError('Error cargando clientes');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recargar inmediatamente cuando cambien otros filtros
  useEffect(() => {
    loadClients();
  }, [selectedType, showActiveOnly]);

  // Filtrar clientes en el frontend por búsqueda
  const filteredClients = clients.filter(client => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (client.nombre && client.nombre.toLowerCase().includes(searchLower)) ||
      (client.telefono && client.telefono.toLowerCase().includes(searchLower)) ||
      (client.email && client.email.toLowerCase().includes(searchLower))
    );
  });

  const handleCreateClient = () => {
    setSelectedClient(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowDetail(true);
  };

  const handleDeleteClient = async (client) => {
    if (window.confirm(`¿Estás seguro de eliminar el cliente "${client.nombre}"?`)) {
      try {
        await clientesAPI.deleteCliente(client.id);
        loadClients();
        alert('Cliente eliminado exitosamente');
      } catch (err) {
        alert('Error eliminando cliente');
        console.error('Error:', err);
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadClients();
  };

  const getClientTypeInfo = (tipo) => {
    const types = {
      particular: { 
        label: 'Particular', 
        color: '#6b7280', 
        bgColor: '#f3f4f6',
        icon: User 
      },
      empresa: { 
        label: 'Empresa', 
        color: '#2563eb', 
        bgColor: '#dbeafe',
        icon: Building 
      },
      mayorista: { 
        label: 'Mayorista', 
        color: '#7c3aed', 
        bgColor: '#ede9fe',
        icon: Star 
      }
    };
    return types[tipo] || types.particular;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>Cargando clientes...</p>
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
            Gestión de Clientes
          </h1>
          <p style={{ color: '#6b7280' }}>
            Administra tu base de clientes y sus tipos de descuentos
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleCreateClient}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} />
          Nuevo Cliente
        </button>
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
            <label className="form-label">Buscar clientes</label>
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
                placeholder="Buscar por nombre, teléfono o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {/* Filtro por tipo */}
          <div>
            <label className="form-label">Tipo de Cliente</label>
            <select
              className="form-input"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="particular">Particular</option>
              <option value="empresa">Empresa</option>
              <option value="mayorista">Mayorista</option>
            </select>
          </div>

          {/* Filtro de activos */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
              />
              <span className="form-label" style={{ margin: 0 }}>Solo clientes activos</span>
            </label>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadClients}>
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de clientes */}
      {filteredClients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Users size={64} color="#6b7280" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>No hay clientes</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {searchTerm || selectedType || !showActiveOnly 
              ? 'No se encontraron clientes con los filtros aplicados'
              : 'Comienza agregando tu primer cliente'
            }
          </p>
          {!searchTerm && !selectedType && showActiveOnly && (
            <button className="btn btn-primary" onClick={handleCreateClient}>
              <Plus size={16} style={{ marginRight: '0.5rem' }} />
              Agregar Primer Cliente
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
              {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
            </span>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#6b7280' }}>
                ● {filteredClients.filter(c => c.tipo_cliente === 'particular').length} Particulares
              </span>
              <span style={{ color: '#2563eb' }}>
                ● {filteredClients.filter(c => c.tipo_cliente === 'empresa').length} Empresas
              </span>
              <span style={{ color: '#7c3aed' }}>
                ● {filteredClients.filter(c => c.tipo_cliente === 'mayorista').length} Mayoristas
              </span>
            </div>
          </div>

          {/* Grid de clientes */}
          <div className="grid grid-cols-1" style={{ gap: '1rem' }}>
            {filteredClients.map((client) => {
              const typeInfo = getClientTypeInfo(client.tipo_cliente);
              const TypeIcon = typeInfo.icon;
              
              return (
                <div key={client.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* Información principal */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <TypeIcon size={20} color={typeInfo.color} />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                          {client.nombre}
                        </h3>
                        <span style={{
                          backgroundColor: typeInfo.bgColor,
                          color: typeInfo.color,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {typeInfo.label}
                        </span>
                        {client.descuento_especial > 0 && (
                          <span style={{
                            backgroundColor: '#dcfce7',
                            color: '#059669',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            {client.descuento_especial}% Descuento
                          </span>
                        )}
                        {!client.activo && (
                          <span style={{
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            Inactivo
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3" style={{ gap: '1rem', marginBottom: '1rem' }}>
                        {/* Teléfono */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Phone size={16} color="#6b7280" />
                          <span style={{ color: '#374151', fontSize: '0.875rem' }}>
                            {client.telefono}
                          </span>
                        </div>

                        {/* Email */}
                        {client.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={16} color="#6b7280" />
                            <span style={{ color: '#374151', fontSize: '0.875rem' }}>
                              {client.email}
                            </span>
                          </div>
                        )}

                        {/* Fecha de registro */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            Cliente desde: {formatDate(client.fecha_registro)}
                          </span>
                        </div>
                      </div>

                      {/* Dirección */}
                      {client.direccion && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem' }}>
                          <MapPin size={16} color="#6b7280" style={{ marginTop: '0.125rem' }} />
                          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            {client.direccion}
                          </span>
                        </div>
                      )}

                      {/* Notas */}
                      {client.notas && (
                        <div style={{
                          backgroundColor: '#f9fafb',
                          padding: '0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          color: '#374151',
                          fontStyle: 'italic'
                        }}>
                          {client.notas}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewClient(client);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          color: '#6b7280',
                          borderRadius: '0.375rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClient(client);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          color: '#2563eb',
                          borderRadius: '0.375rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#dbeafe';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClient(client);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          color: '#dc2626',
                          borderRadius: '0.375rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modales */}
      {showForm && (
        <ClientForm
          client={selectedClient}
          mode={formMode}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showDetail && selectedClient && (
        <ClientDetail
          client={selectedClient}
          onClose={() => setShowDetail(false)}
          onEdit={handleEditClient}
          onReload={loadClients}
        />
      )}
    </div>
  );
};

export default ClientList;