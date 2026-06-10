import { useState } from 'react'
import './DocenteForm.css'
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

  // Estado para la foto del docente
  const [fotoDocente, setFotoDocente] = useState({
    archivo: null,
    nombreArchivo: '',
    preview: null
  })

  // Estado para loading
  const [loading, setLoading] = useState(false)

  // Estado para las certificaciones
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
    
    const camposSinMayusculas = ['fechaNacimiento', 'correo', 'genero', 'gradoMaestria']
    
    if (camposSinMayusculas.includes(name)) {
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
      setFormData(prevState => ({
        ...prevState,
        [name]: convertirAMayusculas(value)
      }))
    }
  }

  // Manejar cambio de foto
  const handleFotoChange = (e) => {
    const { files } = e.target
    const archivo = files[0]
    
    if (archivo) {
      // Validar que sea imagen
      if (!archivo.type.startsWith('image/')) {
        alert('Por favor seleccione una imagen válida (JPG, PNG, JPEG)')
        return
      }
      
      // Validar tamaño máximo (2MB)
      if (archivo.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar los 2MB')
        return
      }
      
      // Crear preview
      const preview = URL.createObjectURL(archivo)
      
      setFotoDocente({
        archivo: archivo,
        nombreArchivo: archivo.name,
        preview: preview
      })
    }
  }

  // Manejar selección de certificación
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

  // Manejar subida de archivos de certificación
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

  // Validar el formulario
  const validarFormulario = () => {
    const camposObligatorios = ['apellidos', 'nombres', 'fechaNacimiento', 'dni', 'correo', 'celular', 'lugarResidencia', 'genero', 'gradoMaestria']
    
    for (let campo of camposObligatorios) {
      if (!formData[campo]) {
        alert(`Por favor complete el campo: ${campo}`)
        return false
      }
    }

    // Validar que tenga foto
    if (!fotoDocente.archivo) {
      alert('Por favor agregue una foto formal del docente')
      return false
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
          alert(`La certificación "${nombreCertificado}" está seleccionada pero no tiene archivo.`)
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

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validarFormulario()) {
      return
    }

    setLoading(true)

    try {
      // 1. Guardar datos del docente (incluyendo foto en Base64)
      const docenteData = {
        ...formData,
        fotoBase64: await archivoToBase64(fotoDocente.archivo),
        fotoNombre: fotoDocente.nombreArchivo
      }
      
      const resultadoDocente = await guardarDocente(docenteData);
      
      if (!resultadoDocente.success) {
        throw new Error(resultadoDocente.error);
      }

      const docenteId = resultadoDocente.id;

      // 2. Guardar certificaciones
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

      await Promise.all(certificacionesPromises);

      alert('✅ ¡Registro exitoso! Los datos se han guardado correctamente.')
      resetFormulario()
      
    } catch (error) {
      console.error('Error al guardar:', error)
      alert('❌ Error al guardar los datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para convertir archivo a Base64
  const archivoToBase64 = (archivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
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
    setFotoDocente({
      archivo: null,
      nombreArchivo: '',
      preview: null
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

  const handleKeyUp = (e) => {
    const { name, value } = e.target
    const camposSinMayusculas = ['fechaNacimiento', 'correo', 'genero', 'gradoMaestria']
    
    if (!camposSinMayusculas.includes(name) && name !== 'dni' && name !== 'celular') {
      e.target.value = value.toUpperCase()
    }
  }

  return (
    <div className="form-container">
      <h2>📋 Registro de Docentes</h2>
      <form onSubmit={handleSubmit} className="docente-form">
        
        {/* Sección de Foto Profesional */}
<div className="form-section">
  <div className="foto-container">
    <div className="foto-titulo">
      <h4>📸 SUBIR FOTO DEL DOCENTE</h4>
      <p>Fotografía formal tipo carnet</p>
    </div>
    
    <div className="foto-preview">
      {fotoDocente.preview ? (
        <img src={fotoDocente.preview} alt="Foto del docente" className="foto-vista-previa" />
      ) : (
        <div className="foto-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p>Sin foto</p>
        </div>
      )}
    </div>
    
    <div className="foto-botones">
      <label className="btn-foto">
        📁 {fotoDocente.preview ? 'Cambiar foto' : 'Subir imagen'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFotoChange}
          style={{ display: 'none' }}
        />
      </label>
      {fotoDocente.preview && (
        <button type="button" onClick={() => {
          setFotoDocente({ archivo: null, nombreArchivo: '', preview: null })
        }} className="btn-remover-foto">
          🗑️ Quitar foto
        </button>
      )}
    </div>
    
    <div className="foto-info">
      <small>Formatos: JPG, PNG | Tamaño máximo: 2MB | Foto formal requerida</small>
    </div>
  </div>
</div>

        {/* Datos Personales */}
        <div className="form-section">
          <h3>👤 Datos Personales</h3>
          
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
            <label htmlFor="nombres">Nombres *</label>
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
          <h3>🎓 Información Académica</h3>
          
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

        {/* Certificaciones - Microsoft Office 2019 */}
        <div className="form-section">
          <h3>📄 Certificación Microsoft Office - 2019</h3>
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

        {/* Certificaciones - Microsoft Office 365 */}
        <div className="form-section">
          <h3>📄 Certificación Microsoft Office - 365</h3>
          <p className="section-description">Seleccione las certificaciones que posee y suba los archivos correspondientes</p>
          
          <div className="certificaciones-grid">
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
            {loading ? '📥 Guardando...' : '✅ Registrar Docente'}
          </button>
          <button type="button" onClick={resetFormulario} className="btn-reset" disabled={loading}>
            🗑️ Limpiar Formulario
          </button>
        </div>
      </form>
    </div>
  )
}

export default DocenteForm