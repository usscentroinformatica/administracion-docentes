// src/firebase/authService.js
import { db } from './config';
import { ref, get, set, child } from 'firebase/database';

// Verificar contraseña de administrador
export const verificarPasswordAdmin = async (password) => {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, 'config/adminPassword'));
    
    if (snapshot.exists()) {
      const adminPassword = snapshot.val();
      return { success: password === adminPassword, error: null };
    } else {
      // Si no existe la configuración, crearla con valor por defecto
      await set(ref(db, 'config/adminPassword'), 'admin123');
      return { success: password === 'admin123', error: null };
    }
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    return { success: false, error: error.message };
  }
};

// Cambiar contraseña de administrador (opcional)
export const cambiarPasswordAdmin = async (nuevaPassword) => {
  try {
    await set(ref(db, 'config/adminPassword'), nuevaPassword);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return { success: false, error: error.message };
  }
};

// Obtener contraseña actual (para debug)
export const obtenerPasswordAdmin = async () => {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, 'config/adminPassword'));
    
    if (snapshot.exists()) {
      return { success: true, password: snapshot.val() };
    } else {
      await set(ref(db, 'config/adminPassword'), 'admin123');
      return { success: true, password: 'admin123' };
    }
  } catch (error) {
    console.error('Error al obtener contraseña:', error);
    return { success: false, error: error.message };
  }
};