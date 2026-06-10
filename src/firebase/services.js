// src/firebase/services.js
import { db } from './config';
import { ref, push, set, get, child } from 'firebase/database';

// Función para convertir archivo a Base64
const archivoToBase64 = (archivo) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(archivo);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Guardar docente en Realtime Database
export const guardarDocente = async (datosDocente) => {
  try {
    console.log('🔥 Guardando en Realtime Database...');
    
    // Crear un ID único para el docente
    const docentesRef = ref(db, 'docentes');
    const nuevoDocenteRef = push(docentesRef);
    const docenteId = nuevoDocenteRef.key;
    
    // Preparar datos
    const docenteData = {
      ...datosDocente,
      docenteId: docenteId,
      fechaRegistro: new Date().toISOString(),
      fechaNacimiento: datosDocente.fechaNacimiento
    };
    
    // Guardar
    await set(nuevoDocenteRef, docenteData);
    
    console.log('✅ Docente guardado con ID:', docenteId);
    return { success: true, id: docenteId };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
};

// Guardar certificación en Realtime Database
export const guardarCertificacion = async (docenteId, certificacion, archivo) => {
  try {
    console.log('🔥 Guardando certificación para:', docenteId);
    
    let archivoBase64 = null;
    if (archivo) {
      archivoBase64 = await archivoToBase64(archivo);
    }
    
    // Crear referencia en certificaciones/[docenteId]/
    const certificacionesRef = ref(db, `certificaciones/${docenteId}`);
    const nuevaCertRef = push(certificacionesRef);
    
    const certificacionData = {
      certificacionId: nuevaCertRef.key,
      docenteId: docenteId,
      nombre: certificacion.nombre,
      categoria: certificacion.categoria,
      tipo: certificacion.tipo,
      archivoBase64: archivoBase64,
      archivoNombre: archivo?.name || '',
      fechaSubida: new Date().toISOString()
    };
    
    await set(nuevaCertRef, certificacionData);
    console.log('✅ Certificación guardada');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error en certificación:', error);
    return { success: false, error: error.message };
  }
};