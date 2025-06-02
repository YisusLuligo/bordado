import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

const Notification = ({ 
  type = 'success', 
  title, 
  message, 
  isVisible, 
  onClose, 
  autoClose = true,
  duration = 6000 // ← CAMBIADO: De 4000 a 6000 (6 segundos)
}) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
    
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Tiempo para animación
  };

  const getNotificationStyle = () => {
    const baseStyle = {
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      zIndex: 9999,
      minWidth: '350px', // ← CAMBIADO: Más ancho para mejor lectura
      maxWidth: '450px',
      padding: '1.25rem', // ← CAMBIADO: Más padding
      borderRadius: '0.5rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      transform: show ? 'translateX(0)' : 'translateX(100%)',
      opacity: show ? 1 : 0,
      transition: 'all 0.3s ease-in-out',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem'
    };

    const typeStyles = {
      success: {
        backgroundColor: '#ecfdf5',
        border: '1px solid #a7f3d0',
        color: '#065f46'
      },
      error: {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#991b1b'
      },
      warning: {
        backgroundColor: '#fffbeb',
        border: '1px solid #fcd34d',
        color: '#92400e'
      },
      info: {
        backgroundColor: '#eff6ff',
        border: '1px solid #93c5fd',
        color: '#1e40af'
      }
    };

    return { ...baseStyle, ...typeStyles[type] };
  };

  const getIcon = () => {
    const iconProps = { size: 22 }; // ← CAMBIADO: Íconos más grandes
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} color="#059669" />;
      case 'error':
        return <XCircle {...iconProps} color="#dc2626" />;
      case 'warning':
        return <AlertCircle {...iconProps} color="#d97706" />;
      case 'info':
        return <Info {...iconProps} color="#2563eb" />;
      default:
        return <CheckCircle {...iconProps} color="#059669" />;
    }
  };

  if (!isVisible && !show) return null;

  return (
    <div style={getNotificationStyle()}>
      {getIcon()}
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{ 
            fontWeight: '600', 
            fontSize: '1rem', // ← CAMBIADO: Título más grande
            marginBottom: '0.5rem',
            lineHeight: '1.2'
          }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
          {message}
        </div>
      </div>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          color: 'inherit',
          opacity: 0.7
        }}
        onMouseEnter={(e) => e.target.style.opacity = 1}
        onMouseLeave={(e) => e.target.style.opacity = 0.7}
      >
        <X size={18} />
      </button>
    </div>
  );
};

// Hook para usar notificaciones
export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = (type, title, message, options = {}) => {
    setNotification({
      type,
      title,
      message,
      isVisible: true,
      duration: 6000, // ← CAMBIADO: Duración por defecto más larga
      ...options
    });
  };

  const hideNotification = () => {
    setNotification(prev => prev ? { ...prev, isVisible: false } : null);
  };

  const NotificationComponent = notification ? (
    <Notification
      {...notification}
      onClose={() => setNotification(null)}
    />
  ) : null;

  return {
    showSuccess: (title, message, options) => showNotification('success', title, message, options),
    showError: (title, message, options) => showNotification('error', title, message, options),
    showWarning: (title, message, options) => showNotification('warning', title, message, options),
    showInfo: (title, message, options) => showNotification('info', title, message, options),
    hideNotification,
    NotificationComponent
  };
};

export default Notification;