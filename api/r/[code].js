// API untuk redirect dari link pendek
const fs = require('fs').promises;
const path = require('path');

// Konfigurasi
const LINKS_FILE = path.join(process.cwd(), 'short_links.json');

// Fungsi untuk mendapatkan link pendek
async function getShortLink(code) {
  try {
    // Baca data link
    const data = await fs.readFile(LINKS_FILE, 'utf8');
    const links = JSON.parse(data);
    
    // Periksa apakah kode ada
    if (!links[code]) {
      return null;
    }
    
    // Tambah jumlah klik
    links[code].clicks++;
    links[code].last_click = new Date().toISOString();
    
    // Simpan perubahan
    await fs.writeFile(LINKS_FILE, JSON.stringify(links, null, 2));
    
    return links[code].target_url;
  } catch (error) {
    console.error('Error getting short link:', error);
    return null;
  }
}

module.exports = async (req, res) => {
  // Ambil kode dari parameter URL
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Kode tidak valid' });
  }
  
  try {
    // Dapatkan URL target
    const targetUrl = await getShortLink(code);
    
    if (!targetUrl) {
      return res.status(404).json({ error: 'Link tidak ditemukan' });
    }
    
    // Redirect ke URL target
    res.setHeader('Location', targetUrl);
    return res.status(302).end();
  } catch (error) {
    console.error('Error in redirect API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 