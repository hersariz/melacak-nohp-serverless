// API untuk redirect dari URL pendek ke tracker
const { supabase } = require('../../utils/supabase');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Ambil ID dari path parameter
    const { id } = req.query;
    
    console.log('Received tracking ID:', id);
    
    if (!id) {
      return res.status(400).json({ error: 'Tracking ID is required' });
    }
    
    // Coba ambil target URL dari database
    let targetUrl = null;
    try {
      const { data, error } = await supabase
        .from('links')
        .select('target_url')
        .eq('tracking_id', id)
        .single();
      
      if (error) {
        console.error('Error fetching link from database:', error);
      } else if (data && data.target_url) {
        targetUrl = data.target_url;
        console.log('Found target URL in database:', targetUrl);
      }
    } catch (dbError) {
      console.error('Database operation error:', dbError);
    }
    
    // Siapkan URL untuk tracker
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    // Tambahkan target URL sebagai parameter jika ditemukan
    const trackerUrl = targetUrl 
      ? `${baseUrl}/api/tracker?id=${id}&target=${encodeURIComponent(targetUrl)}`
      : `${baseUrl}/api/tracker?id=${id}`;
      
    console.log('Redirecting to tracker:', trackerUrl);
    
    // Redirect langsung tanpa menunggu respons dari API tracker
    return res.redirect(302, trackerUrl);
  } catch (error) {
    console.error('Error in t/[id] API:', error);
    
    // Redirect ke URL default jika terjadi error
    const redirectUrl = process.env.REDIRECT_URL || 'https://www.instagram.com/accounts/login/';
    console.log('Error occurred, redirecting to default URL:', redirectUrl);
    return res.redirect(302, redirectUrl);
  }
}; 