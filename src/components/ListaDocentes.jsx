// src/components/ListaDocentes.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { ref, get, child, update } from 'firebase/database';
import { guardarCertificacion } from '../firebase/services';
import './ListaDocentes.css';

const ListaDocentes = ({ onClose, modo = 'admin', docenteId = null }) => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocente, setSelectedDocente] = useState(null);
  const [certificacionesMap, setCertificacionesMap] = useState({});
  const [certificacionesDetalle, setCertificacionesDetalle] = useState([]);
  
  // Estados para edición de datos personales
  const [modoEdicion, setModoEdicion] = useState(false);
  const [editandoDocente, setEditandoDocente] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [cargandoActualizacion, setCargandoActualizacion] = useState(false);
  
  // Estados para certificaciones (como en DocenteForm)
  const [certificaciones, setCertificaciones] = useState({
    office2019: {
      wordAsociado: { seleccionado: false, archivo: null, nombreArchivo: '' },
      excelAsociado: { seleccionado: false, archivo: null, nombreArchivo: '' },
      powerpointAsociado: { seleccionado: false, archivo: null, nombreArchivo: '' },
      wordExpert: { seleccionado: false, archivo: null, nombreArchivo: '' },
      excelExpert: { seleccionado: false, archivo: null, nombreArchivo: '' }
    },
    office365: {
      wordAsociado: { seleccionado: false, archivo: null, nombreArchivo: '' },
      excelAsociado: { seleccionado: false, archivo: null, nombreArchivo: '' },
      powerpointAsociado: { seleccionado: false, archivo: null, nombreArchivo: '' },
      wordExpert: { seleccionado: false, archivo: null, nombreArchivo: '' },
      excelExpert: { seleccionado: false, archivo: null, nombreArchivo: '' }
    }
  });
  const [mostrarCertificaciones, setMostrarCertificaciones] = useState(false);

  // URL de tu Google Apps Script (ACTUALIZADA)
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzE-UOhv6nr0qSK_odKYScQX0Fj9-Zfb4MWDajckMPcdh2C_VyOyz4Heks4IKQroFiA/exec';
  const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1GOJZQDx1XSpudu_80gok1Nuq9YzMvKkLR9fy-jYsyt0/edit';

  const abrirGoogleSheets = () => {
    window.open(GOOGLE_SHEETS_URL, '_blank');
  };

  // Función para obtener el estado actual de las certificaciones
  const obtenerEstadoCertificaciones = () => {
    return {
      word2019Asociado: certificaciones.office2019.wordAsociado.seleccionado ? '✅' : '❌',
      excel2019Asociado: certificaciones.office2019.excelAsociado.seleccionado ? '✅' : '❌',
      ppt2019Asociado: certificaciones.office2019.powerpointAsociado.seleccionado ? '✅' : '❌',
      word2019Expert: certificaciones.office2019.wordExpert.seleccionado ? '✅' : '❌',
      excel2019Expert: certificaciones.office2019.excelExpert.seleccionado ? '✅' : '❌',
      word365Asociado: certificaciones.office365.wordAsociado.seleccionado ? '✅' : '❌',
      excel365Asociado: certificaciones.office365.excelAsociado.seleccionado ? '✅' : '❌',
      ppt365Asociado: certificaciones.office365.powerpointAsociado.seleccionado ? '✅' : '❌',
      word365Expert: certificaciones.office365.wordExpert.seleccionado ? '✅' : '❌',
      excel365Expert: certificaciones.office365.excelExpert.seleccionado ? '✅' : '❌'
    };
  };

  // Función para actualizar Google Sheets (funciona con CORS)
  const actualizarGoogleSheets = async (docenteData, estadoCerts) => {
  try {
    const datosParaGoogle = {
      apellidos: docenteData.apellidos || '',
      nombres: docenteData.nombres || '',
      dni: docenteData.dni || '',
      fechaNacimiento: docenteData.fechaNacimiento || '',
      genero: docenteData.genero || '',
      correo: docenteData.correo || '',
      celular: docenteData.celular || '',
      lugarResidencia: docenteData.lugarResidencia || '',
      gradoMaestria: docenteData.gradoMaestria || '',
      certificaciones: estadoCerts
    };
    
    console.log('📤 Enviando a Google Sheets - DNI:', docenteData.dni);
    
    // Usar sendBeacon - no tiene problemas de CORS
    const blob = new Blob([JSON.stringify(datosParaGoogle)], { type: 'application/json' });
    const enviado = navigator.sendBeacon(GOOGLE_SCRIPT_URL, blob);
    
    if (enviado) {
      console.log('✅ Datos enviados correctamente a Google Sheets');
    } else {
      console.warn('⚠️ sendBeacon falló, pero puede que igual se envíe');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
};

  useEffect(() => {
    if (modo === 'docente' && docenteId) {
      cargarDocenteUnico(docenteId);
      cargarCertificacionesState(docenteId);
    } else {
      cargarDocentes();
    }
  }, [modo, docenteId]);

  // Cargar certificaciones al estado local (para edición)
  const cargarCertificacionesState = async (id) => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `certificaciones/${id}`));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const nuevasCertificaciones = { ...certificaciones };
        
        for (const key in data) {
          const cert = data[key];
          const nombre = cert.nombre || '';
          
          // Office 2019
          if (nombre.includes('Word Asociado - 2019')) {
            nuevasCertificaciones.office2019.wordAsociado = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          }
          if (nombre.includes('Excel Asociado - 2019')) {
            nuevasCertificaciones.office2019.excelAsociado = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          }
          if (nombre.includes('PowerPoint Asociado - 2019')) {
            nuevasCertificaciones.office2019.powerpointAsociado = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          }
          if (nombre.includes('Word Expert - 2019')) {
            nuevasCertificaciones.office2019.wordExpert = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          }
          if (nombre.includes('Excel Expert - 2019')) {
            nuevasCertificaciones.office2019.excelExpert = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          }
          
          // Office 365
          if (nombre.includes('Word Asociado - 365')) {
            nuevasCertificaciones.office365.wordAsociado = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          }
          if (nombre.includes('Excel Asociado - 365')) {
            nuevasCertificaciones.office365.excelAsociado = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          }
          if (nombre.includes('PowerPoint Asociado - 365')) {
            nuevasCertificaciones.office365.powerpointAsociado = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          }
          if (nombre.includes('Word Expert - 365')) {
            nuevasCertificaciones.office365.wordExpert = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          }
          if (nombre.includes('Excel Expert - 365')) {
            nuevasCertificaciones.office365.excelExpert = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          }
        }
        
        setCertificaciones(nuevasCertificaciones);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

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

  // Funciones para edición de datos personales
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
      // 1. Actualizar Firebase
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
      
      // 2. Actualizar Google Sheets
      const estadoCerts = obtenerEstadoCertificaciones();
      await actualizarGoogleSheets(editandoDocente, estadoCerts);
      
      setMensaje({ tipo: 'success', texto: '✅ Datos actualizados y sincronizados con Google Sheets' });
      setModoEdicion(false);
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: '❌ Error al actualizar datos' });
    } finally {
      setCargandoActualizacion(false);
    }
  };

  // Funciones para certificaciones (como en DocenteForm)
  const handleCertificacionToggle = (categoria, tipo) => {
    setCertificaciones(prevState => ({
      ...prevState,
      [categoria]: {
        ...prevState[categoria],
        [tipo]: {
          ...prevState[categoria][tipo],
          seleccionado: !prevState[categoria][tipo].seleccionado,
          archivo: !prevState[categoria][tipo].seleccionado ? null : prevState[categoria][tipo].archivo,
          nombreArchivo: !prevState[categoria][tipo].seleccionado ? '' : prevState[categoria][tipo].nombreArchivo
        }
      }
    }));
  };

  const handleArchivoChange = (categoria, tipo, e) => {
    const { files } = e.target;
    setCertificaciones(prevState => ({
      ...prevState,
      [categoria]: {
        ...prevState[categoria],
        [tipo]: {
          ...prevState[categoria][tipo],
          archivo: files[0],
          nombreArchivo: files[0]?.name || ''
        }
      }
    }));
  };

  const archivoToBase64 = (archivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const getNombreCertificado = (categoria, tipo) => {
    const nombres = {
      office2019: {
        wordAsociado: 'Microsoft Word Asociado - 2019',
        excelAsociado: 'Microsoft Excel Asociado - 2019',
        powerpointAsociado: 'Microsoft PowerPoint Asociado - 2019',
        wordExpert: 'Microsoft Word Expert - 2019',
        excelExpert: 'Microsoft Excel Expert - 2019'
      },
      office365: {
        wordAsociado: 'Microsoft Word Asociado - 365',
        excelAsociado: 'Microsoft Excel Asociado - 365',
        powerpointAsociado: 'Microsoft PowerPoint Asociado - 365',
        wordExpert: 'Microsoft Word Expert - 365',
        excelExpert: 'Microsoft Excel Expert - 365'
      }
    };
    return nombres[categoria]?.[tipo] || '';
  };

  const guardarCertificacionesDocente = async () => {
    setCargandoActualizacion(true);
    setMensaje('');
    
    try {
      // Guardar certificaciones en Firebase
      for (const [categoria, certificados] of Object.entries(certificaciones)) {
        for (const [tipo, datos] of Object.entries(certificados)) {
          if (datos.seleccionado && datos.archivo) {
            const nombreCert = getNombreCertificado(categoria, tipo);
            const archivoBase64 = await archivoToBase64(datos.archivo);
            
            const certificacionInfo = {
              nombre: nombreCert,
              categoria: categoria,
              tipo: tipo,
              fechaSubida: new Date().toISOString(),
              nombreArchivo: datos.nombreArchivo,
              archivoBase64: archivoBase64
            };
            
            await guardarCertificacion(selectedDocente.id, certificacionInfo, datos.archivo);
          }
        }
      }
      
      // Actualizar Google Sheets con el nuevo estado de certificaciones
      const estadoCerts = obtenerEstadoCertificaciones();
      await actualizarGoogleSheets(selectedDocente, estadoCerts);
      
      setMensaje({ tipo: 'success', texto: '✅ Certificaciones guardadas y sincronizadas con Google Sheets' });
      setMostrarCertificaciones(false);
      await cargarCertificacionesDocente(selectedDocente.id);
      await cargarCertificacionesState(selectedDocente.id);
      
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: '❌ Error al guardar certificaciones' });
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
                  📊 Ver Hoja
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
            <div className="sin-docentes">No hay docentes registrados</div>
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
                    <h4>📄 Información Personal</h4>
                    {modo === 'docente' && !modoEdicion && (
                      <button className="btn-editar-perfil" onClick={iniciarEdicion}>
                        ✏️ Editar Datos
                      </button>
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
                        <label>Apellidos:</label>
                        <input type="text" value={editandoDocente?.apellidos || ''} disabled />
                      </div>
                      <div className="campo-edicion">
                        <label>Nombres:</label>
                        <input type="text" value={editandoDocente?.nombres || ''} disabled />
                      </div>
                      <div className="campo-edicion">
                        <label>DNI:</label>
                        <input type="text" value={editandoDocente?.dni || ''} disabled />
                      </div>
                      <div className="campo-edicion">
                        <label>Correo:</label>
                        <input type="email" name="correo" value={editandoDocente?.correo || ''} onChange={handleEditChange} />
                      </div>
                      <div className="campo-edicion">
                        <label>Celular:</label>
                        <input type="tel" name="celular" value={editandoDocente?.celular || ''} onChange={handleEditChange} maxLength="9" />
                      </div>
                      <div className="campo-edicion">
                        <label>Residencia:</label>
                        <input type="text" name="lugarResidencia" value={editandoDocente?.lugarResidencia || ''} onChange={handleEditChange} />
                      </div>
                      <div className="acciones-edicion">
                        <button className="btn-guardar-edicion" onClick={guardarCambios} disabled={cargandoActualizacion}>
                          {cargandoActualizacion ? 'Guardando...' : '💾 Guardar Cambios'}
                        </button>
                        <button className="btn-cancelar-edicion" onClick={cancelarEdicion}>
                          ❌ Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="detalle-info">
                      <p><strong>Nombres:</strong> {selectedDocente.nombres}</p>
                      <p><strong>Apellidos:</strong> {selectedDocente.apellidos}</p>
                      <p><strong>DNI:</strong> {selectedDocente.dni}</p>
                      <p><strong>Correo:</strong> {selectedDocente.correo}</p>
                      <p><strong>Celular:</strong> {selectedDocente.celular}</p>
                      <p><strong>Residencia:</strong> {selectedDocente.lugarResidencia}</p>
                    </div>
                  )}

                  {/* Sección de Certificaciones */}
                  <div className="certificaciones-section">
                    <div className="certificaciones-header">
                      <h4>📜 Certificaciones</h4>
                      {modo === 'docente' && !mostrarCertificaciones && (
                        <button className="btn-agregar-cert" onClick={() => setMostrarCertificaciones(true)}>
                          ➕ Agregar/Editar Certificaciones
                        </button>
                      )}
                    </div>

                    {mostrarCertificaciones ? (
                      <div className="certificaciones-edicion">
                        {/* Office 2019 */}
                        <div className="certificacion-grupo">
                          <h5>Microsoft Office 2019</h5>
                          <div className="certificaciones-grid">
                            <div className="certificacion-card">
                              <div className="certificacion-header">
                                <input
                                  type="checkbox"
                                  checked={certificaciones.office2019.wordAsociado.seleccionado}
                                  onChange={() => handleCertificacionToggle('office2019', 'wordAsociado')}
                                />
                                <label>Microsoft Word Asociado - 2019</label>
                              </div>
                              {certificaciones.office2019.wordAsociado.seleccionado && (
                                <div className="certificacion-archivo">
                                  <input
                                    type="file"
                                    onChange={(e) => handleArchivoChange('office2019', 'wordAsociado', e)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  {certificaciones.office2019.wordAsociado.nombreArchivo && (
                                    <small>Archivo: {certificaciones.office2019.wordAsociado.nombreArchivo}</small>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="certificacion-card">
                              <div className="certificacion-header">
                                <input
                                  type="checkbox"
                                  checked={certificaciones.office2019.excelAsociado.seleccionado}
                                  onChange={() => handleCertificacionToggle('office2019', 'excelAsociado')}
                                />
                                <label>Microsoft Excel Asociado - 2019</label>
                              </div>
                              {certificaciones.office2019.excelAsociado.seleccionado && (
                                <div className="certificacion-archivo">
                                  <input
                                    type="file"
                                    onChange={(e) => handleArchivoChange('office2019', 'excelAsociado', e)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  {certificaciones.office2019.excelAsociado.nombreArchivo && (
                                    <small>Archivo: {certificaciones.office2019.excelAsociado.nombreArchivo}</small>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="certificacion-card">
                              <div className="certificacion-header">
                                <input
                                  type="checkbox"
                                  checked={certificaciones.office2019.powerpointAsociado.seleccionado}
                                  onChange={() => handleCertificacionToggle('office2019', 'powerpointAsociado')}
                                />
                                <label>Microsoft PowerPoint Asociado - 2019</label>
                              </div>
                              {certificaciones.office2019.powerpointAsociado.seleccionado && (
                                <div className="certificacion-archivo">
                                  <input
                                    type="file"
                                    onChange={(e) => handleArchivoChange('office2019', 'powerpointAsociado', e)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  {certificaciones.office2019.powerpointAsociado.nombreArchivo && (
                                    <small>Archivo: {certificaciones.office2019.powerpointAsociado.nombreArchivo}</small>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="certificacion-card">
                              <div className="certificacion-header">
                                <input
                                  type="checkbox"
                                  checked={certificaciones.office2019.wordExpert.seleccionado}
                                  onChange={() => handleCertificacionToggle('office2019', 'wordExpert')}
                                />
                                <label>Microsoft Word Expert - 2019</label>
                              </div>
                              {certificaciones.office2019.wordExpert.seleccionado && (
                                <div className="certificacion-archivo">
                                  <input
                                    type="file"
                                    onChange={(e) => handleArchivoChange('office2019', 'wordExpert', e)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  {certificaciones.office2019.wordExpert.nombreArchivo && (
                                    <small>Archivo: {certificaciones.office2019.wordExpert.nombreArchivo}</small>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="certificacion-card">
                              <div className="certificacion-header">
                                <input
                                  type="checkbox"
                                  checked={certificaciones.office2019.excelExpert.seleccionado}
                                  onChange={() => handleCertificacionToggle('office2019', 'excelExpert')}
                                />
                                <label>Microsoft Excel Expert - 2019</label>
                              </div>
                              {certificaciones.office2019.excelExpert.seleccionado && (
                                <div className="certificacion-archivo">
                                  <input
                                    type="file"
                                    onChange={(e) => handleArchivoChange('office2019', 'excelExpert', e)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  {certificaciones.office2019.excelExpert.nombreArchivo && (
                                    <small>Archivo: {certificaciones.office2019.excelExpert.nombreArchivo}</small>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Office 365 */}
                        <div className="certificacion-grupo">
                          <h5>Microsoft Office 365</h5>
                          <div className="certificaciones-grid">
                            <div className="certificacion-card">
                              <div className="certificacion-header">
                                <input
                                  type="checkbox"
                                  checked={certificaciones.office365.wordAsociado.seleccionado}
                                  onChange={() => handleCertificacionToggle('office365', 'wordAsociado')}
                                />
                                <label>Microsoft Word Asociado - 365</label>
                              </div>
                              {certificaciones.office365.wordAsociado.seleccionado && (
                                <div className="certificacion-archivo">
                                  <input
                                    type="file"
                                    onChange={(e) => handleArchivoChange('office365', 'wordAsociado', e)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  {certificaciones.office365.wordAsociado.nombreArchivo && (
                                    <small>Archivo: {certificaciones.office365.wordAsociado.nombreArchivo}</small>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="certificacion-card">
                              <div className="certificacion-header">
                                <input
                                  type="checkbox"
                                  checked={certificaciones.office365.excelAsociado.seleccionado}
                                  onChange={() => handleCertificacionToggle('office365', 'excelAsociado')}
                                />
                                <label>Microsoft Excel Asociado - 365</label>
                              </div>
                              {certificaciones.office365.excelAsociado.seleccionado && (
                                <div className="certificacion-archivo">
                                  <input
                                    type="file"
                                    onChange={(e) => handleArchivoChange('office365', 'excelAsociado', e)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  {certificaciones.office365.excelAsociado.nombreArchivo && (
                                    <small>Archivo: {certificaciones.office365.excelAsociado.nombreArchivo}</small>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="certificacion-card">
                              <div className="certificacion-header">
                                <input
                                  type="checkbox"
                                  checked={certificaciones.office365.powerpointAsociado.seleccionado}
                                  onChange={() => handleCertificacionToggle('office365', 'powerpointAsociado')}
                                />
                                <label>Microsoft PowerPoint Asociado - 365</label>
                              </div>
                              {certificaciones.office365.powerpointAsociado.seleccionado && (
                                <div className="certificacion-archivo">
                                  <input
                                    type="file"
                                    onChange={(e) => handleArchivoChange('office365', 'powerpointAsociado', e)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  {certificaciones.office365.powerpointAsociado.nombreArchivo && (
                                    <small>Archivo: {certificaciones.office365.powerpointAsociado.nombreArchivo}</small>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="certificacion-card">
                              <div className="certificacion-header">
                                <input
                                  type="checkbox"
                                  checked={certificaciones.office365.wordExpert.seleccionado}
                                  onChange={() => handleCertificacionToggle('office365', 'wordExpert')}
                                />
                                <label>Microsoft Word Expert - 365</label>
                              </div>
                              {certificaciones.office365.wordExpert.seleccionado && (
                                <div className="certificacion-archivo">
                                  <input
                                    type="file"
                                    onChange={(e) => handleArchivoChange('office365', 'wordExpert', e)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  {certificaciones.office365.wordExpert.nombreArchivo && (
                                    <small>Archivo: {certificaciones.office365.wordExpert.nombreArchivo}</small>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="certificacion-card">
                              <div className="certificacion-header">
                                <input
                                  type="checkbox"
                                  checked={certificaciones.office365.excelExpert.seleccionado}
                                  onChange={() => handleCertificacionToggle('office365', 'excelExpert')}
                                />
                                <label>Microsoft Excel Expert - 365</label>
                              </div>
                              {certificaciones.office365.excelExpert.seleccionado && (
                                <div className="certificacion-archivo">
                                  <input
                                    type="file"
                                    onChange={(e) => handleArchivoChange('office365', 'excelExpert', e)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  {certificaciones.office365.excelExpert.nombreArchivo && (
                                    <small>Archivo: {certificaciones.office365.excelExpert.nombreArchivo}</small>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="acciones-certificaciones">
                          <button className="btn-guardar-cert" onClick={guardarCertificacionesDocente} disabled={cargandoActualizacion}>
                            {cargandoActualizacion ? 'Guardando...' : '💾 Guardar Certificaciones'}
                          </button>
                          <button className="btn-cancelar-cert" onClick={() => setMostrarCertificaciones(false)}>
                            ❌ Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="certificaciones-lista">
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
                    )}
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
