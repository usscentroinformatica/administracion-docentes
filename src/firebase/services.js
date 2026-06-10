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

// src/firebase/services.js
export const guardarDocente = async (datosDocente) => {
  try {
    console.log('🔥 [services] Iniciando guardarDocente');
    console.log('🔥 [services] Datos recibidos:', { 
      nombres: datosDocente.nombres, 
      dni: datosDocente.dni,
      tieneFoto: !!datosDocente.fotoBase64 
    });
    
    const docenteData = {
      ...datosDocente,
      fechaRegistro: serverTimestamp(),
      fechaNacimiento: new Date(datosDocente.fechaNacimiento)
    };

    console.log('🔥 [services] Intentando escribir en Firestore...');
    const docRef = await addDoc(collection(db, 'docentes'), docenteData);
    console.log('🔥 [services] Escritura exitosa, ID:', docRef.id);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('🔥 [services] ERROR DETALLADO:');
    console.error('🔥 [services] - Código:', error.code);
    console.error('🔥 [services] - Mensaje:', error.message);
    console.error('🔥 [services] - Stack:', error.stack);
    return { success: false, error: error.message, code: error.code };
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