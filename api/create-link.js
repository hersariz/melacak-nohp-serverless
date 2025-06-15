// API untuk membuat link tracking
const fs = require('fs').promises;
const path = require('path');

// Konfigurasi
const LINKS_FILE = path.join(process.cwd(), 'short_links.json');
const BASE_URL = process.env.VERCEL_URL ? 
  `https://${process.env.VERCEL_URL}` : 
  (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

// Fungsi untuk membuat link pendek
async function createShortLink(target_url, custom_code = null) {
  try {
    // Buat kode pendek acak jika tidak ada kode kustom
    if (!custom_code) {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      custom_code = '';
      for (let i = 0; i < 6; i++) {
        custom_code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    
    // Baca data link yang sudah ada
    let links = {};
    try {
      const data = await fs.readFile(LINKS_FILE, 'utf8');
      links = JSON.parse(data);
    } catch (error) {
      // File tidak ada atau tidak valid, gunakan objek kosong
      links = {};
    }
    
    // Periksa apakah kode sudah digunakan
    if (links[custom_code]) {
      return { error: 'Kode sudah digunakan' };
    }
    
    // Simpan link baru
    links[custom_code] = {
      target_url: target_url,
      created_at: new Date().toISOString(),
      clicks: 0
    };
    
    // Simpan ke file
    await fs.writeFile(LINKS_FILE, JSON.stringify(links, null, 2));
    
    return { 
      success: true,
      short_code: custom_code
    };
  } catch (error) {
    console.error('Error creating short link:', error);
    return { error: 'Gagal membuat link pendek' };
  }
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Parse body request
      let body;
      
      try {
        // Coba parse body jika sudah dalam format JSON
        if (typeof req.body === 'object') {
          body = req.body;
        } else if (typeof req.body === 'string') {
          body = JSON.parse(req.body);
        } else {
          // Fallback untuk Vercel
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const data = Buffer.concat(buffers).toString();
          body = data ? JSON.parse(data) : {};
        }
      } catch (e) {
        console.error('Error parsing request body:', e);
        body = {};
      }
      
      const tracking_id = body.tracking_id || '';
      const custom_code = body.custom_code || '';
      
      // Buat ID tracking jika tidak ada
      const finalTrackingId = tracking_id || Date.now().toString(36);
      
      // Buat URL tracking
      const target_url = `${BASE_URL}/api/tracker?id=${finalTrackingId}`;
      
      // Buat link pendek
      const result = await createShortLink(target_url, custom_code || null);
      
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      
      // Return hasil
      return res.status(200).json({
        tracking_id: finalTrackingId,
        short_code: result.short_code,
        short_url: `${BASE_URL}/api/r/${result.short_code}`,
        target_url: target_url
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in create-link API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 