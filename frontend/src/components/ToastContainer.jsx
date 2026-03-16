import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none max-w-md w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const icons = {
    success: <CheckCircle className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  const colors = {
    success: 'border-emerald-100 bg-emerald-50/90 text-emerald-900',
    error: 'border-red-100 bg-red-50/90 text-red-900',
    warning: 'border-amber-100 bg-amber-50/90 text-amber-900',
    info: 'border-blue-100 bg-blue-50/90 text-blue-900',
  };

  return (
    <div 
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md animate-in slide-in-from-right-10 duration-300 ${colors[toast.type] || colors.info}`}
    >
      <div className="shrink-0 mt-0.5">
        {icons[toast.type] || icons.info}
      </div>
      <div className="flex-grow pt-0.5 text-sm font-bold leading-tight">
        {toast.message}
      </div>
      <button 
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
