'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colors = {
    danger: {
      button: 'bg-red-600 hover:bg-red-700 text-white',
      icon: 'bg-red-100 text-red-600',
    },
    warning: {
      button: 'bg-amber-500 hover:bg-amber-600 text-white',
      icon: 'bg-amber-100 text-amber-600',
    },
    info: {
      button: 'bg-[#1A4A8A] hover:bg-[#1A4A8A]/90 text-white',
      icon: 'bg-blue-100 text-blue-600',
    }
  };

  const activeColor = colors[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border-[0.5px] border-black/5"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="p-6">
              {/* Icon & Title */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeColor.icon}`}>
                  <AlertTriangle size={24} />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 mt-8">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98]"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-4 py-2.5 font-bold text-sm rounded-xl shadow-sm transition-all active:scale-[0.98] ${activeColor.button}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
