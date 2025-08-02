import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
                     process.env.NEXT_PUBLIC_API_URL || 
                     'http://localhost:8000/api/v1';

const ProjectEstimator = () => {
  const [project, setProject] = useState({
    name: '',
    type: 'location-app',
    complexity: 'medium',
    features: {
      authentication: true,
      database: true,
      api: true,
      responsive: true,
      realtime: false,
      payments: false,
      maps: true,
      cms: false,
      search: true,
      deployment: true,
      cors: true,
      docker: true
    },
    team: {
      frontend: 1,
      backend: 1,
      designer: 0,
      qa: 0
    },
    hourlyRate: 50
  });

  const [estimates, setEstimates] = useState({
    hours: 0,
    weeks: 0,
    cost: 0,
    breakdown: {}
  });

  const [savedEstimates, setSavedEstimates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Base hours por tipo de proyecto
  const baseHours = {
    'landing': 40,
    'web-app': 180,
    'location-app': 220,
    'e-commerce': 300,
    'enterprise': 500,
    'mobile-app': 350
  };

  // Multiplicadores por complejidad
  const complexityMultipliers = {
    'simple': 0.7,
    'medium': 1.0,
    'complex': 1.5,
    'enterprise': 2.0
  };

  // Horas adicionales por feature
  const featureHours = {
    authentication: 32,
    database: 28,
    api: 36,
    responsive: 16,
    realtime: 48,
    payments: 64,
    maps: 32,
    cms: 80,
    search: 16,
    deployment: 24,
    cors: 8,
    docker: 16
  };

  const calculateEstimates = () => {
    const base = baseHours[project.type];
    const complexityMultiplier = complexityMultipliers[project.complexity];
    
    const featuresTotal = Object.entries(project.features)
      .filter(([key, value]) => value)
      .reduce((total, [key]) => total + featureHours[key], 0);
    
    const totalDevHours = (base + featuresTotal) * complexityMultiplier;
    
    const breakdown = {
      frontend: Math.round(totalDevHours * 0.4),
      backend: Math.round(totalDevHours * 0.4),
      design: Math.round(totalDevHours * 0.1),
      qa: Math.round(totalDevHours * 0.1)
    };

    const totalHours = 
      (breakdown.frontend * project.team.frontend) +
      (breakdown.backend * project.team.backend) +
      (breakdown.design * project.team.designer) +
      (breakdown.qa * project.team.qa);

    const weeks = Math.ceil(totalHours / (40 * Math.max(Object.values(project.team).reduce((a, b) => a + b, 0), 1)));
    const cost = totalHours * project.hourlyRate;

    setEstimates({
      hours: totalHours,
      weeks,
      cost,
      breakdown
    });
  };

  useEffect(() => {
    calculateEstimates();
  }, [project]);

  // Cargar estimaciones guardadas
  useEffect(() => {
    fetchSavedEstimates();
  }, []);

  const fetchSavedEstimates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/estimates`);
      setSavedEstimates(response.data);
    } catch (error) {
      console.log('Error fetching estimates:', error);
    }
  };

  const saveEstimate = async () => {
    if (!project.name.trim()) {
      alert('Por favor ingresa un nombre para el proyecto');
      return;
    }

    setIsLoading(true);
    try {
      const estimateData = {
        project_name: project.name,
        project_type: project.type,
        complexity: project.complexity,
        features: project.features,
        team: project.team,
        hourly_rate: project.hourlyRate,
        estimated_hours: estimates.hours,
        estimated_weeks: estimates.weeks,
        estimated_cost: estimates.cost,
        breakdown: estimates.breakdown
      };

      await axios.post(`${API_BASE_URL}/estimates`, estimateData);
      await fetchSavedEstimates();
      alert('Estimación guardada exitosamente!');
    } catch (error) {
      console.error('Error saving estimate:', error);
      alert('Error al guardar la estimación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureChange = (feature) => {
    setProject(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }));
  };

  const handleTeamChange = (role, value) => {
    setProject(prev => ({
      ...prev,
      team: {
        ...prev.team,
        [role]: Math.max(0, parseInt(value) || 0)
      }
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <motion.div 
        className="bg-white rounded-xl shadow-2xl p-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-2xl">📊</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Estimador de Proyectos</h1>
            <p className="text-gray-600">Calcula tiempo, costos y recursos para tus proyectos web</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Panel de Configuración */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Nombre del Proyecto
              </label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => setProject(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ej: TeloApp v2.0"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tipo de Proyecto
              </label>
              <select
                value={project.type}
                onChange={(e) => setProject(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="landing">Landing Page</option>
                <option value="web-app">Aplicación Web</option>
                <option value="location-app">App de Ubicaciones (como TeloApp)</option>
                <option value="e-commerce">E-commerce</option>
                <option value="enterprise">Sistema Empresarial</option>
                <option value="mobile-app">Aplicación Móvil</option>
              </select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Complejidad
              </label>
              <select
                value={project.complexity}
                onChange={(e) => setProject(prev => ({ ...prev, complexity: e.target.value }))}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="simple">Simple</option>
                <option value="medium">Medio</option>
                <option value="complex">Complejo</option>
                <option value="enterprise">Empresarial</option>
              </select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Funcionalidades
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(featureHours).map(([feature, hours]) => {
                  const displayName = {
                    authentication: 'Autenticación (OAuth2)',
                    database: 'Base de Datos',
                    api: 'API REST',
                    responsive: 'Diseño Responsive',
                    realtime: 'Tiempo Real',
                    payments: 'Pagos',
                    maps: 'Mapas (Google Maps)',
                    cms: 'CMS',
                    search: 'Búsqueda',
                    deployment: 'Deployment',
                    cors: 'CORS Config',
                    docker: 'Docker'
                  }[feature] || feature;
                  
                  return (
                    <motion.label 
                      key={feature} 
                      className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      <input
                        type="checkbox"
                        checked={project.features[feature]}
                        onChange={() => handleFeatureChange(feature)}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 flex-1">
                        {displayName} <span className="text-blue-600 font-medium">(+{hours}h)</span>
                      </span>
                    </motion.label>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Equipo de Trabajo
              </label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(project.team).map(([role, count]) => (
                  <div key={role}>
                    <label className="block text-xs text-gray-600 mb-2 capitalize font-medium">
                      {role === 'qa' ? 'QA Tester' : role}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={count}
                      onChange={(e) => handleTeamChange(role, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tarifa por Hora (USD)
              </label>
              <input
                type="number"
                value={project.hourlyRate}
                onChange={(e) => setProject(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </motion.div>
          </div>

          {/* Panel de Resultados */}
          <div className="space-y-6">
            <motion.div 
              className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-8 text-white"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold mb-6">Estimación del Proyecto</h2>
              {project.name && (
                <p className="text-blue-100 mb-6 text-lg">"{project.name}"</p>
              )}
              
              <div className="grid grid-cols-3 gap-6">
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-4xl mb-2">⏱️</div>
                  <div className="text-3xl font-bold">{estimates.hours}</div>
                  <div className="text-sm text-blue-100">Horas</div>
                </motion.div>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-4xl mb-2">📅</div>
                  <div className="text-3xl font-bold">{estimates.weeks}</div>
                  <div className="text-sm text-blue-100">Semanas</div>
                </motion.div>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-4xl mb-2">💰</div>
                  <div className="text-3xl font-bold">${estimates.cost.toLocaleString()}</div>
                  <div className="text-sm text-blue-100">Total</div>
                </motion.div>
              </div>

              <motion.button
                onClick={saveEstimate}
                disabled={isLoading || !project.name.trim()}
                className="w-full mt-6 bg-white text-purple-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Guardando...' : 'Guardar Estimación'}
              </motion.button>
            </motion.div>

            <motion.div 
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Desglose por Área</h3>
              <div className="space-y-4">
                {Object.entries(estimates.breakdown).map(([area, hours]) => (
                  <div key={area} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        area === 'frontend' ? 'bg-green-500' :
                        area === 'backend' ? 'bg-blue-500' :
                        area === 'design' ? 'bg-purple-500' : 'bg-orange-500'
                      }`}></div>
                      <span className="capitalize text-gray-700 font-medium">
                        {area === 'qa' ? 'QA' : area}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800">{hours}h</div>
                      <div className="text-sm text-gray-500">
                        ${(hours * project.hourlyRate).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              className="bg-yellow-50 border border-yellow-200 rounded-xl p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h4 className="font-semibold text-yellow-800 mb-3">💡 Recomendaciones Basadas en tu Stack</h4>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li>• Añade 20% de buffer para imprevistos</li>
                <li>• Spring Boot + React: Stack probado y eficiente</li>
                {project.features.authentication && (
                  <li>• OAuth2 + Spring Security: configuración adicional de 8h</li>
                )}
                {project.features.maps && (
                  <li>• Google Maps API: considera límites de cuota y optimización</li>
                )}
                {project.features.deployment && (
                  <li>• Render + Vercel: deployment automático configurado</li>
                )}
                {project.type === 'location-app' && (
                  <li>• App de ubicaciones: considera geolocalización y rendimiento</li>
                )}
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Estimaciones Guardadas */}
      {savedEstimates.length > 0 && (
        <motion.div 
          className="bg-white rounded-xl shadow-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Estimaciones Guardadas</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedEstimates.slice(0, 6).map((estimate, index) => (
              <motion.div
                key={estimate.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <h4 className="font-semibold text-gray-800 mb-2">{estimate.project_name}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Tipo: <span className="font-medium">{estimate.project_type}</span></div>
                  <div>Horas: <span className="font-medium">{estimate.estimated_hours}</span></div>
                  <div>Costo: <span className="font-medium text-green-600">${estimate.estimated_cost?.toLocaleString()}</span></div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(estimate.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProjectEstimator;