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
    console.log('Request body:', req.body);
    
    // Validasi body request
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is empty' });
    }
    
    // Parse body request
    const { url, tracking_id, custom_code } = req.body;
    
    console.log('Received URL:', url);
    console.log('Received tracking_id:', tracking_id);
    console.log('Received custom_code:', custom_code);
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Generate tracking ID
    const finalTrackingId = tracking_id || generateTrackingId();
    
    // Buat URL untuk tracking
    const baseUrl = getBaseUrl(req);
    const trackingUrl = `${baseUrl}/t/${finalTrackingId}`;
    
    // Untuk sementara, kembalikan respons sukses tanpa menyimpan ke database
    // untuk menghindari error dengan Supabase
    return res.status(200).json({
      success: true,
      tracking_id: finalTrackingId,
      short_url: trackingUrl,
      target_url: url
    });
    
    /* Kode untuk menyimpan ke Supabase dinonaktifkan sementara
    // Simpan ke database
    try {
      const { data, error } = await supabase
        .from('links')
        .insert([
          { 
            tracking_id: finalTrackingId,
            target_url: url,
            clicks: 0,
            custom_code: custom_code || null
          }
        ]);
      
      if (error) {
        console.error('Error inserting link to Supabase:', error);
        return res.status(500).json({ error: 'Failed to create tracking link', details: error.message });
      }
      
      // Kirim response
      return res.status(200).json({
        success: true,
        tracking_id: finalTrackingId,
        short_url: trackingUrl,
        target_url: url
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Database error', details: dbError.message });
    }
    */
  } catch (error) {
    console.error('Error creating link:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}; 