// src/App.jsx
import { useState, useEffect } from 'react';
import DocenteForm from './components/DocenteForm';
import ListaDocentes from './components/ListaDocentes';
import PanelDocente from './components/PanelDocente';
import { verificarPasswordAdmin } from './firebase/authService';
import { db } from './firebase/config';
import { ref, get, child } from 'firebase/database';
import './App.css';

function App() {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [mostrarPanelDocente, setMostrarPanelDocente] = useState(false);
  const [docenteLogueado, setDocenteLogueado] = useState(null);
  
  // Estado para Admin
  const [passwordInput, setPasswordInput] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [verificando, setVerificando] = useState(false);
  
  // Estado para Docente
  const [dniDocente, setDniDocente] = useState('');
  const [passwordDocente, setPasswordDocente] = useState('');
  const [errorDocente, setErrorDocente] = useState('');
  const [verificandoDocente, setVerificandoDocente] = useState(false);
  const [modoAcceso, setModoAcceso] = useState('admin'); // 'admin' o 'docente'

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
    // Resetear estados al cerrar
    if (panelAbierto) {
      setPasswordInput('');
      setErrorPassword('');
      setDniDocente('');
      setPasswordDocente('');
      setErrorDocente('');
      setModoAcceso('admin');
    }
  };

  // Verificar contraseña de Administrador
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
        setErrorPassword('');
        setMostrarLista(true);
        setPanelAbierto(false);
        setPasswordInput('');
      } else {
        setErrorPassword('❌ Contraseña incorrecta');
        setPasswordInput('');
      }
    } catch (error) {
      setErrorPassword('❌ Error al verificar contraseña');
      console.error(error);
    } finally {
      setVerificando(false);
    }
  };

  // Verificar acceso de Docente
  const verificarDocente = async () => {
    if (!dniDocente.trim()) {
      setErrorDocente('❌ Ingrese su DNI');
      return;
    }
    if (!passwordDocente.trim()) {
      setErrorDocente('❌ Ingrese su contraseña');
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
          const passwordValida = (passwordDocente === docenteEncontrado.fechaNacimiento);
          
          if (passwordValida) {
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
            setPasswordDocente('');
          } else {
            setErrorDocente('❌ Contraseña incorrecta. Use su fecha de nacimiento (YYYY-MM-DD)');
            setPasswordDocente('');
          }
        } else {
          setErrorDocente('❌ DNI no encontrado');
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

  // Si hay un docente logueado, mostrar su panel
  if (docenteLogueado) {
    return (
      <PanelDocente 
        docente={docenteLogueado} 
        onLogout={() => {
          localStorage.removeItem('docenteSession');
          setDocenteLogueado(null);
        }} 
      />
    );
  }

  return (
    <div className="app">
      <DocenteForm />
      
      {/* Botón flotante */}
      <button className="btn-flotante" onClick={togglePanel}>
        ☰
      </button>

      {/* Panel lateral */}
      <div className={`panel-lateral ${panelAbierto ? 'abierto' : ''}`}>
        <div className="panel-header">
          <h3>📁 Acceso al Sistema</h3>
          <button className="btn-cerrar-panel" onClick={togglePanel}>✕</button>
        </div>
        
        <div className="panel-contenido">
          {/* Selector de tipo de acceso */}
          <div className="selector-acceso">
            <button 
              className={`selector-btn ${modoAcceso === 'admin' ? 'active' : ''}`}
              onClick={() => {
                setModoAcceso('admin');
                setErrorPassword('');
                setErrorDocente('');
              }}
            >
              👑 Administrador
            </button>
            <button 
              className={`selector-btn ${modoAcceso === 'docente' ? 'active' : ''}`}
              onClick={() => {
                setModoAcceso('docente');
                setErrorPassword('');
                setErrorDocente('');
              }}
            >
              👨‍🏫 Docente
            </button>
          </div>

          {/* Panel de Administrador */}
          {modoAcceso === 'admin' && (
            <div className="acceso-admin">
              <label className="password-label">🔒 Contraseña de Administrador</label>
              <input
                type="password"
                className="password-input-panel"
                placeholder="Ingrese la contraseña de admin"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={handleKeyPressAdmin}
                disabled={verificando}
              />
              {errorPassword && (
                <p className="error-password">{errorPassword}</p>
              )}
              <button 
                className="btn-verificar" 
                onClick={verificarPassword}
                disabled={verificando}
              >
                {verificando ? '⏳ Verificando...' : '📋 Ver Docentes Registrados'}
              </button>
              <p className="password-hint">Ingrese la contraseña de administrador para gestionar docentes</p>
            </div>
          )}

          {/* Panel de Docente */}
          {modoAcceso === 'docente' && (
            <div className="acceso-docente">
              <label className="password-label">📄 DNI</label>
              <input
                type="text"
                className="password-input-panel"
                placeholder="Ingrese su DNI (8 dígitos)"
                value={dniDocente}
                onChange={(e) => setDniDocente(e.target.value)}
                onKeyPress={handleKeyPressDocente}
                disabled={verificandoDocente}
                maxLength="8"
              />
              
              <label className="password-label" style={{ marginTop: '15px' }}>🔑 Contraseña</label>
              <input
                type="password"
                className="password-input-panel"
                placeholder="Su fecha de nacimiento (YYYY-MM-DD)"
                value={passwordDocente}
                onChange={(e) => setPasswordDocente(e.target.value)}
                onKeyPress={handleKeyPressDocente}
                disabled={verificandoDocente}
              />
              
              {errorDocente && (
                <p className="error-password">{errorDocente}</p>
              )}
              
              <button 
                className="btn-verificar" 
                onClick={verificarDocente}
                disabled={verificandoDocente}
              >
                {verificandoDocente ? '⏳ Verificando...' : '👨‍🏫 Ingresar a Mi Perfil'}
              </button>
              
              <p className="password-hint">
                ℹ️ Use su fecha de nacimiento como contraseña (ej: 1990-05-15)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de lista de docentes (Admin) */}
      {mostrarLista && (
        <ListaDocentes onClose={() => {
          setMostrarLista(false);
          setPasswordInput('');
        }} />
      )}
    </div>
  );
}

export default App;
