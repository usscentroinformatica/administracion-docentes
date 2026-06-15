// src/components/ListaDocentes.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { ref, get, child, update } from 'firebase/database';
import './ListaDocentes.css';

const ListaDocentes = ({ onClose, modo = 'admin', docenteId = null }) => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocente, setSelectedDocente] = useState(null);
  const [certificacionesMap, setCertificacionesMap] = useState({});
  const [certificacionesDetalle, setCertificacionesDetalle] = useState([]);
  
  // Estados para edición (solo para docente)
  const [modoEdicion, setModoEdicion] = useState(false);
  const [editandoDocente, setEditandoDocente] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [cargandoActualizacion, setCargandoActualizacion] = useState(false);

  // URL de Google Sheets
  const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1GOJZQDx1XSpudu_80gok1Nuq9YzMvKkLR9fy-jYsyt0/edit';

  const abrirGoogleSheets = () => {
    window.open(GOOGLE_SHEETS_URL, '_blank');
  };

  useEffect(() => {
    if (modo === 'docente' && docenteId) {
      cargarDocenteUnico(docenteId);
    } else {
      cargarDocentes();
    }
  }, [modo, docenteId]);

  const cargarDocenteUnico = async (id) => {
    setLoading(true);
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `docentes/${id}`));
      
      if (snapshot.exists()) {
        const docente = { id, ...snapshot.val() };
        setDocentes([docente]);
        setSelectedDocente(docente);
        await cargarCertificacionesDocente(id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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
        
        const docentesOrdenados = docentesList.sort((a, b) => {
          const apellidoA = a.apellidos || '';
          const apellidoB = b.apellidos || '';
          const comparacionApellidos = apellidoA.localeCompare(apellidoB);
          if (comparacionApellidos !== 0) return comparacionApellidos;
          const nombreA = a.nombres || '';
          const nombreB = b.nombres || '';
          return nombreA.localeCompare(nombreB);
        });
        
        setDocentes(docentesOrdenados);
      } else {
        setDocentes([]);
      }
    } catch (error) {
      console.error('Error:', error);
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
      console.error('Error:', error);
    }
  };

  const handleSelectDocente = async (docente) => {
    if (modo === 'docente') return;
    setSelectedDocente(docente);
    await cargarCertificacionesDocente(docente.id);
  };

  const iniciarEdicion = () => {
    setEditandoDocente({ ...selectedDocente });
    setModoEdicion(true);
  };

  const cancelarEdicion = () => {
    setEditandoDocente(null);
    setModoEdicion(false);
    setMensaje('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditandoDocente(prev => ({ ...prev, [name]: value }));
  };

  const guardarCambios = async () => {
    setCargandoActualizacion(true);
    setMensaje('');
    
    try {
      const docenteRef = ref(db, `docentes/${selectedDocente.id}`);
      await update(docenteRef, {
        celular: editandoDocente.celular,
        correo: editandoDocente.correo,
        lugarResidencia: editandoDocente.lugarResidencia
      });
      
      setSelectedDocente(editandoDocente);
      const nuevosDocentes = docentes.map(d => 
        d.id === editandoDocente.id ? editandoDocente : d
      );
      setDocentes(nuevosDocentes);
      
      setMensaje({ tipo: 'success', texto: '✅ Datos actualizados correctamente' });
      setModoEdicion(false);
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: '❌ Error al actualizar datos' });
    } finally {
      setCargandoActualizacion(false);
    }
  };

  const verArchivo = (archivoBase64, nombre) => {
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
        </html>
      `);
    ventana.document.close();
  };

  const certificadosList = [
    'Microsoft Word Asociado - 2019',
    'Microsoft Excel Asociado - 2019',
    'Microsoft PowerPoint Asociado - 2019',
    'Microsoft Word Expert - 2019',
    'Microsoft Excel Expert - 2019',
    'Microsoft Word Asociado - 365',
    'Microsoft Excel Asociado - 365',
    'Microsoft PowerPoint Asociado - 365',
    'Microsoft Word Expert - 365',
    'Microsoft Excel Expert - 365'
  ];

  return (
    <>
      <div className="lista-docentes-overlay">
        <div className="lista-docentes-container">
          <div className="lista-header">
            <h3>{modo === 'docente' ? '👨‍🏫 Mi Perfil Docente' : '📋 Docentes Registrados'}</h3>
            <div className="header-buttons">
              {modo === 'admin' && (
                <button className="btn-ver-sheets" onClick={abrirGoogleSheets}>
                  📊 Ver Hoja de Cálculo
                </button>
              )}
              <button className="btn-cerrar" onClick={onClose}>✕</button>
            </div>
          </div>

          {mensaje && (
            <div className={`mensaje-toast ${mensaje.tipo}`}>
              {mensaje.texto}
            </div>
          )}

          {loading ? (
            <div className="loading-spinner">Cargando...</div>
          ) : docentes.length === 0 ? (
            <div className="sin-docentes">No hay docentes registrados aún</div>
          ) : (
            <div className="lista-contenido">
              {modo === 'admin' && (
                <div className="lista-docentes">
                  <h4>📚 Lista de Docentes <span className="docentes-count">({docentes.length} registrados)</span></h4>
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
              )}

              {selectedDocente && (
                <div className="docente-detalle">
                  <div className="detalle-header">
                    <h4>📄 Detalle del Docente</h4>
                    {modo === 'docente' && !modoEdicion && (
                      <button className="btn-editar-perfil" onClick={iniciarEdicion}>
                        ✏️ Editar Mi Perfil
                      </button>
                    )}
                    {modo === 'docente' && modoEdicion && (
                      <div className="acciones-edicion">
                        <button className="btn-guardar-edicion" onClick={guardarCambios} disabled={cargandoActualizacion}>
                          {cargandoActualizacion ? 'Guardando...' : '💾 Guardar'}
                        </button>
                        <button className="btn-cancelar-edicion" onClick={cancelarEdicion}>
                          ❌ Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="detalle-foto">
                    {selectedDocente.fotoBase64 ? (
                      <img src={selectedDocente.fotoBase64} alt={selectedDocente.nombres} className="detalle-imagen" />
                    ) : (
                      <div className="detalle-sin-foto">Sin foto</div>
                    )}
                  </div>

                  {modoEdicion ? (
                    <div className="detalle-info-edicion">
                      <div className="campo-edicion">
                        <label>📛 Apellidos:</label>
                        <input type="text" value={editandoDocente?.apellidos || ''} disabled />
                      </div>
                      <div className="campo-edicion">
                        <label>👤 Nombres:</label>
                        <input type="text" value={editandoDocente?.nombres || ''} disabled />
                      </div>
                      <div className="campo-edicion">
                        <label>📅 Fecha Nacimiento:</label>
                        <input type="text" value={editandoDocente?.fechaNacimiento || ''} disabled />
                      </div>
                      <div className="campo-edicion">
                        <label>🆔 DNI:</label>
                        <input type="text" value={editandoDocente?.dni || ''} disabled />
                      </div>
                      <div className="campo-edicion">
                        <label>📧 Correo:</label>
                        <input type="email" name="correo" value={editandoDocente?.correo || ''} onChange={handleEditChange} />
                      </div>
                      <div className="campo-edicion">
                        <label>📱 Celular:</label>
                        <input type="tel" name="celular" value={editandoDocente?.celular || ''} onChange={handleEditChange} maxLength="9" />
                      </div>
                      <div className="campo-edicion">
                        <label>📍 Lugar Residencia:</label>
                        <input type="text" name="lugarResidencia" value={editandoDocente?.lugarResidencia || ''} onChange={handleEditChange} />
                      </div>
                    </div>
                  ) : (
                    <div className="detalle-info">
                      <p><strong>👤 Nombres:</strong> {selectedDocente.nombres}</p>
                      <p><strong>📛 Apellidos:</strong> {selectedDocente.apellidos}</p>
                      <p><strong>📅 Fecha Nacimiento:</strong> {selectedDocente.fechaNacimiento}</p>
                      <p><strong>🆔 DNI:</strong> {selectedDocente.dni}</p>
                      <p><strong>📧 Correo:</strong> {selectedDocente.correo}</p>
                      <p><strong>📱 Celular:</strong> {selectedDocente.celular}</p>
                      <p><strong>📍 Lugar Residencia:</strong> {selectedDocente.lugarResidencia}</p>
                      <p><strong>🎓 Grado Maestría:</strong> {
                        selectedDocente.gradoMaestria === 'ninguno' ? 'Ninguno' : 
                        selectedDocente.gradoMaestria === 'cursando' ? 'Cursando Maestría' :
                        selectedDocente.gradoMaestria === 'magister' ? 'Magíster' :
                        selectedDocente.gradoMaestria === 'doctor' ? 'Doctor' : selectedDocente.gradoMaestria
                      }</p>
                    </div>
                  )}

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
                            <button className="btn-ver-pdf" onClick={() => verArchivo(certificadoData.archivoBase64, cert)}>
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
