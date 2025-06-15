// API untuk membuat link tracking
const fs = require('fs').promises;
const path = require('path');

// Konfigurasi
const LINKS_FILE = path.join(process.cwd(), 'short_links.json');
const BASE_URL = process.env.VERCEL_URL ? 
  `https://${process.env.VERCEL_URL}` : 
  (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

// In-memory storage untuk demo di Vercel (karena Vercel filesystem read-only)
let inMemoryLinks = {};

// Fungsi untuk mendapatkan links (untuk diakses dari file lain)
function getLinks() {
  return inMemoryLinks;
}

// Fungsi untuk membuat link pendek
async function createShortLink(target_url, custom_code = null) {
  try {
    console.log(`Creating short link for target_url: ${target_url}, custom_code: ${custom_code}`);
    
    // Buat kode pendek acak jika tidak ada kode kustom
    if (!custom_code) {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      custom_code = '';
      for (let i = 0; i < 6; i++) {
        custom_code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    
    // Coba baca data dari file jika di lingkungan development
    if (process.env.NODE_ENV !== 'production') {
      try {
        const data = await fs.readFile(LINKS_FILE, 'utf8');
        inMemoryLinks = JSON.parse(data);
      } catch (error) {
        console.log('Could not read links file, using in-memory storage');
        // File tidak ada atau tidak valid, gunakan objek yang sudah ada
      }
    }
    
    // Periksa apakah kode sudah digunakan
    if (inMemoryLinks[custom_code]) {
      console.log(`Code ${custom_code} already in use`);
      return { error: 'Kode sudah digunakan' };
    }
    
    // Simpan link baru
    inMemoryLinks[custom_code] = {
      target_url: target_url,
      created_at: new Date().toISOString(),
      clicks: 0
    };
    
    // Simpan ke file jika di lingkungan development
    if (process.env.NODE_ENV !== 'production') {
      try {
        await fs.writeFile(LINKS_FILE, JSON.stringify(inMemoryLinks, null, 2));
        console.log('Links saved to file successfully');
      } catch (error) {
        console.error('Error saving links to file:', error);
        // Lanjutkan meskipun gagal menyimpan ke file
      }
    }
    
    console.log(`Short link created successfully: ${custom_code}`);
    return { 
      success: true,
      short_code: custom_code
    };
  } catch (error) {
    console.error('Error creating short link:', error);
    return { error: 'Gagal membuat link pendek: ' + error.message };
  }
}

module.exports = async (req, res) => {
  console.log('API create-link called with method:', req.method);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      console.log('Handling POST request');
      
      // Parse body request
      let body;
      
      try {
        // Coba parse body jika sudah dalam format JSON
        if (typeof req.body === 'object') {
          console.log('Request body is already an object');
          body = req.body;
        } else if (typeof req.body === 'string') {
          console.log('Request body is a string, parsing as JSON');
          body = JSON.parse(req.body);
        } else {
          // Fallback untuk Vercel
          console.log('Using fallback method to read request body');
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const data = Buffer.concat(buffers).toString();
          console.log('Raw request data:', data);
          body = data ? JSON.parse(data) : {};
        }
        
        console.log('Parsed request body:', body);
      } catch (e) {
        console.error('Error parsing request body:', e);
        body = {};
      }
      
      const tracking_id = body.tracking_id || '';
      const custom_code = body.custom_code || '';
      
      console.log(`Received tracking_id: ${tracking_id}, custom_code: ${custom_code}`);
      
      // Buat ID tracking jika tidak ada
      const finalTrackingId = tracking_id || Date.now().toString(36);
      console.log(`Final tracking ID: ${finalTrackingId}`);
      
      // Buat URL tracking
      const target_url = `${BASE_URL}/api/tracker?id=${finalTrackingId}`;
      console.log(`Target URL: ${target_url}`);
      
      // Buat link pendek
      const result = await createShortLink(target_url, custom_code || null);
      
      if (result.error) {
        console.error('Error creating short link:', result.error);
        return res.status(400).json({ error: result.error });
      }
      
      // Return hasil
      const response = {
        tracking_id: finalTrackingId,
        short_code: result.short_code,
        short_url: `${BASE_URL}/api/r/${result.short_code}`,
        target_url: target_url
      };
      
      console.log('Response:', response);
      return res.status(200).json(response);
    } else {
      console.log(`Method ${req.method} not allowed`);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in create-link API:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// Ekspor fungsi getLinks
module.exports.getLinks = getLinks; 