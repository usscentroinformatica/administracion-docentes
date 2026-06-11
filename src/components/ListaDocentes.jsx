// src/components/ListaDocentes.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { ref, get, child } from 'firebase/database';
import './ListaDocentes.css';

const ListaDocentes = ({ onClose }) => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocente, setSelectedDocente] = useState(null);
  const [certificacionesMap, setCertificacionesMap] = useState({});
  const [certificacionesDetalle, setCertificacionesDetalle] = useState([]);

  // Cargar docentes al abrir
  useEffect(() => {
    cargarDocentes();
  }, []);

  const cargarDocentes = async () => {
    setLoading(true);
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, 'docentes'));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const docentesList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // ORDENAR ALFABÉTICAMENTE por apellidos y luego por nombres
        const docentesOrdenados = docentesList.sort((a, b) => {
          // Primero ordenar por apellidos
          const apellidoA = a.apellidos || '';
          const apellidoB = b.apellidos || '';
          const comparacionApellidos = apellidoA.localeCompare(apellidoB);
          
          if (comparacionApellidos !== 0) {
            return comparacionApellidos;
          }
          // Si los apellidos son iguales, ordenar por nombres
          const nombreA = a.nombres || '';
          const nombreB = b.nombres || '';
          return nombreA.localeCompare(nombreB);
        });
        
        setDocentes(docentesOrdenados);
      } else {
        setDocentes([]);
      }
    } catch (error) {
      console.error('Error al cargar docentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarCertificacionesDocente = async (docenteId) => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `certificaciones/${docenteId}`));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const certificadosList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Crear objeto de certificaciones para checkmarks
        const certificadosMapObj = {};
        certificadosList.forEach(cert => {
          certificadosMapObj[cert.nombre] = true;
        });
        setCertificacionesMap(certificadosMapObj);
        setCertificacionesDetalle(certificadosList);
      } else {
        setCertificacionesMap({});
        setCertificacionesDetalle([]);
      }
    } catch (error) {
      console.error('Error al cargar certificaciones:', error);
    }
  };

  const handleSelectDocente = async (docente) => {
    setSelectedDocente(docente);
    await cargarCertificacionesDocente(docente.id);
  };

  const verArchivo = (archivoBase64, nombre) => {
    // Abrir en nueva pestaña
    const ventana = window.open();
    ventana.document.write(`
      <html>
        <head>
          <title>${nombre}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; font-family: Arial, sans-serif; }
            .container { width: 100%; height: 100vh; display: flex; flex-direction: column; }
            .header { padding: 15px; background: linear-gradient(135deg, #5a2290 0%, #7b2cb8 100%); color: white; text-align: center; }
            .header h3 { margin: 0; }
            .content { flex: 1; display: flex; justify-content: center; align-items: center; background: #f5f5f5; }
            iframe { width: 100%; height: 100%; border: none; }
            img { max-width: 90%; max-height: 85vh; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
            .btn-download { position: fixed; bottom: 20px; right: 20px; background: linear-gradient(135deg, #11acd3 0%, #0d8bb3 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; transition: all 0.3s; }
            .btn-download:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h3>📄 ${nombre}</h3>
            </div>
            <div class="content">
              ${archivoBase64?.startsWith('data:application/pdf') 
                ? `<iframe src="${archivoBase64}"></iframe>` 
                : `<img src="${archivoBase64}" alt="${nombre}" />`}
            </div>
            <a href="${archivoBase64}" download="${nombre}.pdf" class="btn-download">⬇️ Descargar Certificado</a>
          </div>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  // Lista de certificaciones para verificar
  const certificadosList = [
    'Microsoft Word Asociado - 2019',
    'Microsoft Excel Asociado - 2019',
    'Microsoft PowerPoint Asociado - 2019',
    'Microsoft Word Expert - 2019',
    'Microsoft Excel Expert - 2019',
    'Microsoft Word Asociado - 365',
    'Microsoft Excel Asociado - 365',
    'Microsoft PowerPoint Asociado - 365'
  ];

  return (
    <>
      <div className="lista-docentes-overlay">
        <div className="lista-docentes-container">
          <div className="lista-header">
            <h3>📋 Docentes Registrados</h3>
            <button className="btn-cerrar" onClick={onClose}>✕</button>
          </div>

          {loading ? (
            <div className="loading-spinner">Cargando docentes...</div>
          ) : docentes.length === 0 ? (
            <div className="sin-docentes">No hay docentes registrados aún</div>
          ) : (
            <div className="lista-contenido">
              <div className="lista-docentes">
                <h4>📚 Lista de Docentes <span className="docentes-count">({docentes.length} registrados)</span></h4>
                <div className="ordenamiento-indicador">
                  
                </div>
                {docentes.map(docente => (
                  <div 
                    key={docente.id} 
                    className={`docente-item ${selectedDocente?.id === docente.id ? 'active' : ''}`}
                    onClick={() => handleSelectDocente(docente)}
                  >
                    <div className="docente-item-foto">
                      {docente.fotoBase64 ? (
                        <img src={docente.fotoBase64} alt={docente.nombres} />
                      ) : (
                        <div className="foto-placeholder-mini">📷</div>
                      )}
                    </div>
                    <div className="docente-item-info">
                      <strong>{docente.apellidos} {docente.nombres}</strong>
                      <small>DNI: {docente.dni}</small>
                    </div>
                  </div>
                ))}
              </div>

              {selectedDocente && (
                <div className="docente-detalle">
                  <h4>📄 Detalle del Docente</h4>
                  
                  {/* Foto del docente */}
                  <div className="detalle-foto">
                    {selectedDocente.fotoBase64 ? (
                      <img src={selectedDocente.fotoBase64} alt={selectedDocente.nombres} className="detalle-imagen" />
                    ) : (
                      <div className="detalle-sin-foto">Sin foto</div>
                    )}
                  </div>

                  {/* Información personal */}
                  <div className="detalle-info">
                    <p><strong>👤 Nombres:</strong> {selectedDocente.nombres}</p>
                    <p><strong>📛 Apellidos:</strong> {selectedDocente.apellidos}</p>
                    <p><strong>📅 Fecha Nacimiento:</strong> {selectedDocente.fechaNacimiento}</p>
                    <p><strong>🆔 DNI:</strong> {selectedDocente.dni}</p>
                    <p><strong>📧 Correo:</strong> {selectedDocente.correo}</p>
                    <p><strong>📱 Celular:</strong> {selectedDocente.celular}</p>
                    <p><strong>📍 Lugar Residencia:</strong> {selectedDocente.lugarResidencia}</p>
                    <p><strong>🎓 Grado Maestría:</strong> {selectedDocente.gradoMaestria === 'ninguno' ? 'Ninguno' : 
                      selectedDocente.gradoMaestria === 'cursando' ? 'Cursando Maestría' :
                      selectedDocente.gradoMaestria === 'magister' ? 'Magíster' :
                      selectedDocente.gradoMaestria === 'doctor' ? 'Doctor' : selectedDocente.gradoMaestria}</p>
                  </div>

                  {/* Certificaciones con checkmarks y botón para ver archivo */}
                  <h4>📜 Certificaciones</h4>
                  <div className="certificaciones-check">
                    {certificadosList.map(cert => {
                      const certificadoData = certificacionesDetalle.find(c => c.nombre === cert);
                      const tieneCertificado = !!certificacionesMap[cert];
                      
                      return (
                        <div key={cert} className="cert-item">
                          <span className={`check-icon ${tieneCertificado ? 'checked' : 'unchecked'}`}>
                            {tieneCertificado ? '✅' : '❌'}
                          </span>
                          <span className={`cert-nombre ${tieneCertificado ? 'completado' : 'pendiente'}`}>
                            {cert}
                          </span>
                          {tieneCertificado && certificadoData?.archivoBase64 && (
                            <button 
                              className="btn-ver-pdf"
                              onClick={() => verArchivo(certificadoData.archivoBase64, cert)}
                            >
                              📄 Ver Certificado
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ListaDocentes;