"use client";
import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import PlayBalanceAlert from '@/components/play/PlayBalanceAlert';
import { isInsufficientBalanceAlert } from '@/lib/client/playFeedback';

// Notification context to share across components
const NotificationContext = createContext(null);

// Different notification types with their icons
const NotificationIcons = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  )
};

// Individual notification component
const NotificationItem = ({ id, type, message, onClose }) => {
  const duration = isInsufficientBalanceAlert(message) ? 9000 : 5000;

  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, onClose, duration]);

  if (isInsufficientBalanceAlert(message)) {
    return (
      <div className="mb-3 animate-slideIn pointer-events-auto">
        <PlayBalanceAlert
          have={message.have}
          need={message.need}
          more={message.more}
          symbol={message.symbol}
          hint={message.hint}
          onClose={() => onClose(id)}
        />
      </div>
    );
  }

  const text = typeof message === 'string' ? message : String(message?.message ?? '');

  return (
    <div
      className={`flex items-center justify-between p-4 mb-3 rounded-lg shadow-lg border backdrop-blur-sm animate-slideIn ${
        type === 'error'
          ? 'bg-red-950/95 border-red-500/40'
          : type === 'success'
            ? 'bg-emerald-950/95 border-emerald-500/40'
            : type === 'warning'
              ? 'bg-[#1a0a22]/95 border-amber-500/30'
              : 'bg-[#120818]/95 border-purple-500/30'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5 shrink-0 text-white/90">{NotificationIcons[type]}</span>
        <p className="text-white/90 text-sm leading-relaxed">{text}</p>
      </div>
      <button
        type="button"
        onClick={() => onClose(id)}
        className="ml-3 shrink-0 text-white/50 hover:text-white transition-colors"
        aria-label="Close notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

// The notification container
const NotificationsContainer = ({ notifications, onClose }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  if (!isMounted) return null;
  
  // Using portal to render notifications at the root level, avoiding z-index issues
  return createPortal(
    <div className="fixed top-[120px] right-4 z-[9999] w-full max-w-sm pointer-events-none">
      <style jsx global>{`
        @keyframes slideIn {
          0% { opacity: 0; transform: translateX(100%); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.3s forwards;
        }
      `}</style>
      <div className="space-y-2 pointer-events-auto">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            id={notification.id}
            type={notification.type}
            message={notification.message}
            onClose={onClose}
          />
        ))}
      </div>
    </div>,
    document.body
  );
};

// Provider component to wrap the app with
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    return id;
  };

  const closeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Utility functions for different notification types
  const success = (message) => showNotification(message, 'success');
  const error = (message) => showNotification(message, 'error');
  const warning = (message) => showNotification(message, 'warning');
  const info = (message) => showNotification(message, 'info');

  // The value we'll provide to consumers
  const value = {
    showNotification,
    closeNotification,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationsContainer 
        notifications={notifications}
        onClose={closeNotification}
      />
    </NotificationContext.Provider>
  );
}

// Hook for components to consume
export function useNotification() {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
} 