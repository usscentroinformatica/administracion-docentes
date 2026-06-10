// src/firebase/services.js
import { db } from './config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Función para convertir archivo a Base64
const archivoToBase64 = (archivo) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(archivo);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Guardar docente en Firestore
export const guardarDocente = async (datosDocente) => {
  try {
    const docenteData = {
      ...datosDocente,
      fechaRegistro: serverTimestamp(),
      fechaNacimiento: new Date(datosDocente.fechaNacimiento)
    };

    const docRef = await addDoc(collection(db, 'docentes'), docenteData);
    console.log('Docente guardado con ID:', docRef.id);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al guardar docente:', error);
    return { success: false, error: error.message };
  }
};

// Guardar certificación con archivo en Base64 en Firestore
export const guardarCertificacion = async (docenteId, certificacion, archivo) => {
  try {
    let archivoBase64 = null;
    let archivoTipo = null;
    let archivoNombre = null;
    
    // Convertir archivo a Base64 si existe
    if (archivo) {
      archivoBase64 = await archivoToBase64(archivo);
      archivoTipo = archivo.type;
      archivoNombre = archivo.name;
    }
    
    const certificacionData = {
      docenteId: docenteId,
      nombre: certificacion.nombre,
      categoria: certificacion.categoria,
      tipo: certificacion.tipo,
      archivoBase64: archivoBase64,  // Archivo en Base64
      archivoTipo: archivoTipo,       // Tipo de archivo (PDF, JPG, etc)
      archivoNombre: archivoNombre,   // Nombre original del archivo
      fechaSubida: serverTimestamp()
    };
    
    const certRef = await addDoc(collection(db, 'certificaciones'), certificacionData);
    
    return { success: true, id: certRef.id };
  } catch (error) {
    console.error('Error al guardar certificación:', error);
    return { success: false, error: error.message };
  }
};