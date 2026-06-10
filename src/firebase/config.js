// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';  // Cambio: database en lugar de firestore

const firebaseConfig = {
  apiKey: "AIzaSyAzWnd4GOByjV2QYuyIHZ5V4vkMQQxR4Ic",
  authDomain: "calendario-41748.firebaseapp.com",
  projectId: "calendario-41748",
  storageBucket: "calendario-41748.firebasestorage.app",
  messagingSenderId: "763224273395",
  appId: "1:763224273395:web:a59bfd6f1bd86a91442286",
  databaseURL: "https://calendario-41748-default-rtdb.firebaseio.com"  // ← Agrega esta línea con tu URL
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);  // Cambio: getDatabase en lugar de getFirestore

console.log('✅ Realtime Database conectada');