import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import './App.css';

// Importar componentes
import ProjectEstimator from './components/ProjectEstimator';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'estimator', 'admin-login', 'admin-dashboard'
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [statusChecks, setStatusChecks] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  // Verificar sesión de admin al cargar
  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        // Verificar si la sesión no ha expirado (24 horas)
        const isExpired = Date.now() - session.timestamp > 24 * 60 * 60 * 1000;
        if (!isExpired) {
          setIsAdminLoggedIn(true);
          if (currentView === 'admin-login') {
            setCurrentView('admin-dashboard');
          }
        } else {
          localStorage.removeItem('adminSession');
        }
      } catch (error) {
        localStorage.removeItem('adminSession');
      }
    }
  }, []);

  // Componente de información de debug - MEJORADO para móviles
  const DebugInfo = () => (
    <div className="fixed top-4 right-4 z-50">
      {/* Versión desktop - información completa */}
      <div className="hidden md:block bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs">
        <div>Frontend: React</div>
        <div>Backend: {isOnline ? '🟢 Online' : '🔴 Offline'}</div>
        <div>API: {API_BASE_URL}</div>
        <div>Vista: {currentView}</div>
        {isAdminLoggedIn && <div>Admin: ✅ Conectado</div>}
      </div>
      
      {/* Versión móvil - solo indicador de estado compacto */}
      <div className="md:hidden bg-black bg-opacity-60 text-white px-3 py-2 rounded-full text-xs flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <span className="text-xs">DB</span>
        {isAdminLoggedIn && <span className="text-xs">👑</span>}
      </div>
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
            <div className="text-xl font-bold">Estimador de Pagos</div>
            <div className="flex space-x-2 md:space-x-4">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-2 md:px-4 py-2 rounded-lg transition-all text-sm md:text-base ${
                  currentView === 'home' 
                    ? 'bg-white text-purple-900 font-semibold' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Inicio
              </button>
              <button
                onClick={() => setCurrentView('estimator')}
                className={`px-2 md:px-4 py-2 rounded-lg transition-all text-sm md:text-base ${
                  currentView === 'estimator' 
                    ? 'bg-white text-purple-900 font-semibold' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                📊 Estimador
              </button>
              <button
                onClick={() => {
                  if (isAdminLoggedIn) {
                    setCurrentView('admin-dashboard');
                  } else {
                    setCurrentView('admin-login');
                  }
                }}
                className={`px-2 md:px-4 py-2 rounded-lg transition-all text-sm md:text-base ${
                  currentView.includes('admin') 
                    ? 'bg-white text-purple-900 font-semibold' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                🛠️ Admin
              </button>
            </div>
          </div>
        </nav>

        {/* Contenido del Hero */}
        <div className="text-center max-w-4xl px-6">
          <motion.h1
            className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Bienvenido !
          </motion.h1>
          
          <motion.p
            className="text-lg md:text-xl lg:text-2xl mb-8 text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Estimador de proyectos con panel administrativo
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.button
              onClick={() => setCurrentView('estimator')}
              className="bg-white text-purple-900 px-6 md:px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg text-sm md:text-base"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
            >
              📊 Probar Estimador
            </motion.button>
            
            <motion.button
              onClick={() => setCurrentView('admin-login')}
              className="border-2 border-white text-white px-6 md:px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-purple-900 transition-colors text-sm md:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🛠️ Panel Admin
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
            <div className="text-3xl font-bold text-gray-800"> 100%</div>
            <div className="text-gray-600">Personalizable</div>
          </motion.div>
          
          <motion.div 
            className="bg-white p-8 rounded-xl shadow-lg"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-4xl text-green-600 mb-4">✅</div>
            <div className="text-3xl font-bold text-gray-800">Fast</div>
            <div className="text-gray-600">Performance</div>
          </motion.div>
          
          <motion.div 
            className="bg-white p-8 rounded-xl shadow-lg"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-4xl text-purple-600 mb-4">📊</div>
            <div className="text-3xl font-bold text-gray-800">Pro</div>
            <div className="text-gray-600">Estimaciones</div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );

  // Manejar login de admin
  const handleAdminLogin = (success) => {
    if (success) {
      setIsAdminLoggedIn(true);
      setCurrentView('admin-dashboard');
    }
  };

  // Manejar logout de admin
  const handleAdminLogout = () => {
    localStorage.removeItem('adminSession');
    setIsAdminLoggedIn(false);
    setCurrentView('home');
  };

  // Manejar volver atrás desde admin login
  const handleGoBackFromAdmin = () => {
    setCurrentView('home');
  };

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
    const interval = setInterval(checkBackendConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Renderizar vista según el estado actual
  const renderCurrentView = () => {
    switch (currentView) {
      case 'estimator':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ProjectEstimator />
            <div className="fixed top-4 left-4 z-50">
              <button
                onClick={() => setCurrentView('home')}
                className="bg-white text-purple-900 px-3 md:px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors text-sm md:text-base"
              >
                ← <span className="hidden sm:inline">Volver al Inicio</span><span className="sm:hidden">Volver</span>
              </button>
            </div>
          </motion.div>
        );

      case 'admin-login':
        return <AdminLogin onLogin={handleAdminLogin} onGoBack={handleGoBackFromAdmin} />;

      case 'admin-dashboard':
        return isAdminLoggedIn ? (
          <AdminDashboard onLogout={handleAdminLogout} />
        ) : (
          <AdminLogin onLogin={handleAdminLogin} onGoBack={handleGoBackFromAdmin} />
        );

      case 'home':
      default:
        return (
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
                    className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow cursor-pointer"
                    whileHover={{ y: -5 }}
                    onClick={() => setCurrentView('estimator')}
                  >
                    <div className="text-3xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold mb-3">Estimador de Proyectos</h3>
                    <p className="text-gray-600">Calcula tiempo, costos y recursos para tus proyectos</p>
                  </motion.div>
                  
                  <motion.div 
                    className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow cursor-pointer"
                    whileHover={{ y: -5 }}
                    onClick={() => setCurrentView('admin-login')}
                  >
                    <div className="text-3xl mb-4">🛠️</div>
                    <h3 className="text-xl font-semibold mb-3">Panel de Administración</h3>
                    <p className="text-gray-600">Gestiona y visualiza todas las estimaciones guardadas</p>
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
            
            {/* Call to Action */}
            <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
              <div className="max-w-4xl mx-auto text-center">
                <motion.h2
                  className="text-4xl font-bold mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  ¿Listo para estimar tu próximo proyecto?
                </motion.h2>
                <motion.p
                  className="text-xl mb-8 text-blue-100"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Obtén estimaciones precisas en minutos
                </motion.p>
                <motion.button
                  onClick={() => setCurrentView('estimator')}
                  className="bg-white text-purple-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Comenzar Ahora 🚀
                </motion.button>
              </div>
            </section>
            
            {/* Footer */}
            <footer className="bg-black text-white py-12 px-6">
              <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <div className="text-2xl font-bold mb-4">Tu Proyecto Limpio</div>
                    <p className="text-gray-400">
                      Herramientas profesionales para la estimación y gestión de proyectos web.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Características</h4>
                    <ul className="space-y-2 text-gray-400">
                      <li>• Estimaciones precisas</li>
                      <li>• Panel de administración</li>
                      <li>• Base de datos persistente</li>
                      <li>• Reportes y estadísticas</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Acceso Rápido</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => setCurrentView('estimator')}
                        className="block text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        → Crear Estimación
                      </button>
                      <button
                        onClick={() => setCurrentView('admin-login')}
                        className="block text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        → Panel Admin
                      </button>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
                  © 2025 Estimador De Proyectos. Samir Elias Dev.
                </div>
              </div>
            </footer>
          </>
        );
    }
  };

  // Render principal
  return (
    <div className="App min-h-screen">
      {/* Debug Info */}
      <DebugInfo />
      
      {/* Renderizar vista actual */}
      {renderCurrentView()}
    </div>
  );
}

export default App;