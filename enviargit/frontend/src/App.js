import React, { useState } from 'react';
import { 
  Home, 
  Package, 
  Users, 
  ClipboardList, 
  DollarSign, 
  Menu,
  X
} from 'lucide-react';

// Importar componentes reales
import Dashboard from './components/Dashboard/Dashboard';
import ProductList from './components/Products/ProductList';
import ClientList from './components/Clients/ClientList';
import OrderList from './components/Orders/OrderList';
import PaymentList from './components/Payments/PaymentList';



function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, component: Dashboard },
    { id: 'products', name: 'Inventario', icon: Package, component: ProductList },
    { id: 'clients', name: 'Clientes', icon: Users, component: ClientList },
    { id: 'orders', name: 'Pedidos', icon: ClipboardList, component: OrderList },
    { id: 'payments', name: 'Finanzas', icon: DollarSign, component: PaymentList },
  ];

  const ActiveComponent = navigation.find(item => item.id === activeTab)?.component || Dashboard;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        
        {/* Logo y header */}
        <div className="sidebar-header">
          <Package size={32} color="#2563eb" />
          <h1>Bordados Pro</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: window.innerWidth <= 768 ? 'block' : 'none'
            }}
          >
            <X size={24} color="#6b7280" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              >
                <Icon size={20} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            display: window.innerWidth <= 768 ? 'block' : 'none'
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="main-content">
        {/* Top header */}
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                marginRight: '0.5rem',
                display: window.innerWidth <= 768 ? 'block' : 'none'
              }}
            >
              <Menu size={24} color="#6b7280" />
            </button>
            <h2>
              {navigation.find(item => item.id === activeTab)?.name || 'Dashboard'}
            </h2>
          </div>
          
          {/* Indicador de conexión */}
          <div className="connection-status">
            <div className="status-dot"></div>
            <span className="status-text">Conectado</span>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}

export default App;