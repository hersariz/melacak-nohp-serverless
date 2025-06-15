const crypto = require('crypto');
const { supabase } = require('../utils/supabase');

// Fungsi untuk menghasilkan ID tracking acak
function generateTrackingId(length = 8) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

// Fungsi untuk mendapatkan base URL
function getBaseUrl(req) {
  // Gunakan NEXT_PUBLIC_SITE_URL jika ada (untuk custom domain)
  const customDomain = process.env.NEXT_PUBLIC_SITE_URL;
  if (customDomain) {
    return customDomain;
  }
  
  // Fallback ke host dari request
  const host = req.headers.host || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Hanya menerima metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parse body request
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Generate tracking ID
    const trackingId = generateTrackingId();
    
    // Buat URL untuk tracking
    const baseUrl = getBaseUrl(req);
    const trackingUrl = `${baseUrl}/t/${trackingId}`;
    
    // Simpan ke database
    const { data, error } = await supabase
      .from('links')
      .insert([
        { 
          tracking_id: trackingId,
          target_url: url,
          clicks: 0
        }
      ]);
    
    if (error) {
      console.error('Error inserting link to Supabase:', error);
      return res.status(500).json({ error: 'Failed to create tracking link', details: error.message });
    }
    
    // Kirim response
    return res.status(200).json({
      success: true,
      tracking_id: trackingId,
      tracking_url: trackingUrl,
      target_url: url
    });
  } catch (error) {
    console.error('Error creating link:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}; 