import { useState } from 'react'
import './DocenteForm.css'
// Importar funciones de Firebase
import { guardarDocente, guardarCertificacion } from '../firebase/services';

const DocenteForm = () => {
  // Estado principal del formulario
  const [formData, setFormData] = useState({
    apellidos: '',
    nombres: '',
    fechaNacimiento: '',
    dni: '',
    correo: '',
    celular: '',
    lugarResidencia: '',
    genero: '',
    gradoMaestria: ''
  })

  // Estado para loading
  const [loading, setLoading] = useState(false)

  // Estado para las certificaciones - Estructura plana con categorías
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
      wordAsociado2: { seleccionado: false, archivo: null, nombreArchivo: '' },
      excelAsociado2: { seleccionado: false, archivo: null, nombreArchivo: '' }
    }
  })

  // Opciones para el select de grado de maestría
  const gradosMaestria = [
    { value: '', label: 'Seleccione un grado' },
    { value: 'ninguno', label: 'NINGUNO' },
    { value: 'cursando', label: 'CURSANDO MAESTRÍA' },
    { value: 'magister', label: 'MAGÍSTER' },
    { value: 'doctor', label: 'DOCTOR' },
    { value: 'postdoctor', label: 'POSTDOCTOR' }
  ]

  // Opciones para el género
  const generos = [
    { value: '', label: 'Seleccione un género' },
    { value: 'femenino', label: 'FEMENINO' },
    { value: 'masculino', label: 'MASCULINO' },
    { value: 'otro', label: 'OTRO' },
    { value: 'prefiero_no_decir', label: 'PREFIERO NO DECIR' }
  ]

  // Función para convertir texto a mayúsculas
  const convertirAMayusculas = (texto) => {
    return texto.toUpperCase()
  }

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Campos que NO deben convertirse a mayúsculas
    const camposSinMayusculas = ['fechaNacimiento', 'correo', 'genero', 'gradoMaestria']
    
    if (camposSinMayusculas.includes(name)) {
      // Para correo, convertimos a minúsculas
      if (name === 'correo') {
        setFormData(prevState => ({
          ...prevState,
          [name]: value.toLowerCase()
        }))
      } else {
        setFormData(prevState => ({
          ...prevState,
          [name]: value
        }))
      }
    } else {
      // Convertir a mayúsculas para los demás campos
      setFormData(prevState => ({
        ...prevState,
        [name]: convertirAMayusculas(value)
      }))
    }
  }

  // Manejar selección de certificación (checkbox)
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
    }))
  }

  // Manejar subida de archivos
  const handleArchivoChange = (categoria, tipo, e) => {
    const { files } = e.target
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
    }))
  }

  // Validar el formulario antes de enviar
  const validarFormulario = () => {
    const camposObligatorios = ['apellidos', 'nombres', 'fechaNacimiento', 'dni', 'correo', 'celular', 'lugarResidencia', 'genero', 'gradoMaestria']
    
    for (let campo of camposObligatorios) {
      if (!formData[campo]) {
        alert(`Por favor complete el campo: ${campo}`)
        return false
      }
    }

    if (!/^\d{8}$/.test(formData.dni)) {
      alert('El DNI debe tener 8 dígitos numéricos')
      return false
    }

    if (!/^\d{9}$/.test(formData.celular)) {
      alert('El celular debe tener 9 dígitos numéricos')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.correo)) {
      alert('Ingrese un correo electrónico válido')
      return false
    }

    const fechaNac = new Date(formData.fechaNacimiento)
    const hoy = new Date()
    const edad = hoy.getFullYear() - fechaNac.getFullYear()
    const mesDiff = hoy.getMonth() - fechaNac.getMonth()
    
    if (edad < 18 || (edad === 18 && mesDiff < 0)) {
      alert('El docente debe ser mayor de 18 años')
      return false
    }

    const camposTexto = ['apellidos', 'nombres', 'lugarResidencia']
    for (let campo of camposTexto) {
      if (formData[campo] && formData[campo] !== formData[campo].toUpperCase()) {
        alert(`El campo ${campo} debe estar en mayúsculas`)
        return false
      }
    }

    for (const [categoria, certificados] of Object.entries(certificaciones)) {
      for (const [tipo, datos] of Object.entries(certificados)) {
        if (datos.seleccionado && !datos.archivo) {
          const nombreCertificado = getNombreCertificado(categoria, tipo)
          alert(`La certificación "${nombreCertificado}" está seleccionada pero no tiene archivo. Por favor suba el archivo correspondiente.`)
          return false
        }
      }
    }

    return true
  }

  // Obtener nombre legible de la certificación
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
        wordAsociado2: 'Microsoft Word Asociado - 365',
        excelAsociado2: 'Microsoft Excel Asociado - 365'
      }
    }
    return nombres[categoria]?.[tipo] || ''
  }

  // Manejar envío del formulario con Firebase (SIN Storage)
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validarFormulario()) {
      return
    }

    setLoading(true)

    try {
      // 1. Guardar datos del docente en Firestore
      const resultadoDocente = await guardarDocente(formData);
      
      if (!resultadoDocente.success) {
        throw new Error(resultadoDocente.error);
      }

      const docenteId = resultadoDocente.id;

      // 2. Guardar cada certificación seleccionada en Firestore (archivos en Base64)
      const certificacionesPromises = [];
      
      for (const [categoria, certificados] of Object.entries(certificaciones)) {
        for (const [tipo, datos] of Object.entries(certificados)) {
          if (datos.seleccionado && datos.archivo) {
            const certificacionInfo = {
              nombre: getNombreCertificado(categoria, tipo),
              categoria: categoria,
              tipo: tipo
            };
            
            const promesa = guardarCertificacion(docenteId, certificacionInfo, datos.archivo);
            certificacionesPromises.push(promesa);
          }
        }
      }

      // Esperar a que se guarden todas las certificaciones
      await Promise.all(certificacionesPromises);

      // Tu console.log original
      const certificacionesEnviadas = []
      for (const [categoria, certificados] of Object.entries(certificaciones)) {
        for (const [tipo, datos] of Object.entries(certificados)) {
          if (datos.seleccionado && datos.archivo) {
            certificacionesEnviadas.push({
              nombre: getNombreCertificado(categoria, tipo),
              archivo: datos.archivo.name
            })
          }
        }
      }

      console.log('Datos guardados en Firebase:', {
        docente: formData,
        certificaciones: certificacionesEnviadas
      })

      alert('✅ ¡Registro exitoso! Los datos se han guardado en Firebase.')
      
      // Limpiar formulario después de enviar
      resetFormulario()
      
    } catch (error) {
      console.error('Error al guardar:', error)
      alert('❌ Error al guardar los datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Resetear formulario
  const resetFormulario = () => {
    setFormData({
      apellidos: '',
      nombres: '',
      fechaNacimiento: '',
      dni: '',
      correo: '',
      celular: '',
      lugarResidencia: '',
      genero: '',
      gradoMaestria: ''
    })
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
        wordAsociado2: { seleccionado: false, archivo: null, nombreArchivo: '' },
        excelAsociado2: { seleccionado: false, archivo: null, nombreArchivo: '' }
      }
    })
  }

  // Función para formatear mientras se escribe
  const handleKeyUp = (e) => {
    const { name, value } = e.target
    const camposSinMayusculas = ['fechaNacimiento', 'correo', 'genero', 'gradoMaestria']
    
    if (!camposSinMayusculas.includes(name) && name !== 'dni' && name !== 'celular') {
      e.target.value = value.toUpperCase()
    }
  }

  return (
    <div className="form-container">
      <h2>Registro de Docentes</h2>
      <form onSubmit={handleSubmit} className="docente-form">
        
        {/* Datos Personales */}
        <div className="form-section">
          <h3>Datos Personales</h3>
          
          <div className="form-group">
            <label htmlFor="apellidos">Apellidos *</label>
            <input
              type="text"
              id="apellidos"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              onKeyUp={handleKeyUp}
              placeholder="INGRESE SUS APELLIDOS"
              required
              style={{ textTransform: 'uppercase' }}
            />            
          </div>

          <div className="form-group">
            <label htmlFor="nombres">Nombres * </label>
            <input
              type="text"
              id="nombres"
              name="nombres"
              value={formData.nombres}
              onChange={handleChange}
              onKeyUp={handleKeyUp}
              placeholder="INGRESE SUS NOMBRES"
              required
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fechaNacimiento">Fecha de Nacimiento *</label>
            <input
              type="date"
              id="fechaNacimiento"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dni">DNI *</label>
            <input
              type="text"
              id="dni"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              placeholder="8 dígitos"
              maxLength="8"
              pattern="\d{8}"
              required
            />
            <small className="hint-text">Solo números, 8 dígitos</small>
          </div>

          <div className="form-group">
            <label htmlFor="genero">Género *</label>
            <select
              id="genero"
              name="genero"
              value={formData.genero}
              onChange={handleChange}
              required
            >
              {generos.map(genero => (
                <option key={genero.value} value={genero.value}>
                  {genero.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="correo">Correo Electrónico *</label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="ejemplo@dominio.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="celular">Celular *</label>
            <input
              type="tel"
              id="celular"
              name="celular"
              value={formData.celular}
              onChange={handleChange}
              placeholder="9 dígitos"
              maxLength="9"
              pattern="\d{9}"
              required
            />
            <small className="hint-text">Solo números, 9 dígitos</small>
          </div>

          <div className="form-group">
            <label htmlFor="lugarResidencia">Lugar de Residencia *</label>
            <input
              type="text"
              id="lugarResidencia"
              name="lugarResidencia"
              value={formData.lugarResidencia}
              onChange={handleChange}
              onKeyUp={handleKeyUp}
              placeholder="CIUDAD, DEPARTAMENTO"
              required
              style={{ textTransform: 'uppercase' }}
            />
          </div>
        </div>

        {/* Información Académica */}
        <div className="form-section">
          <h3>Información Académica</h3>
          
          <div className="form-group">
            <label htmlFor="gradoMaestria">Grado de Maestría *</label>
            <select
              id="gradoMaestria"
              name="gradoMaestria"
              value={formData.gradoMaestria}
              onChange={handleChange}
              required
            >
              {gradosMaestria.map(grado => (
                <option key={grado.value} value={grado.value}>
                  {grado.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Certificaciones - Categoría Microsoft Office 2019 */}
        <div className="form-section">
          <h3>Certificación Microsoft Office - 2019</h3>
          <p className="section-description">Seleccione las certificaciones que posee y suba los archivos correspondientes</p>
          
          <div className="certificaciones-grid">
            {/* Word Asociado 2019 */}
            <div className="certificacion-card">
              <div className="certificacion-header">
                <input
                  type="checkbox"
                  id="word_asociado"
                  checked={certificaciones.office2019.wordAsociado.seleccionado}
                  onChange={() => handleCertificacionToggle('office2019', 'wordAsociado')}
                />
                <label htmlFor="word_asociado" className="certificacion-label">
                  Microsoft Word Asociado - 2019
                </label>
              </div>
              {certificaciones.office2019.wordAsociado.seleccionado && (
                <div className="certificacion-archivo">
                  <input
                    type="file"
                    onChange={(e) => handleArchivoChange('office2019', 'wordAsociado', e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {certificaciones.office2019.wordAsociado.nombreArchivo && (
                    <small className="file-info">Archivo: {certificaciones.office2019.wordAsociado.nombreArchivo}</small>
                  )}
                </div>
              )}
            </div>

            {/* Excel Asociado 2019 */}
            <div className="certificacion-card">
              <div className="certificacion-header">
                <input
                  type="checkbox"
                  id="excel_asociado"
                  checked={certificaciones.office2019.excelAsociado.seleccionado}
                  onChange={() => handleCertificacionToggle('office2019', 'excelAsociado')}
                />
                <label htmlFor="excel_asociado" className="certificacion-label">
                  Microsoft Excel Asociado - 2019
                </label>
              </div>
              {certificaciones.office2019.excelAsociado.seleccionado && (
                <div className="certificacion-archivo">
                  <input
                    type="file"
                    onChange={(e) => handleArchivoChange('office2019', 'excelAsociado', e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {certificaciones.office2019.excelAsociado.nombreArchivo && (
                    <small className="file-info">Archivo: {certificaciones.office2019.excelAsociado.nombreArchivo}</small>
                  )}
                </div>
              )}
            </div>

            {/* PowerPoint Asociado 2019 */}
            <div className="certificacion-card">
              <div className="certificacion-header">
                <input
                  type="checkbox"
                  id="powerpoint_asociado"
                  checked={certificaciones.office2019.powerpointAsociado.seleccionado}
                  onChange={() => handleCertificacionToggle('office2019', 'powerpointAsociado')}
                />
                <label htmlFor="powerpoint_asociado" className="certificacion-label">
                  Microsoft PowerPoint Asociado - 2019
                </label>
              </div>
              {certificaciones.office2019.powerpointAsociado.seleccionado && (
                <div className="certificacion-archivo">
                  <input
                    type="file"
                    onChange={(e) => handleArchivoChange('office2019', 'powerpointAsociado', e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {certificaciones.office2019.powerpointAsociado.nombreArchivo && (
                    <small className="file-info">Archivo: {certificaciones.office2019.powerpointAsociado.nombreArchivo}</small>
                  )}
                </div>
              )}
            </div>

            {/* Word Expert 2019 */}
            <div className="certificacion-card">
              <div className="certificacion-header">
                <input
                  type="checkbox"
                  id="word_expert"
                  checked={certificaciones.office2019.wordExpert.seleccionado}
                  onChange={() => handleCertificacionToggle('office2019', 'wordExpert')}
                />
                <label htmlFor="word_expert" className="certificacion-label">
                  Microsoft Word Expert - 2019
                </label>
              </div>
              {certificaciones.office2019.wordExpert.seleccionado && (
                <div className="certificacion-archivo">
                  <input
                    type="file"
                    onChange={(e) => handleArchivoChange('office2019', 'wordExpert', e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {certificaciones.office2019.wordExpert.nombreArchivo && (
                    <small className="file-info">Archivo: {certificaciones.office2019.wordExpert.nombreArchivo}</small>
                  )}
                </div>
              )}
            </div>

            {/* Excel Expert 2019 */}
            <div className="certificacion-card">
              <div className="certificacion-header">
                <input
                  type="checkbox"
                  id="excel_expert"
                  checked={certificaciones.office2019.excelExpert.seleccionado}
                  onChange={() => handleCertificacionToggle('office2019', 'excelExpert')}
                />
                <label htmlFor="excel_expert" className="certificacion-label">
                  Microsoft Excel Expert - 2019
                </label>
              </div>
              {certificaciones.office2019.excelExpert.seleccionado && (
                <div className="certificacion-archivo">
                  <input
                    type="file"
                    onChange={(e) => handleArchivoChange('office2019', 'excelExpert', e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {certificaciones.office2019.excelExpert.nombreArchivo && (
                    <small className="file-info">Archivo: {certificaciones.office2019.excelExpert.nombreArchivo}</small>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Certificaciones - Categoría Microsoft Office 365 */}
        <div className="form-section">
          <h3>Certificación Microsoft Office - 365</h3>
          <p className="section-description">Seleccione las certificaciones que posee y suba los archivos correspondientes</p>
          
          <div className="certificaciones-grid">
            {/* Word Asociado 365 */}
            <div className="certificacion-card">
              <div className="certificacion-header">
                <input
                  type="checkbox"
                  id="word_365"
                  checked={certificaciones.office365.wordAsociado.seleccionado}
                  onChange={() => handleCertificacionToggle('office365', 'wordAsociado')}
                />
                <label htmlFor="word_365" className="certificacion-label">
                  Microsoft Word Asociado - 365
                </label>
              </div>
              {certificaciones.office365.wordAsociado.seleccionado && (
                <div className="certificacion-archivo">
                  <input
                    type="file"
                    onChange={(e) => handleArchivoChange('office365', 'wordAsociado', e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {certificaciones.office365.wordAsociado.nombreArchivo && (
                    <small className="file-info">Archivo: {certificaciones.office365.wordAsociado.nombreArchivo}</small>
                  )}
                </div>
              )}
            </div>

            {/* Excel Asociado 365 */}
            <div className="certificacion-card">
              <div className="certificacion-header">
                <input
                  type="checkbox"
                  id="excel_365"
                  checked={certificaciones.office365.excelAsociado.seleccionado}
                  onChange={() => handleCertificacionToggle('office365', 'excelAsociado')}
                />
                <label htmlFor="excel_365" className="certificacion-label">
                  Microsoft Excel Asociado - 365
                </label>
              </div>
              {certificaciones.office365.excelAsociado.seleccionado && (
                <div className="certificacion-archivo">
                  <input
                    type="file"
                    onChange={(e) => handleArchivoChange('office365', 'excelAsociado', e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {certificaciones.office365.excelAsociado.nombreArchivo && (
                    <small className="file-info">Archivo: {certificaciones.office365.excelAsociado.nombreArchivo}</small>
                  )}
                </div>
              )}
            </div>

            {/* PowerPoint Asociado 365 */}
            <div className="certificacion-card">
              <div className="certificacion-header">
                <input
                  type="checkbox"
                  id="powerpoint_365"
                  checked={certificaciones.office365.powerpointAsociado.seleccionado}
                  onChange={() => handleCertificacionToggle('office365', 'powerpointAsociado')}
                />
                <label htmlFor="powerpoint_365" className="certificacion-label">
                  Microsoft PowerPoint Asociado - 365
                </label>
              </div>
              {certificaciones.office365.powerpointAsociado.seleccionado && (
                <div className="certificacion-archivo">
                  <input
                    type="file"
                    onChange={(e) => handleArchivoChange('office365', 'powerpointAsociado', e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {certificaciones.office365.powerpointAsociado.nombreArchivo && (
                    <small className="file-info">Archivo: {certificaciones.office365.powerpointAsociado.nombreArchivo}</small>
                  )}
                </div>
              )}
            </div>

            {/* Word Asociado 365 - Segundo */}
            <div className="certificacion-card">
              <div className="certificacion-header">
                <input
                  type="checkbox"
                  id="word_365_2"
                  checked={certificaciones.office365.wordAsociado2.seleccionado}
                  onChange={() => handleCertificacionToggle('office365', 'wordAsociado2')}
                />
                <label htmlFor="word_365_2" className="certificacion-label">
                  Microsoft Word Asociado - 365
                </label>
              </div>
              {certificaciones.office365.wordAsociado2.seleccionado && (
                <div className="certificacion-archivo">
                  <input
                    type="file"
                    onChange={(e) => handleArchivoChange('office365', 'wordAsociado2', e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {certificaciones.office365.wordAsociado2.nombreArchivo && (
                    <small className="file-info">Archivo: {certificaciones.office365.wordAsociado2.nombreArchivo}</small>
                  )}
                </div>
              )}
            </div>

            {/* Excel Asociado 365 - Segundo */}
            <div className="certificacion-card">
              <div className="certificacion-header">
                <input
                  type="checkbox"
                  id="excel_365_2"
                  checked={certificaciones.office365.excelAsociado2.seleccionado}
                  onChange={() => handleCertificacionToggle('office365', 'excelAsociado2')}
                />
                <label htmlFor="excel_365_2" className="certificacion-label">
                  Microsoft Excel Asociado - 365
                </label>
              </div>
              {certificaciones.office365.excelAsociado2.seleccionado && (
                <div className="certificacion-archivo">
                  <input
                    type="file"
                    onChange={(e) => handleArchivoChange('office365', 'excelAsociado2', e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {certificaciones.office365.excelAsociado2.nombreArchivo && (
                    <small className="file-info">Archivo: {certificaciones.office365.excelAsociado2.nombreArchivo}</small>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Registrar Docente'}
          </button>
          <button type="button" onClick={resetFormulario} className="btn-reset" disabled={loading}>
            Limpiar Formulario
          </button>
        </div>
      </form>
    </div>
  )
}

export default DocenteForm