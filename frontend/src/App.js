import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import './App.css';

// Importar el componente ProjectEstimator
import ProjectEstimator from './components/ProjectEstimator';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

function App() {
  const [showEstimator, setShowEstimator] = useState(false);
  const [statusChecks, setStatusChecks] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  // Componente de información de debug
  const DebugInfo = () => (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs z-50">
      <div>Frontend: React</div>
      <div>Backend: {isOnline ? '🟢 Online' : '🔴 Offline'}</div>
      <div>API: {API_BASE_URL}</div>
    </div>
  );

  // Componente Hero
  const Hero = () => {
    return (
      <motion.section 
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800 text-white relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Navegación superior */}
        <nav className="absolute top-0 left-0 right-0 z-50 p-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="text-xl font-bold">Tu Proyecto Limpio</div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowEstimator(false)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  !showEstimator 
                    ? 'bg-white text-purple-900 font-semibold' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Inicio
              </button>
              <button
                onClick={() => setShowEstimator(true)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  showEstimator 
                    ? 'bg-white text-purple-900 font-semibold' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                📊 Estimador
              </button>
            </div>
          </div>
        </nav>

        {/* Contenido del Hero */}
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
              onClick={() => setShowEstimator(true)}
              className="bg-white text-purple-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
            >
              📊 Probar Estimador
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

  // Componente de estadísticas
  const StatsSection = ({ statusChecks }) => (
    <motion.section 
      className="py-20 px-6 bg-gray-100"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-12">
          Estadísticas del Sistema
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            className="bg-white p-8 rounded-xl shadow-lg"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-4xl text-blue-600 mb-4">🚀</div>
            <div className="text-3xl font-bold text-gray-800">{statusChecks.length}</div>
            <div className="text-gray-600">Checks Realizados</div>
          </motion.div>
          
          <motion.div 
            className="bg-white p-8 rounded-xl shadow-lg"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-4xl text-green-600 mb-4">✅</div>
            <div className="text-3xl font-bold text-gray-800">100%</div>
            <div className="text-gray-600">Sin Marcas de Agua</div>
          </motion.div>
          
          <motion.div 
            className="bg-white p-8 rounded-xl shadow-lg"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-4xl text-purple-600 mb-4">⚡</div>
            <div className="text-3xl font-bold text-gray-800">Fast</div>
            <div className="text-gray-600">Performance</div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );

  // Verificar conexión al backend
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        setIsOnline(true);
        console.log('Backend conectado:', response.data);
      } catch (error) {
        setIsOnline(false);
        console.log('Backend desconectado');
      }
    };

    checkBackendConnection();
    // Verificar cada 30 segundos
    const interval = setInterval(checkBackendConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Render principal
  return (
    <div className="App min-h-screen">
      {/* Debug Info */}
      <DebugInfo />
      
      {/* Contenido principal con condicional */}
      {showEstimator ? (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ProjectEstimator />
          {/* Botón para volver */}
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setShowEstimator(false)}
              className="bg-white text-purple-900 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
            >
              ← Volver al Inicio
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Hero Section */}
          <Hero />
          
          {/* Stats Section */}
          <StatsSection statusChecks={statusChecks} />
          
          {/* Main Content */}
          <section className="py-20 px-6 bg-white">
            <div className="max-w-6xl mx-auto text-center">
              <motion.h2
                className="text-4xl font-bold text-gray-800 mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Características Principales
              </motion.h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <motion.div 
                  className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
                  whileHover={{ y: -5 }}
                >
                  <div className="text-3xl mb-4">🎨</div>
                  <h3 className="text-xl font-semibold mb-3">Diseño Limpio</h3>
                  <p className="text-gray-600">Interfaz moderna sin distracciones ni marcas de agua</p>
                </motion.div>
                
                <motion.div 
                  className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
                  whileHover={{ y: -5 }}
                >
                  <div className="text-3xl mb-4">⚡</div>
                  <h3 className="text-xl font-semibold mb-3">Alto Rendimiento</h3>
                  <p className="text-gray-600">Optimizado para velocidad y experiencia de usuario</p>
                </motion.div>
                
                <motion.div 
                  className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
                  whileHover={{ y: -5 }}
                >
                  <div className="text-3xl mb-4">🔧</div>
                  <h3 className="text-xl font-semibold mb-3">Completamente Personalizable</h3>
                  <p className="text-gray-600">100% código propio, modifica como necesites</p>
                </motion.div>
              </div>
            </div>
          </section>
          
          {/* Features Section */}
          <section className="py-20 px-6 bg-gray-900 text-white">
            <div className="max-w-6xl mx-auto text-center">
              <motion.h2
                className="text-4xl font-bold mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Tecnologías Utilizadas
              </motion.h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { name: 'React', icon: '⚛️' },
                  { name: 'FastAPI', icon: '🐍' },
                  { name: 'MongoDB', icon: '🍃' },
                  { name: 'Tailwind', icon: '🎨' }
                ].map((tech, index) => (
                  <motion.div
                    key={tech.name}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="text-4xl mb-3">{tech.icon}</div>
                    <div className="font-semibold">{tech.name}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Footer */}
          <footer className="bg-black text-white py-12 px-6">
            <div className="max-w-6xl mx-auto text-center">
              <div className="text-2xl font-bold mb-4">Tu Proyecto Limpio</div>
              <p className="text-gray-400 mb-6">Construido con tecnologías modernas</p>
              <div className="text-sm text-gray-500">
                © 2024 Tu Proyecto. Completamente libre de marcas de agua.
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;