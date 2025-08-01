import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './App.css';

// Configuración de la API - CORREGIDO para soportar ambas variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 
                     process.env.NEXT_PUBLIC_API_URL || 
                     'http://localhost:8000/api/v1';

// Debug: mostrar qué URL está usando
console.log('🔧 API URL configurada:', API_BASE_URL);
console.log('🔧 Variables disponibles:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
});

// Componente de Hero animado
const Hero = () => {
  return (
    <motion.section 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="text-center max-w-4xl px-6">
        <motion.h1
          className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Tu Proyecto Limpio
        </motion.h1>
        
        <motion.p
          className="text-xl md:text-2xl mb-8 text-gray-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Sin marcas de agua, solo tu creatividad brillando
        </motion.p>
        
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.button
            className="bg-white text-purple-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
          >
            Comenzar Ahora
          </motion.button>
          
          <motion.button
            className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-purple-900 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Ver Demo
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
};

// Componente de debug para mostrar la configuración
const DebugInfo = () => {
  const [showDebug, setShowDebug] = useState(false);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-gray-800 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
      >
        🔧 Debug
      </button>
      
      {showDebug && (
        <div className="absolute bottom-12 right-0 bg-white border rounded-lg shadow-lg p-4 w-80 text-sm">
          <h4 className="font-bold mb-2">Configuración API:</h4>
          <div className="space-y-1 text-xs font-mono">
            <div>URL: <span className="text-blue-600">{API_BASE_URL}</span></div>
            <div>REACT_APP_API_URL: <span className="text-green-600">{process.env.REACT_APP_API_URL || 'undefined'}</span></div>
            <div>NEXT_PUBLIC_API_URL: <span className="text-purple-600">{process.env.NEXT_PUBLIC_API_URL || 'undefined'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de tarjeta animada
const AnimatedCard = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div
      className={`bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5 }}
    >
      {children}
    </motion.div>
  );
};

// Componente de estadísticas
const StatsSection = ({ statusChecks }) => {
  const stats = [
    { label: "Total Checks", value: statusChecks.length, icon: "📊" },
    { label: "Activos", value: statusChecks.filter(s => s.status === 'active').length, icon: "✅" },
    { label: "Clientes", value: new Set(statusChecks.map(s => s.client_name)).size, icon: "👥" },
    { label: "Última Hora", value: statusChecks.filter(s => {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return new Date(s.timestamp) > hourAgo;
    }).length, icon: "⏰" }
  ];

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-4xl font-bold text-center mb-12 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Estadísticas en Tiempo Real
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <AnimatedCard key={stat.label} delay={index * 0.1}>
              <div className="text-center">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <motion.div
                  className="text-3xl font-bold text-purple-600 mb-2"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
};

// Componente de demostración cuando no hay backend
const DemoMode = () => {
  const [demoChecks] = useState([
    {
      id: "demo-1",
      client_name: "Cliente Demo 1",
      timestamp: new Date().toISOString(),
      status: "active"
    },
    {
      id: "demo-2", 
      client_name: "Cliente Demo 2",
      timestamp: new Date(Date.now() - 60000).toISOString(),
      status: "active"
    }
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
        <p>🚧 <strong>Modo Demo:</strong> No se pudo conectar con el backend. Mostrando datos de demostración.</p>
        <p className="text-sm mt-1">API URL: {API_BASE_URL}</p>
      </div>
      
      <h3 className="text-2xl font-bold mb-6 text-gray-800">Demo - Status Checks</h3>
      <div className="space-y-4">
        {demoChecks.map((status, index) => (
          <motion.div
            key={status.id}
            className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-gray-800">{status.client_name}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(status.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center">
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  {status.status}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Componente de formulario
const StatusForm = ({ onSubmit, isLoading, hasBackend }) => {
  const [clientName, setClientName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (clientName.trim() && hasBackend) {
      onSubmit(clientName.trim());
      setClientName('');
    }
  };

  return (
    <AnimatedCard className="max-w-md mx-auto">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">Crear Status Check</h3>
      {!hasBackend && (
        <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded text-sm text-gray-600">
          📝 Funcionalidad disponible cuando el backend esté conectado
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Nombre del Cliente
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="Ingresa el nombre del cliente"
            disabled={!hasBackend}
            required
          />
        </div>
        <motion.button
          type="submit"
          disabled={isLoading || !hasBackend}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={hasBackend ? { scale: 1.02 } : {}}
          whileTap={hasBackend ? { scale: 0.98 } : {}}
        >
          {!hasBackend ? 'Backend No Disponible' : isLoading ? 'Creando...' : 'Crear Status Check'}
        </motion.button>
      </form>
    </AnimatedCard>
  );
};

// Componente de lista de status checks
const StatusList = ({ statusChecks }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <h3 className="text-2xl font-bold mb-6 text-gray-800">Status Checks Recientes</h3>
      <div className="space-y-4">
        <AnimatePresence>
          {statusChecks.slice(0, 10).map((status, index) => (
            <motion.div
              key={status.id}
              className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-800">{status.client_name}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(status.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    status.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {status.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Componente principal de la aplicación
function App() {
  const [statusChecks, setStatusChecks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasBackend, setHasBackend] = useState(true);

  const fetchStatusChecks = useCallback(async () => {
    if (!hasBackend) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/status`);
      setStatusChecks(response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      console.error('Error fetching status checks:', err);
      setError('Error al cargar los datos');
    }
  }, [hasBackend]);

  const checkBackendConnection = useCallback(async () => {
    try {
      console.log('🔄 Probando conexión a:', `${API_BASE_URL}/health`);
      const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 10000 });
      if (response.status === 200) {
        console.log('✅ Backend conectado exitosamente');
        setHasBackend(true);
        await fetchStatusChecks();
      }
    } catch (err) {
      console.warn('❌ Backend no disponible:', err.message);
      setHasBackend(false);
      setError(null);
    }
  }, [fetchStatusChecks]);

  // Cargar status checks al montar el componente
  useEffect(() => {
    checkBackendConnection();
  }, [checkBackendConnection]);

  const createStatusCheck = async (clientName) => {
    if (!hasBackend) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/status`, {
        client_name: clientName,
        status: 'active'
      });
      
      setStatusChecks(prev => [response.data, ...prev]);
    } catch (err) {
      console.error('Error creating status check:', err);
      setError('Error al crear el status check');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App min-h-screen">
      {/* Debug Info */}
      <DebugInfo />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Stats Section */}
      <StatsSection statusChecks={statusChecks} />
      
      {/* Main Content */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-4xl font-bold text-center mb-12 text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Panel de Control
          </motion.h2>
          
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-md mx-auto"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Form Section */}
            <div>
              <StatusForm 
                onSubmit={createStatusCheck} 
                isLoading={isLoading} 
                hasBackend={hasBackend}
              />
            </div>
            
            {/* List Section */}
            <div>
              {hasBackend ? (
                <StatusList statusChecks={statusChecks} />
              ) : (
                <DemoMode />
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-4xl font-bold text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Características
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🚀",
                title: "Ultra Rápido",
                description: "Construido con las últimas tecnologías para máximo rendimiento"
              },
              {
                icon: "🔒",
                title: "Completamente Seguro",
                description: "Sin dependencias externas, tu código es 100% tuyo"
              },
              {
                icon: "🎨",
                title: "Diseño Moderno",
                description: "Animaciones fluidas y diseño responsive de última generación"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="text-center p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-black text-white py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-4">Tu Proyecto Limpio</h3>
            <p className="text-gray-400 mb-4">
              Desarrollado con 💜 usando React, FastAPI y mucha creatividad
            </p>
            <div className="flex justify-center space-x-6">
              <motion.a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
              >
                GitHub
              </motion.a>
              <motion.a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
              >
                LinkedIn
              </motion.a>
              <motion.a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
              >
                Portfolio
              </motion.a>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}

export default App;