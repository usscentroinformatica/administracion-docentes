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

  // Tu URL de Google Apps Script (la que te dio Google)
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbya-D0oOQzWSetZc-O8g6QslrCMzZzJ5VFqg_dl8AC8bfQ31Zu2--9EGlISJktrO1lO/exec';

  try {
    // Si es GET, pasar los parámetros
    if (req.method === 'GET') {
      const queryString = new URLSearchParams(req.query).toString();
      const url = `${GOOGLE_SCRIPT_URL}?${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
      });

      const data = await response.json();
      res.status(200).json(data);
    } 
    // Si es POST, pasar el body
    else if (req.method === 'POST') {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(200).json(data);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
