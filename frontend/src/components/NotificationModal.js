// frontend/src/components/NotificationModal.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationModal = ({ 
  isOpen, 
  onClose, 
  type = 'success', 
  title, 
  message, 
  autoClose = true,
  autoCloseDelay = 3000 
}) => {
  React.useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          bgColor: 'from-green-500 to-green-600',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200'
        };
      case 'error':
        return {
          icon: '❌',
          bgColor: 'from-red-500 to-red-600',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'from-yellow-500 to-yellow-600',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          borderColor: 'border-yellow-200'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          bgColor: 'from-blue-500 to-blue-600',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          icon: '✅',
          bgColor: 'from-green-500 to-green-600',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border-2 ${styles.borderColor}`}
            initial={{ scale: 0.7, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 50 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25 
            }}
          >
            {/* Header con gradiente */}
            <div className={`bg-gradient-to-r ${styles.bgColor} p-6 text-white relative`}>
              <div className="flex items-center gap-4">
                <motion.div
                  className={`w-16 h-16 ${styles.iconBg} rounded-full flex items-center justify-center`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <span className="text-3xl">{styles.icon}</span>
                </motion.div>
                <div className="flex-1">
                  <motion.h3
                    className="text-xl font-bold"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {title}
                  </motion.h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <div className="absolute inset-0 bg-white rounded-full transform translate-x-8 -translate-y-8"></div>
              </div>
              <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
                <div className="absolute inset-0 bg-white rounded-full transform -translate-x-4 translate-y-4"></div>
              </div>
            </div>

            {/* Content */}
            <motion.div
              className="p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {message}
              </p>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end">
                <motion.button
                  onClick={onClose}
                  className={`px-6 py-3 bg-gradient-to-r ${styles.bgColor} text-white rounded-lg font-semibold hover:shadow-lg transition-all`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Aceptar
                </motion.button>
              </div>
            </motion.div>

            {/* Progress bar for auto-close */}
            {autoClose && (
              <motion.div
                className={`h-1 bg-gradient-to-r ${styles.bgColor}`}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: autoCloseDelay / 1000, ease: "linear" }}
                style={{ transformOrigin: "left" }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;