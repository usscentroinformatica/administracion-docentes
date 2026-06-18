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
  
  // Estados para certificaciones
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

  // Estado para el switch (true = registrados, false = no registrados)
  const [mostrarRegistrados, setMostrarRegistrados] = useState(true);
  // Estado para docentes faltantes
  const [docentesFaltantes, setDocentesFaltantes] = useState([]);
  const [cargandoFaltantes, setCargandoFaltantes] = useState(false);

  // URL de tu Google Apps Script
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxkSmF3QOCHamoi9tjoLqJcfnJVAgWlBhGd2zBU14kRn2wXQiTiLm1QGjcXPH1lNOr9/exec';
  const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1GOJZQDx1XSpudu_80gok1Nuq9YzMvKkLR9fy-jYsyt0/edit';

  const abrirGoogleSheets = () => {
    window.open(GOOGLE_SHEETS_URL, '_blank');
  };

  // Función para obtener docentes faltantes desde Google Sheets
  const cargarDocentesFaltantes = async () => {
    setCargandoFaltantes(true);
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=obtenerFaltantes`);
      const result = await response.json();
      
      if (result.success) {
        setDocentesFaltantes(result.data);
      } else {
        console.error('Error al cargar docentes faltantes:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargandoFaltantes(false);
    }
  };

  // Función para alternar el switch
  const toggleSwitch = () => {
    const nuevoEstado = !mostrarRegistrados;
    setMostrarRegistrados(nuevoEstado);
    
    if (!nuevoEstado && docentesFaltantes.length === 0) {
      cargarDocentesFaltantes();
    }
  };

  // Función para obtener el estado actual de las certificaciones
  const obtenerEstadoCertificaciones = () => {
    return {
      word2019Asociado: certificaciones.office2019.wordAsociado.seleccionado ? 'Sí' : 'No',
      excel2019Asociado: certificaciones.office2019.excelAsociado.seleccionado ? 'Sí' : 'No',
      ppt2019Asociado: certificaciones.office2019.powerpointAsociado.seleccionado ? 'Sí' : 'No',
      word2019Expert: certificaciones.office2019.wordExpert.seleccionado ? 'Sí' : 'No',
      excel2019Expert: certificaciones.office2019.excelExpert.seleccionado ? 'Sí' : 'No',
      word365Asociado: certificaciones.office365.wordAsociado.seleccionado ? 'Sí' : 'No',
      excel365Asociado: certificaciones.office365.excelAsociado.seleccionado ? 'Sí' : 'No',
      ppt365Asociado: certificaciones.office365.powerpointAsociado.seleccionado ? 'Sí' : 'No',
      word365Expert: certificaciones.office365.wordExpert.seleccionado ? 'Sí' : 'No',
      excel365Expert: certificaciones.office365.excelExpert.seleccionado ? 'Sí' : 'No'
    };
  };

  // Función para actualizar Google Sheets
  const actualizarGoogleSheets = async (docenteData, estadoCerts) => {
    try {
      const fechaRegistro = docenteData.fechaRegistro 
        ? new Date(docenteData.fechaRegistro).toISOString() 
        : new Date().toISOString();
      
      const datosParaGoogle = {
        fechaRegistro: fechaRegistro,
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

  // ============================================
  // NUEVA FUNCIÓN: Limpiar selección de docente
  // ============================================
  const limpiarSeleccionDocente = () => {
    setSelectedDocente(null);
    setCertificacionesMap({});
    setCertificacionesDetalle([]);
    setModoEdicion(false);
    setEditandoDocente(null);
    setMostrarCertificaciones(false);
    setMensaje('');
    
    // Resetear el estado de certificaciones a su valor inicial
    setCertificaciones({
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
  };

  useEffect(() => {
    if (modo === 'docente' && docenteId) {
      cargarDocenteUnico(docenteId);
      cargarCertificacionesState(docenteId);
    } else {
      cargarDocentes();
    }
  }, [modo, docenteId]);

  // Limpiar cuando se desmonta el componente
  useEffect(() => {
    return () => {
      limpiarSeleccionDocente();
    };
  }, []);

  // ============================================
  // MODIFICADA: Cargar certificaciones al estado local
  // ============================================
  const cargarCertificacionesState = async (id) => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `certificaciones/${id}`));
      
      // Crear un nuevo objeto de certificaciones con todos los valores en false
      const nuevasCertificaciones = {
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
      };
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Mapear cada certificación a su estado
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
          } else if (nombre.includes('Excel Asociado - 2019')) {
            nuevasCertificaciones.office2019.excelAsociado = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          } else if (nombre.includes('PowerPoint Asociado - 2019')) {
            nuevasCertificaciones.office2019.powerpointAsociado = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          } else if (nombre.includes('Word Expert - 2019')) {
            nuevasCertificaciones.office2019.wordExpert = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          } else if (nombre.includes('Excel Expert - 2019')) {
            nuevasCertificaciones.office2019.excelExpert = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          }
          // Office 365
          else if (nombre.includes('Word Asociado - 365')) {
            nuevasCertificaciones.office365.wordAsociado = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          } else if (nombre.includes('Excel Asociado - 365')) {
            nuevasCertificaciones.office365.excelAsociado = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          } else if (nombre.includes('PowerPoint Asociado - 365')) {
            nuevasCertificaciones.office365.powerpointAsociado = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          } else if (nombre.includes('Word Expert - 365')) {
            nuevasCertificaciones.office365.wordExpert = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          } else if (nombre.includes('Excel Expert - 365')) {
            nuevasCertificaciones.office365.excelExpert = { 
              seleccionado: true, 
              archivo: null, 
              nombreArchivo: cert.nombreArchivo || '',
              archivoBase64: cert.archivoBase64 
            };
          }
        }
      }
      
      // Establecer el nuevo estado (esto reemplazará completamente el anterior)
      setCertificaciones(nuevasCertificaciones);
      
    } catch (error) {
      console.error('Error al cargar certificaciones:', error);
    }
  };

  const cargarDocenteUnico = async (id) => {
    setLoading(true);
    try {
      console.log('🔍 Cargando docente con ID:', id);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `docentes/${id}`));
      
      console.log('📸 Snapshot existe:', snapshot.exists());
      
      if (snapshot.exists()) {
        const docente = { id, ...snapshot.val() };
        console.log('👤 Docente cargado:', docente);
        setDocentes([docente]);
        setSelectedDocente(docente);
        await cargarCertificacionesDocente(id);
      } else {
        console.error('❌ No se encontró el docente con ID:', id);
      }
    } catch (error) {
      console.error('❌ Error al cargar docente:', error);
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

  // ============================================
  // MODIFICADA: Cargar certificaciones del docente
  // ============================================
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
        
        // Actualizar también el estado de checkboxes
        await cargarCertificacionesState(docenteId);
        
      } else {
        setCertificacionesMap({});
        setCertificacionesDetalle([]);
        
        // Resetear checkboxes si no hay certificaciones
        setCertificaciones({
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
      }
    } catch (error) {
      console.error('Error al cargar certificaciones:', error);
      setCertificacionesMap({});
      setCertificacionesDetalle([]);
    }
  };

  // ============================================
  // MODIFICADA: Seleccionar docente
  // ============================================
  const handleSelectDocente = async (docente) => {
    if (modo === 'docente') return;
    
    // IMPORTANTE: Primero limpiar el estado actual
    limpiarSeleccionDocente();
    
    // Luego seleccionar el nuevo docente
    setSelectedDocente(docente);
    
    // Cargar certificaciones con un pequeño delay para asegurar el renderizado
    setTimeout(async () => {
      await cargarCertificacionesDocente(docente.id);
    }, 50);
  };

  // Funciones para edición de datos personales
  const iniciarEdicion = () => {
    setEditandoDocente({ 
      ...selectedDocente,
      apellidos: selectedDocente.apellidos || '',
      nombres: selectedDocente.nombres || '',
      dni: selectedDocente.dni || '',
      fechaNacimiento: selectedDocente.fechaNacimiento || '',
      genero: selectedDocente.genero || '',
      correo: selectedDocente.correo || '',
      celular: selectedDocente.celular || '',
      lugarResidencia: selectedDocente.lugarResidencia || '',
      gradoMaestria: selectedDocente.gradoMaestria || ''
    });
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
      // Guardar TODOS los campos en Firebase
      const docenteRef = ref(db, `docentes/${selectedDocente.id}`);
      await update(docenteRef, {
        apellidos: editandoDocente.apellidos,
        nombres: editandoDocente.nombres,
        fechaNacimiento: editandoDocente.fechaNacimiento,
        genero: editandoDocente.genero,
        correo: editandoDocente.correo,
        celular: editandoDocente.celular,
        lugarResidencia: editandoDocente.lugarResidencia,
        gradoMaestria: editandoDocente.gradoMaestria
      });
      
      // Actualizar el estado local
      setSelectedDocente(editandoDocente);
      const nuevosDocentes = docentes.map(d => 
        d.id === editandoDocente.id ? editandoDocente : d
      );
      setDocentes(nuevosDocentes);
      
      // Obtener el estado de certificaciones
      const estadoCerts = obtenerEstadoCertificaciones();
      
      // Enviar a Google Sheets con todos los datos
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

  // Funciones para certificaciones
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

  // Determinar qué lista mostrar
  const docentesAMostrar = mostrarRegistrados ? docentes : docentesFaltantes;
  const tituloLista = mostrarRegistrados 
    ? `📚 Lista de Docentes (${docentes.length} registrados)`
    : `📋 Docentes No Registrados (${docentesFaltantes.length} pendientes)`;
  const isLoading = mostrarRegistrados ? loading : cargandoFaltantes;

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
          ) : docentes.length === 0 && modo === 'admin' ? (
            <div className="sin-docentes">No hay docentes registrados</div>
          ) : (
            <div className="lista-contenido">
              {/* Modo Admin: Mostrar lista de docentes */}
              {modo === 'admin' && (
                <div className="lista-docentes">
                  <div className="lista-header-switch">
                    <h4>{tituloLista}</h4>
                    <div className="switch-container">
                      <span className={`switch-label ${!mostrarRegistrados ? 'active' : ''}`}>
                        🔴 Pendientes
                      </span>
                      <button 
                        className={`switch-toggle ${mostrarRegistrados ? 'active' : 'inactive'}`}
                        onClick={toggleSwitch}
                      >
                        <div className="switch-slider">
                          <div className="switch-thumb">
                            {mostrarRegistrados ? '✅' : '⏳'}
                          </div>
                        </div>
                      </button>
                      <span className={`switch-label ${mostrarRegistrados ? 'active' : ''}`}>
                        🟢 Registrados
                      </span>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="loading-spinner">Cargando...</div>
                  ) : docentesAMostrar.length === 0 ? (
                    <div className="sin-docentes">
                      {mostrarRegistrados 
                        ? 'No hay docentes registrados' 
                        : '🎉 ¡Todos los docentes están registrados!'}
                    </div>
                  ) : (
                    <>
                      {docentesAMostrar.map((docente, index) => (
                        <div 
                          key={mostrarRegistrados ? docente.id : `faltante-${index}`}
                          className={`docente-item ${selectedDocente?.id === docente.id ? 'active' : ''}`}
                          onClick={() => mostrarRegistrados && handleSelectDocente(docente)}
                          style={!mostrarRegistrados ? { cursor: 'default' } : {}}
                        >
                          <div className="docente-item-foto">
                            {mostrarRegistrados && docente.fotoBase64 ? (
                              <img src={docente.fotoBase64} alt={docente.nombres} />
                            ) : mostrarRegistrados ? (
                              <div className="foto-placeholder-mini">📷</div>
                            ) : (
                              <div className="foto-placeholder-mini">👤</div>
                            )}
                          </div>
                          <div className="docente-item-info">
                            <strong>
                              {mostrarRegistrados 
                                ? `${docente.apellidos} ${docente.nombres}` 
                                : docente.docente || `${docente.apellidos} ${docente.nombres}`
                              }
                            </strong>
                            <small>
                              {mostrarRegistrados 
                                ? `DNI: ${docente.dni}` 
                                : `📧 ${docente.correo}`
                              }
                            </small>
                          </div>
                          {!mostrarRegistrados && (
                            <div className="docente-item-estado">
                              <span className="badge-pendiente">⏳ Pendiente</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Detalle del docente - Visible en modo admin (al seleccionar) y en modo docente */}
              {selectedDocente && (modo === 'admin' || modo === 'docente') && (
                // ============================================
                // KEY ÚNICA PARA FORZAR RE-RENDER COMPLETO
                // ============================================
                <div 
                  key={`docente-detalle-${selectedDocente.id}-${Date.now()}`}
                  className="docente-detalle"
                >
                  <div className="detalle-header">
                    <h4>📄 Información Personal</h4>
                    {/* Botón Editar - Solo visible en modo docente */}
                    {modo === 'docente' && !modoEdicion && (
                      <button className="btn-editar-perfil" onClick={iniciarEdicion}>
                        ✏️ Editar Datos
                      </button>
                    )}
                    {/* Botón Cancelar edición - Solo visible en modo docente y editando */}
                    {modo === 'docente' && modoEdicion && (
                      <button className="btn-cancelar-edicion-header" onClick={cancelarEdicion}>
                        ❌ Cancelar
                      </button>
                    )}
                  </div>
                  
                  <div className="detalle-foto">
                    {selectedDocente.fotoBase64 ? (
                      <img 
                        key={`foto-${selectedDocente.id}`}
                        src={selectedDocente.fotoBase64} 
                        alt={selectedDocente.nombres} 
                        className="detalle-imagen" 
                      />
                    ) : (
                      <div className="detalle-sin-foto">Sin foto</div>
                    )}
                  </div>

                  {modo === 'docente' && modoEdicion ? (
                    // ============================================
                    // MODO EDICIÓN - TODOS LOS CAMPOS EDITABLES
                    // ============================================
                    <div className="detalle-info-edicion" key={`edit-${selectedDocente.id}`}>
                      <div className="campo-edicion" key={`apellidos-${selectedDocente.id}`}>
                        <label>Apellidos *</label>
                        <input 
                          type="text" 
                          name="apellidos" 
                          value={editandoDocente?.apellidos || ''} 
                          onChange={handleEditChange}
                          disabled={cargandoActualizacion}
                          required
                        />
                      </div>
                      <div className="campo-edicion" key={`nombres-${selectedDocente.id}`}>
                        <label>Nombres *</label>
                        <input 
                          type="text" 
                          name="nombres" 
                          value={editandoDocente?.nombres || ''} 
                          onChange={handleEditChange}
                          disabled={cargandoActualizacion}
                          required
                        />
                      </div>
                      <div className="campo-edicion" key={`dni-${selectedDocente.id}`}>
                        <label>DNI *</label>
                        <input 
                          type="text" 
                          name="dni" 
                          value={editandoDocente?.dni || ''} 
                          disabled 
                          style={{ backgroundColor: '#e9ecef' }}
                        />
                        <small className="hint-text">El DNI no se puede modificar</small>
                      </div>
                      <div className="campo-edicion" key={`fecha-${selectedDocente.id}`}>
                        <label>Fecha de Nacimiento *</label>
                        <input 
                          type="date" 
                          name="fechaNacimiento" 
                          value={editandoDocente?.fechaNacimiento || ''} 
                          onChange={handleEditChange}
                          disabled={cargandoActualizacion}
                          required
                        />
                      </div>
                      <div className="campo-edicion" key={`genero-${selectedDocente.id}`}>
                        <label>Género *</label>
                        <select 
                          name="genero" 
                          value={editandoDocente?.genero || ''} 
                          onChange={handleEditChange}
                          disabled={cargandoActualizacion}
                          required
                        >
                          <option value="">Seleccione un género</option>
                          <option value="femenino">FEMENINO</option>
                          <option value="masculino">MASCULINO</option>
                          <option value="otro">OTRO</option>
                          <option value="prefiero_no_decir">PREFIERO NO DECIR</option>
                        </select>
                      </div>
                      <div className="campo-edicion" key={`correo-${selectedDocente.id}`}>
                        <label>Correo Institucional *</label>
                        <input 
                          type="email" 
                          name="correo" 
                          value={editandoDocente?.correo || ''} 
                          onChange={handleEditChange}
                          disabled={cargandoActualizacion}
                          required
                        />
                      </div>
                      <div className="campo-edicion" key={`celular-${selectedDocente.id}`}>
                        <label>Celular *</label>
                        <input 
                          type="tel" 
                          name="celular" 
                          value={editandoDocente?.celular || ''} 
                          onChange={handleEditChange} 
                          maxLength="9"
                          disabled={cargandoActualizacion}
                          required
                        />
                        <small className="hint-text">9 dígitos numéricos</small>
                      </div>
                      <div className="campo-edicion" key={`residencia-${selectedDocente.id}`}>
                        <label>Lugar de Residencia *</label>
                        <input 
                          type="text" 
                          name="lugarResidencia" 
                          value={editandoDocente?.lugarResidencia || ''} 
                          onChange={handleEditChange}
                          disabled={cargandoActualizacion}
                          required
                        />
                      </div>
                      <div className="campo-edicion" key={`maestria-${selectedDocente.id}`}>
                        <label>Grado de Maestría *</label>
                        <select 
                          name="gradoMaestria" 
                          value={editandoDocente?.gradoMaestria || ''} 
                          onChange={handleEditChange}
                          disabled={cargandoActualizacion}
                          required
                        >
                          <option value="">Seleccione un grado</option>
                          <option value="ninguno">NINGUNO</option>
                          <option value="cursando">CURSANDO MAESTRÍA</option>
                          <option value="magister">MAGÍSTER</option>
                          <option value="doctor">DOCTOR</option>
                        </select>
                      </div>
                      <div className="acciones-edicion">
                        <button className="btn-guardar-edicion" onClick={guardarCambios} disabled={cargandoActualizacion}>
                          {cargandoActualizacion ? 'Guardando...' : '💾 Guardar Cambios'}
                        </button>
                        <button className="btn-cancelar-edicion" onClick={cancelarEdicion} disabled={cargandoActualizacion}>
                          ❌ Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // ============================================
                    // MODO VISUALIZACIÓN - MOSTRAR DATOS
                    // ============================================
                    <div className="detalle-info" key={`info-${selectedDocente.id}`}>
                      <p key={`nombre-${selectedDocente.id}`}>
                        <strong>Nombres:</strong> {selectedDocente.nombres || 'No especificado'}
                      </p>
                      <p key={`apellido-${selectedDocente.id}`}>
                        <strong>Apellidos:</strong> {selectedDocente.apellidos || 'No especificado'}
                      </p>
                      <p key={`dni-${selectedDocente.id}`}>
                        <strong>DNI:</strong> {selectedDocente.dni || 'No especificado'}
                      </p>
                      <p key={`fecha-${selectedDocente.id}`}>
                        <strong>Fecha Nacimiento:</strong> {selectedDocente.fechaNacimiento || 'No especificado'}
                      </p>
                      <p key={`genero-${selectedDocente.id}`}>
                        <strong>Género:</strong> {selectedDocente.genero || 'No especificado'}
                      </p>
                      <p key={`correo-${selectedDocente.id}`}>
                        <strong>Correo:</strong> {selectedDocente.correo || 'No especificado'}
                      </p>
                      <p key={`celular-${selectedDocente.id}`}>
                        <strong>Celular:</strong> {selectedDocente.celular || 'No especificado'}
                      </p>
                      <p key={`residencia-${selectedDocente.id}`}>
                        <strong>Residencia:</strong> {selectedDocente.lugarResidencia || 'No especificado'}
                      </p>
                      <p key={`maestria-${selectedDocente.id}`}>
                        <strong>Grado Maestría:</strong> {selectedDocente.gradoMaestria || 'No especificado'}
                      </p>
                    </div>
                  )}

                  {/* Sección de Certificaciones - Visible en ambos modos */}
                  <div className="certificaciones-section" key={`certs-${selectedDocente.id}`}>
                    <div className="certificaciones-header">
                      <h4>📜 Certificaciones</h4>
                      {modo === 'docente' && !mostrarCertificaciones && (
                        <button className="btn-agregar-cert" onClick={() => setMostrarCertificaciones(true)}>
                          ➕ Agregar/Editar Certificaciones
                        </button>
                      )}
                    </div>

                    {mostrarCertificaciones ? (
                      <div className="certificaciones-edicion" key={`edit-certs-${selectedDocente.id}`}>
                        {/* Office 2019 */}
                        <div className="certificacion-grupo">
                          <h5>Microsoft Office 2019</h5>
                          <div className="certificaciones-grid">
                            {Object.entries(certificaciones.office2019).map(([tipo, datos]) => (
                              <div key={`${selectedDocente.id}-2019-${tipo}`} className="certificacion-card">
                                <div className="certificacion-header">
                                  <input
                                    type="checkbox"
                                    checked={datos.seleccionado}
                                    onChange={() => handleCertificacionToggle('office2019', tipo)}
                                  />
                                  <label>{getNombreCertificado('office2019', tipo)}</label>
                                </div>
                                {datos.seleccionado && (
                                  <div className="certificacion-archivo">
                                    <input
                                      type="file"
                                      onChange={(e) => handleArchivoChange('office2019', tipo, e)}
                                      accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                    {datos.nombreArchivo && (
                                      <small>Archivo: {datos.nombreArchivo}</small>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Office 365 */}
                        <div className="certificacion-grupo">
                          <h5>Microsoft Office 365</h5>
                          <div className="certificaciones-grid">
                            {Object.entries(certificaciones.office365).map(([tipo, datos]) => (
                              <div key={`${selectedDocente.id}-365-${tipo}`} className="certificacion-card">
                                <div className="certificacion-header">
                                  <input
                                    type="checkbox"
                                    checked={datos.seleccionado}
                                    onChange={() => handleCertificacionToggle('office365', tipo)}
                                  />
                                  <label>{getNombreCertificado('office365', tipo)}</label>
                                </div>
                                {datos.seleccionado && (
                                  <div className="certificacion-archivo">
                                    <input
                                      type="file"
                                      onChange={(e) => handleArchivoChange('office365', tipo, e)}
                                      accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                    {datos.nombreArchivo && (
                                      <small>Archivo: {datos.nombreArchivo}</small>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
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
                      <div className="certificaciones-lista" key={`view-certs-${selectedDocente.id}`}>
                        {certificadosList.map(cert => {
                          const certificadoData = certificacionesDetalle.find(c => c.nombre === cert);
                          const tieneCertificado = !!certificacionesMap[cert];
                          
                          return (
                            <div key={`${selectedDocente.id}-${cert}`} className="cert-item">
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
