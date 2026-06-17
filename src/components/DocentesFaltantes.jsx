// src/components/DocentesFaltantes.jsx
import { useState, useEffect } from 'react';
import './DocentesFaltantes.css';

const DocentesFaltantes = () => {
  const [docentesFaltantes, setDocentesFaltantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ⚠️ REEMPLAZA con tu URL de Google Apps Script
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxPGHcFF_vyqnO1j6NQQMjq4Fqm51Y4I1BSGeRZ2RWyaKcpTFdPYCo9futOP7f6yteG/exec';

  useEffect(() => {
    cargarDocentesFaltantes();
  }, []);

  const cargarDocentesFaltantes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SCRIPT_URL}?action=obtenerFaltantes`);
      
      if (!response.ok) {
        throw new Error('Error al obtener los datos');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDocentesFaltantes(result.data);
      } else {
        throw new Error(result.error || 'Error al obtener los datos');
      }
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar por búsqueda
  const docentesFiltrados = docentesFaltantes.filter(docente => {
    const searchLower = searchTerm.toLowerCase();
    return docente.docente.toLowerCase().includes(searchLower) ||
           docente.correo.toLowerCase().includes(searchLower);
  });

  // Función para copiar todos los correos
  const copiarCorreos = () => {
    const correos = docentesFaltantes.map(d => d.correo).join('; ');
    navigator.clipboard.writeText(correos);
    alert('✅ Correos copiados al portapapeles');
  };

  if (loading) {
    return (
      <div className="faltantes-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando docentes faltantes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="faltantes-container">
        <div className="error-message">
          <p>❌ Error: {error}</p>
          <button onClick={cargarDocentesFaltantes} className="btn-retry">
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="faltantes-container">
      <div className="faltantes-header">
        <h2>📋 Docentes No Registrados</h2>
        <div className="header-stats">
          <span className="badge">{docentesFaltantes.length} docentes pendientes</span>
          <button onClick={copiarCorreos} className="btn-copy-emails">
            📧 Copiar Correos
          </button>
          <button onClick={cargarDocentesFaltantes} className="btn-refresh">
            🔄 Actualizar
          </button>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Buscar docente o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <span className="search-results">
            {docentesFiltrados.length} resultados
          </span>
        )}
      </div>

      {docentesFiltrados.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <p>🔍 No se encontraron docentes con esa búsqueda</p>
          ) : (
            <p>🎉 ¡Todos los docentes están registrados!</p>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="faltantes-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Docente</th>
                <th>Correo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docentesFiltrados.map((docente) => (
                <tr key={docente.numero}>
                  <td className="numero">{docente.numero}</td>
                  <td className="docente-nombre">{docente.docente}</td>
                  <td className="docente-correo">
                    <a href={`mailto:${docente.correo}`} className="email-link">
                      {docente.correo}
                    </a>
                  </td>
                  <td>
                    <span className="estado-badge no-registrado">
                      {docente.estado}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-copy-email"
                      onClick={() => {
                        navigator.clipboard.writeText(docente.correo);
                        alert('✅ Correo copiado: ' + docente.correo);
                      }}
                    >
                      📋 Copiar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="footer-info">
        <small>
          Mostrando {docentesFiltrados.length} de {docentesFaltantes.length} docentes pendientes
        </small>
      </div>
    </div>
  );
};

export default DocentesFaltantes;
