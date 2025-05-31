import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  ShoppingCart, 
  CreditCard,
  Calendar,
  Filter,
  Download,
  Eye,
  Plus
} from 'lucide-react';
import { finanzasAPI, pedidosAPI } from '../../services/api';
import FinancialDashboard from './FinancialDashboard';
import PaymentHistory from './PaymentHistory';
import SalesManager from './SalesManager';
import InventoryMovements from './InventoryMovements';

const PaymentList = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const tabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: BarChart3,
      component: FinancialDashboard,
      description: 'Resumen financiero y métricas principales'
    },
    {
      id: 'payments',
      name: 'Historial de Pagos',
      icon: DollarSign,
      component: PaymentHistory,
      description: 'Todos los pagos de pedidos registrados'
    },
    {
      id: 'sales',
      name: 'Ventas Directas',
      icon: ShoppingCart,
      component: SalesManager,
      description: 'Ventas directas de productos del inventario'
    },
    {
      id: 'movements',
      name: 'Movimientos',
      icon: TrendingUp,
      component: InventoryMovements,
      description: 'Movimientos de inventario y stock'
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || FinancialDashboard;
  const activeTabInfo = tabs.find(tab => tab.id === activeTab);

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          Sistema Financiero
        </h1>
        <p style={{ color: '#6b7280' }}>
          Gestiona pagos, ventas, reportes y análisis financiero de tu negocio
        </p>
      </div>

      {/* Tabs Navigation */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '0.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflowX: 'auto'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
                  backgroundColor: activeTab === tab.id ? '#2563eb' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#6b7280'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.color = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
              >
                <Icon size={16} />
                {tab.name}
              </button>
            );
          })}
        </div>
        
        {/* Tab Description */}
        {activeTabInfo && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            color: '#64748b'
          }}>
            {activeTabInfo.description}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ minHeight: '500px' }}>
        <ActiveComponent />
      </div>
    </div>
  );
};

export default PaymentList;