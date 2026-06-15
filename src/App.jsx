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
  
  // Estado para Admin (como estaba)
  const [passwordInput, setPasswordInput] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [verificando, setVerificando] = useState(false);
  
  // Estado para Docente (solo DNI)
  const [dniDocente, setDniDocente] = useState('');
  const [errorDocente, setErrorDocente] = useState('');
  const [verificandoDocente, setVerificandoDocente] = useState(false);

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
      setErrorDocente('❌ Error al conectar');
    } finally {
      setVerificandoDocente(false);
    }
  };

  const handleKeyPress = (e) => {
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
          <h3>📁 Acceso</h3>
          <button className="btn-cerrar-panel" onClick={togglePanel}>✕</button>
        </div>
        
        <div className="panel-contenido">
          {/* Campo para Administrador */}
          <div className="password-section">
            <label className="password-label">🔒 Administrador</label>
            <input
              type="password"
              className="password-input-panel"
              placeholder="Contraseña"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={verificando}
            />
            {errorPassword && <p className="error-password">{errorPassword}</p>}
            <button className="btn-verificar" onClick={verificarPassword} disabled={verificando}>
              {verificando ? '...' : 'Ver Docentes'}
            </button>
          </div>

          {/* Separador */}
          <div className="separador"></div>

          {/* Campo para Docente */}
          <div className="password-section">
            <label className="password-label">👨‍🏫 Docente</label>
            <input
              type="text"
              className="password-input-panel"
              placeholder="DNI"
              value={dniDocente}
              onChange={(e) => setDniDocente(e.target.value)}
              onKeyPress={handleKeyPressDocente}
              disabled={verificandoDocente}
              maxLength="8"
            />
            {errorDocente && <p className="error-password">{errorDocente}</p>}
            <button className="btn-verificar" onClick={verificarDocente} disabled={verificandoDocente}>
              {verificandoDocente ? '...' : 'Ingresar'}
            </button>
          </div>
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
