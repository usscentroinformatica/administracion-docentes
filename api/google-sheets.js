// api/google-sheets.js
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Tu URL de Google Apps Script (actualiza con la tuya)
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwkIz_Zje6312SqU3_DDpkOb5i38ZbPkAYpbLW7UxiyduBKcPF-S4d5XqTXYY6mxxVx/exec';

  try {
    // Para POST, reenviar el body
    if (req.method === 'POST') {
      console.log('📤 Enviando a Google Sheets:', req.body);
      
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      console.log('✅ Respuesta de Google:', data);
      
      return res.status(200).json(data);
    } 
    // Para GET, pasar parámetros
    else if (req.method === 'GET') {
      const queryString = new URLSearchParams(req.query).toString();
      const url = `${GOOGLE_SCRIPT_URL}?${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
      });

      const data = await response.json();
      return res.status(200).json(data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Error en proxy:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
