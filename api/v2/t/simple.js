/**
 * API untuk redirect dari URL pendek ke target langsung
 * Versi sederhana tanpa database
 */

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

  // Only accept GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method Not Allowed',
      message: 'Only GET method is allowed'
    });
  }

  // Default redirect URL as fallback
  const DEFAULT_REDIRECT_URL = process.env.REDIRECT_URL || 'https://www.instagram.com/accounts/login/';
  
  try {
    // Get tracking ID from path parameter
    const { id } = req.query;
    
    console.log('[v2/t/simple] Processing tracking ID:', id);
    
    if (!id) {
      console.error('[v2/t/simple] No tracking ID provided');
      return res.redirect(302, DEFAULT_REDIRECT_URL);
    }
    
    // Simpan data tracking di log
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.headers['x-forwarded-for'] || 
               (req.connection && req.connection.remoteAddress) || 
               'Unknown';
    
    console.log('[v2/t/simple] Tracking data:', {
      tracking_id: id,
      ip: ip,
      user_agent: userAgent,
      timestamp: new Date().toISOString()
    });
    
    // Redirect ke URL default (tanpa query database)
    console.log('[v2/t/simple] Redirecting to default URL');
    return res.redirect(302, DEFAULT_REDIRECT_URL);
  } catch (error) {
    console.error('[v2/t/simple] Error:', error);
    
    // Always redirect to default URL if any error occurs
    return res.redirect(302, DEFAULT_REDIRECT_URL);
  }
}; 