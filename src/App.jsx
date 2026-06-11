// src/App.jsx
import { useState } from 'react';
import DocenteForm from './components/DocenteForm';
import ListaDocentes from './components/ListaDocentes';
import { verificarPasswordAdmin } from './firebase/authService';
import './App.css';

function App() {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [verificando, setVerificando] = useState(false);

  const togglePanel = () => {
    setPanelAbierto(!panelAbierto);
    // Resetear estado cuando se cierra el panel
    if (panelAbierto) {
      setPasswordInput('');
      setErrorPassword('');
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      verificarPassword();
    }
  };

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
          <h3>📁 Menú</h3>
          <button className="btn-cerrar-panel" onClick={togglePanel}>✕</button>
        </div>
        
        <div className="panel-contenido">
          <div className="password-section">
            <label className="password-label">🔒 Contraseña de acceso</label>
            <input
              type="password"
              className="password-input-panel"
              placeholder="Ingrese la contraseña"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={verificando}
            />
            {errorPassword && (
              <p className="error-password">{errorPassword}</p>
            )}
            
            {/* Botón debajo del campo de contraseña */}
            <button 
              className="btn-verificar" 
              onClick={verificarPassword}
              disabled={verificando}
            >
              {verificando ? '⏳ Verificando...' : '👨‍🏫 Ver Docentes Registrados'}
            </button>
            
            <p className="password-hint">Ingrese la contraseña para ver los docentes registrados</p>
          </div>
        </div>
      </div>

      {/* Modal de lista de docentes */}
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