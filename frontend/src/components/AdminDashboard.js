import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const AdminDashboard = ({ onLogout }) => {
  const [estimates, setEstimates] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEstimates();
    fetchStats();
  }, []);

  const fetchEstimates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/estimates?limit=100`);
      setEstimates(response.data || []);
    } catch (error) {
      console.error('Error fetching estimates:', error);
      setEstimates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/estimates-stats/summary`);
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({});
    }
  };

  const deleteEstimate = async (estimateId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta estimación?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/estimates/${estimateId}`);
      await fetchEstimates();
      await fetchStats();
      setSelectedEstimate(null);
    } catch (error) {
      console.error('Error deleting estimate:', error);
      alert('Error al eliminar la estimación');
    }
  };

  // Filtrar y ordenar estimaciones
  const filteredEstimates = estimates
    .filter(est => {
      if (filter !== 'all' && est.project_type !== filter) return false;
      if (searchTerm && !est.project_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.project_name.localeCompare(b.project_name);
        case 'cost':
          return b.estimated_cost - a.estimated_cost;
        case 'hours':
          return b.estimated_hours - a.estimated_hours;
        case 'timestamp':
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

  const projectTypes = [...new Set(estimates.map(e => e.project_type))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🛠️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Panel de Administrador</h1>
                <p className="text-sm text-gray-600">Gestión de Estimaciones de Proyectos</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats.total_estimates || 0}</div>
                <div className="text-sm text-gray-600">Total Estimaciones</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">💰</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  ${(stats.total_projects_cost || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Valor Total</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">⏱️</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats.total_hours || 0}</div>
                <div className="text-sm text-gray-600">Horas Totales</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-xl">📈</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats.avg_project_hours || 0}h</div>
                <div className="text-sm text-gray-600">Promedio por Proyecto</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Buscar por nombre de proyecto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los tipos</option>
              {projectTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="timestamp">Más recientes</option>
              <option value="name">Nombre A-Z</option>
              <option value="cost">Mayor costo</option>
              <option value="hours">Más horas</option>
            </select>

            <button
              onClick={fetchEstimates}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Estimates Table */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">
              Estimaciones Guardadas ({filteredEstimates.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="mt-4 text-gray-600">Cargando estimaciones...</div>
            </div>
          ) : filteredEstimates.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <div>No se encontraron estimaciones</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proyecto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Costo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEstimates.map((estimate, index) => (
                    <motion.tr
                      key={estimate.id}
                      className="hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {estimate.project_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {estimate.project_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {estimate.complexity}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          estimate.project_type === 'location-app' ? 'bg-blue-100 text-blue-800' :
                          estimate.project_type === 'e-commerce' ? 'bg-green-100 text-green-800' :
                          estimate.project_type === 'web-app' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {estimate.project_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{estimate.estimated_hours}h</div>
                        <div className="text-gray-500">{estimate.estimated_weeks} semanas</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-bold text-green-600">
                          ${estimate.estimated_cost?.toLocaleString()}
                        </div>
                        <div className="text-gray-500">
                          ${estimate.hourly_rate}/h
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(estimate.timestamp).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedEstimate(estimate)}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => deleteEstimate(estimate.id)}
                          className="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Eliminar
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal de Detalle */}
      <AnimatePresence>
        {selectedEstimate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setSelectedEstimate(null)}
            />
            
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-90vh overflow-y-auto relative z-10"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedEstimate.project_name}
                  </h3>
                  <button
                    onClick={() => setSelectedEstimate(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-gray-600 mt-2">
                  Creado el {new Date(selectedEstimate.timestamp).toLocaleDateString('es-ES')}
                </p>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Información General */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Información General</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo:</span>
                        <span className="font-medium">{selectedEstimate.project_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Complejidad:</span>
                        <span className="font-medium">{selectedEstimate.complexity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tarifa/hora:</span>
                        <span className="font-medium">${selectedEstimate.hourly_rate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duración:</span>
                        <span className="font-medium">{selectedEstimate.estimated_weeks} semanas</span>
                      </div>
                    </div>

                    {/* Equipo */}
                    <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Equipo</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedEstimate.team || {}).map(([role, count]) => (
                        count > 0 && (
                          <div key={role} className="flex justify-between">
                            <span className="text-gray-600 capitalize">
                              {role === 'qa' ? 'QA Tester' : role}:
                            </span>
                            <span className="font-medium">{count} persona{count > 1 ? 's' : ''}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  {/* Desglose */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Desglose de Horas</h4>
                    <div className="space-y-3">
                      {Object.entries(selectedEstimate.breakdown || {}).map(([area, hours]) => (
                        <div key={area} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              area === 'frontend' ? 'bg-green-500' :
                              area === 'backend' ? 'bg-blue-500' :
                              area === 'design' ? 'bg-purple-500' : 'bg-orange-500'
                            }`}></div>
                            <span className="capitalize font-medium">
                              {area === 'qa' ? 'QA' : area}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{hours}h</div>
                            <div className="text-sm text-gray-500">
                              ${(hours * selectedEstimate.hourly_rate).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Funcionalidades */}
                    <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Funcionalidades</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedEstimate.features || {}).map(([feature, enabled]) => (
                        <div key={feature} className={`p-2 rounded text-sm ${
                          enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <span className="mr-2">{enabled ? '✅' : '❌'}</span>
                          {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Totales */}
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl text-white">
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold">{selectedEstimate.estimated_hours}</div>
                      <div className="text-blue-100">Horas Totales</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">{selectedEstimate.estimated_weeks}</div>
                      <div className="text-blue-100">Semanas</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">
                        ${selectedEstimate.estimated_cost?.toLocaleString()}
                      </div>
                      <div className="text-blue-100">Costo Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;