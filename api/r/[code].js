// API untuk redirect dari link pendek
const fs = require('fs').promises;
const path = require('path');

// Konfigurasi
const LINKS_FILE = path.join(process.cwd(), 'short_links.json');

// Referensi ke inMemoryLinks dari create-link.js (untuk demo)
// Dalam produksi sebenarnya, gunakan database seperti Vercel KV, MongoDB, dll
let inMemoryLinks = {};

// Import inMemoryLinks dari create-link jika di lingkungan yang sama
try {
  const createLink = require('../create-link');
  if (createLink.getLinks) {
    inMemoryLinks = createLink.getLinks();
  }
} catch (e) {
  console.log('Could not import links from create-link.js, using empty object');
}

// Fungsi untuk mendapatkan link pendek
async function getShortLink(code) {
  try {
    console.log(`Getting short link for code: ${code}`);
    
    // Coba baca data dari file jika di lingkungan development
    if (process.env.NODE_ENV !== 'production') {
      try {
        const data = await fs.readFile(LINKS_FILE, 'utf8');
        inMemoryLinks = JSON.parse(data);
        console.log('Links loaded from file');
      } catch (error) {
        console.log('Could not read links file, using in-memory storage');
      }
    }
    
    // Periksa apakah kode ada
    if (!inMemoryLinks[code]) {
      console.log(`Code ${code} not found`);
      return null;
    }
    
    console.log(`Found target URL: ${inMemoryLinks[code].target_url}`);
    
    // Tambah jumlah klik
    inMemoryLinks[code].clicks++;
    inMemoryLinks[code].last_click = new Date().toISOString();
    
    // Simpan perubahan jika di lingkungan development
    if (process.env.NODE_ENV !== 'production') {
      try {
        await fs.writeFile(LINKS_FILE, JSON.stringify(inMemoryLinks, null, 2));
        console.log('Updated links saved to file');
      } catch (error) {
        console.error('Error saving links to file:', error);
      }
    }
    
    return inMemoryLinks[code].target_url;
  } catch (error) {
    console.error('Error getting short link:', error);
    return null;
  }
}

module.exports = async (req, res) => {
  console.log('API r/[code] called');
  
  // Ambil kode dari parameter URL
  const { code } = req.query;
  console.log(`Redirect requested for code: ${code}`);
  
  if (!code) {
    console.log('Invalid code (empty)');
    return res.status(400).json({ error: 'Kode tidak valid' });
  }
  
  try {
    // Dapatkan URL target
    const targetUrl = await getShortLink(code);
    
    if (!targetUrl) {
      console.log(`Link not found for code: ${code}`);
      return res.status(404).json({ error: 'Link tidak ditemukan' });
    }
    
    // Redirect ke URL target
    console.log(`Redirecting to: ${targetUrl}`);
    res.setHeader('Location', targetUrl);
    return res.status(302).end();
  } catch (error) {
    console.error('Error in redirect API:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}; 