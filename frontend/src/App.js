// Añadir esto al INICIO de tu App.js (después de los imports existentes)
import ProjectEstimator from './components/ProjectEstimator';

// Añadir este estado al inicio de tu función App (después de tus estados existentes)
const [showEstimator, setShowEstimator] = useState(false);

// Reemplazar tu sección Hero actual con esto:
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

// En tu return principal, REEMPLAZA todo el contenido con esto:
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
        <motion.button
  onClick={() => window.location.href = '/estimator'}
  className="mt-4 bg-yellow-400 text-black px-6 py-3 rounded-full font-semibold hover:bg-yellow-300 transition-colors"
>
  🚀 Ir al Estimador (Temporal)
</motion.button>
        {/* Stats Section */}
        <StatsSection statusChecks={statusChecks} />
        
        {/* Main Content */}
        <section className="py-20 px-6 bg-white">
          {/* Tu contenido existente aquí */}
        </section>
        
        {/* Features Section */}
        <section className="py-20 px-6 bg-gray-900 text-white">
          {/* Tu contenido existente aquí */}
        </section>
        
        {/* Footer */}
        <footer className="bg-black text-white py-12 px-6">
          {/* Tu contenido existente aquí */}
        </footer>
      </>
    )}
  </div>
);