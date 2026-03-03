import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';

const toastConfig = {
  success: {
    icon: FiCheckCircle,
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
  error: {
    icon: FiAlertCircle,
    color: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
  },
  warning: {
    icon: FiAlertTriangle,
    color: 'text-stone-400',
    border: 'border-stone-500/30',
    bg: 'bg-stone-500/10',
  },
  info: {
    icon: FiInfo,
    color: 'text-stone-400',
    border: 'border-stone-500/30',
    bg: 'bg-stone-500/10',
  },
};

const Toast = ({ id, message, type = 'info', duration = 4000, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300);
  };

  const config = toastConfig[type] || toastConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md
        bg-[#1e1e2e]/95 ${config.border}
        ${isExiting ? 'animate-slide-out' : 'animate-slide-in'}
        max-w-sm w-full pointer-events-auto
      `}
      role="alert"
    >
      <div className={`mt-0.5 ${config.color}`}>
        <Icon size={18} />
      </div>
      <p className="flex-1 text-sm text-gray-200 leading-relaxed">{message}</p>
      <button
        onClick={handleDismiss}
        className="mt-0.5 p-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Dismiss"
      >
        <FiX size={14} />
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;
