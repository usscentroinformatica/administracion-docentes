// src/App.jsx
import { useState, useEffect } from 'react';
import DocenteForm from './components/DocenteForm';
import ListaDocentes from './components/ListaDocentes';
import { verificarPasswordAdmin } from './firebase/authService';
import { db } from './firebase/config';
import { ref, get, child } from 'firebase/database';
import './App.css';

function App() {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [docenteLogueado, setDocenteLogueado] = useState(null);
  
  // Estado para Admin
  const [passwordInput, setPasswordInput] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [verificando, setVerificando] = useState(false);
  
  // Estado para Docente (solo DNI)
  const [dniDocente, setDniDocente] = useState('');
  const [errorDocente, setErrorDocente] = useState('');
  const [verificandoDocente, setVerificandoDocente] = useState(false);
  const [modoAcceso, setModoAcceso] = useState('admin');

  // Verificar sesión de docente al cargar
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
      setPasswordInput('');
      setErrorPassword('');
      setDniDocente('');
      setErrorDocente('');
      setModoAcceso('admin');
    }
  };

  const verificarPassword = async () => {
    if (!passwordInput.trim()) {
      setErrorPassword('❌ Ingrese la contraseña');
      return;
    }

    setVerificando(true);
    setErrorPassword('');

    try {
      const resultado = await verificarPasswordAdmin(passwordInput);
      
      if (resultado.success) {
        setMostrarLista(true);
        setPanelAbierto(false);
        setPasswordInput('');
      } else {
        setErrorPassword('❌ Contraseña incorrecta');
        setPasswordInput('');
      }
    } catch (error) {
      setErrorPassword('❌ Error al verificar contraseña');
    } finally {
      setVerificando(false);
    }
  };

  // Verificar docente SOLO CON DNI (sin contraseña)
  const verificarDocente = async () => {
    if (!dniDocente.trim()) {
      setErrorDocente('❌ Ingrese su DNI');
      return;
    }

    setVerificandoDocente(true);
    setErrorDocente('');

    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, 'docentes'));
      
      if (snapshot.exists()) {
        const docentes = snapshot.val();
        let docenteEncontrado = null;
        let docenteId = null;
        
        for (const [id, docente] of Object.entries(docentes)) {
          if (docente.dni === dniDocente) {
            docenteEncontrado = docente;
            docenteId = id;
            break;
          }
        }
        
        if (docenteEncontrado) {
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
            fechaNacimiento: docenteEncontrado.fechaNacimiento,
            loginTime: new Date().getTime()
          };
          
          localStorage.setItem('docenteSession', JSON.stringify(sessionData));
          setDocenteLogueado(sessionData);
          setPanelAbierto(false);
          setDniDocente('');
        } else {
          setErrorDocente('❌ DNI no encontrado');
          setDniDocente('');
        }
      } else {
        setErrorDocente('❌ No hay docentes registrados');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorDocente('❌ Error al conectar con el servidor');
    } finally {
      setVerificandoDocente(false);
    }
  };

  const handleKeyPressAdmin = (e) => {
    if (e.key === 'Enter') {
      verificarPassword();
    }
  };

  const handleKeyPressDocente = (e) => {
    if (e.key === 'Enter') {
      verificarDocente();
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
      
      <button className="btn-flotante" onClick={togglePanel}>
        ☰
      </button>

      <div className={`panel-lateral ${panelAbierto ? 'abierto' : ''}`}>
        <div className="panel-header">
          <h3>📁 Acceso al Sistema</h3>
          <button className="btn-cerrar-panel" onClick={togglePanel}>✕</button>
        </div>
        
        <div className="panel-contenido">
          <div className="selector-acceso">
            <button 
              className={`selector-btn ${modoAcceso === 'admin' ? 'active' : ''}`}
              onClick={() => setModoAcceso('admin')}
            >
              👑 Administrador
            </button>
            <button 
              className={`selector-btn ${modoAcceso === 'docente' ? 'active' : ''}`}
              onClick={() => setModoAcceso('docente')}
            >
              👨‍🏫 Docente
            </button>
          </div>

          {modoAcceso === 'admin' && (
            <div className="acceso-admin">
              <label className="password-label">🔒 Contraseña de Administrador</label>
              <input
                type="password"
                className="password-input-panel"
                placeholder="Ingrese la contraseña"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={handleKeyPressAdmin}
                disabled={verificando}
              />
              {errorPassword && <p className="error-password">{errorPassword}</p>}
              <button className="btn-verificar" onClick={verificarPassword} disabled={verificando}>
                {verificando ? '⏳ Verificando...' : '📋 Ver Docentes'}
              </button>
            </div>
          )}

          {modoAcceso === 'docente' && (
            <div className="acceso-docente">
              <label className="password-label">📄 Ingrese su DNI</label>
              <input
                type="text"
                className="password-input-panel"
                placeholder="DNI (8 dígitos)"
                value={dniDocente}
                onChange={(e) => setDniDocente(e.target.value)}
                onKeyPress={handleKeyPressDocente}
                disabled={verificandoDocente}
                maxLength="8"
                autoFocus
              />
              {errorDocente && <p className="error-password">{errorDocente}</p>}
              <button className="btn-verificar" onClick={verificarDocente} disabled={verificandoDocente}>
                {verificandoDocente ? '⏳ Verificando...' : '👨‍🏫 Ingresar a Mi Perfil'}
              </button>
              <p className="password-hint">
                ℹ️ Ingrese su DNI para ver y editar su información
              </p>
            </div>
          )}
        </div>
      </div>

      {mostrarLista && (
        <ListaDocentes 
          onClose={() => setMostrarLista(false)} 
          modo="admin"
        />
      )}
    </div>
  );
}

export default App;
