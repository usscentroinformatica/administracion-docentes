// src/App.jsx
import { useState, useEffect } from 'react';
import DocenteForm from './components/DocenteForm';
import ListaDocentes from './components/ListaDocentes';
import DocentesFaltantes from './components/DocentesFaltantes'; // 👈 NUEVO IMPORT
import { verificarPasswordAdmin } from './firebase/authService';
import { db } from './firebase/config';
import { ref, get, child } from 'firebase/database';
import './App.css';

function App() {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [mostrarFaltantes, setMostrarFaltantes] = useState(false); // 👈 NUEVO ESTADO
  const [docenteLogueado, setDocenteLogueado] = useState(null);
  
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    const docenteSession = localStorage.getItem('docenteSession');
    if (docenteSession) {
      const sessionData = JSON.parse(docenteSession);
      const tiempoSesion = new Date().getTime() - sessionData.loginTime;
      if (tiempoSesion < 8 * 60 * 60 * 1000) {
        setDocenteLogueado(sessionData);
      } else {
        localStorage.removeItem('docenteSession');
      }
    }
  }, []);

  const togglePanel = () => {
    setPanelAbierto(!panelAbierto);
    if (panelAbierto) {
      setInputValue('');
      setError('');
    }
  };

  const verificarAcceso = async () => {
    if (!inputValue.trim()) {
      setError('❌ Ingrese contraseña o DNI');
      return;
    }

    setVerificando(true);
    setError('');

    try {
      // Primero verificar si es DNI de docente
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, 'docentes'));
      
      if (snapshot.exists()) {
        const docentes = snapshot.val();
        let docenteEncontrado = null;
        let docenteId = null;
        
        for (const [id, docente] of Object.entries(docentes)) {
          if (docente.dni === inputValue) {
            docenteEncontrado = docente;
            docenteId = id;
            break;
          }
        }
        
        if (docenteEncontrado) {
          // Es un docente
          const sessionData = {
            id: docenteId,
            nombres: docenteEncontrado.nombres,
            apellidos: docenteEncontrado.apellidos,
            dni: docenteEncontrado.dni,
            celular: docenteEncontrado.celular,
            correo: docenteEncontrado.correo,
            lugarResidencia: docenteEncontrado.lugarResidencia,
            gradoMaestria: docenteEncontrado.gradoMaestria,
            fotoBase64: docenteEncontrado.fotoBase64,
            loginTime: new Date().getTime()
          };
          
          localStorage.setItem('docenteSession', JSON.stringify(sessionData));
          setDocenteLogueado(sessionData);
          setPanelAbierto(false);
          setInputValue('');
          return;
        }
      }
      
      // Si no es DNI de docente, verificar contraseña de administrador
      const resultado = await verificarPasswordAdmin(inputValue);
      
      if (resultado.success) {
        setMostrarLista(true);
        setPanelAbierto(false);
        setInputValue('');
      } else {
        setError('❌ Contraseña o DNI incorrecto');
        setInputValue('');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('❌ Error al verificar');
    } finally {
      setVerificando(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      verificarAcceso();
    }
  };

  // Si hay un docente logueado, mostrar su perfil
  if (docenteLogueado) {
    return (
      <ListaDocentes 
        onClose={() => {
          localStorage.removeItem('docenteSession');
          setDocenteLogueado(null);
        }}
        modo="docente"
        docenteId={docenteLogueado.id}
      />
    );
  }

  return (
    <div className="app">
      <DocenteForm />
      
      {/* 👈 NUEVO BOTÓN FLOTANTE PARA VER DOCENTES FALTANTES */}
      <button 
        className="btn-flotante-faltantes" 
        onClick={() => setMostrarFaltantes(!mostrarFaltantes)}
      >
        📋
      </button>
      
      <button className="btn-flotante" onClick={togglePanel}>
        ☰
      </button>

      <div className={`panel-lateral ${panelAbierto ? 'abierto' : ''}`}>
        <div className="panel-header">
          <h3>📁 Acceso</h3>
          <button className="btn-cerrar-panel" onClick={togglePanel}>✕</button>
        </div>
        
        <div className="panel-contenido">
          <div className="password-section">
            <label className="password-label">🔑 Contraseña / DNI</label>
            <input
              type="text"
              className="password-input-panel"
              placeholder="Ingrese contraseña de admin o su DNI"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={verificando}
            />
            {error && <p className="error-password">{error}</p>}
            <button className="btn-verificar" onClick={verificarAcceso} disabled={verificando}>
              {verificando ? '...' : 'Ingresar'}
            </button>
            <p className="password-hint">Admin: use su contraseña | Docente: use su DNI</p>
          </div>
        </div>
      </div>

      {mostrarLista && (
        <ListaDocentes 
          onClose={() => setMostrarLista(false)} 
          modo="admin"
        />
      )}

      {/* 👈 NUEVO: Mostrar docentes faltantes */}
      {mostrarFaltantes && (
        <div className="modal-faltantes">
          <div className="modal-faltantes-overlay" onClick={() => setMostrarFaltantes(false)}></div>
          <div className="modal-faltantes-content">
            <button 
              className="btn-cerrar-modal" 
              onClick={() => setMostrarFaltantes(false)}
            >
              ✕
            </button>
            <DocentesFaltantes />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
