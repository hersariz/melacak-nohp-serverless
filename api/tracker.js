// API untuk tracking
const { supabase } = require('../utils/supabase');
const UAParser = require('ua-parser-js');

// Konfigurasi
const REDIRECT_URL = process.env.REDIRECT_URL || 'https://www.instagram.com/accounts/login/';

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
    // Ambil tracking ID dari query parameter
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Tracking ID is required' });
    }
    
    // Parse user agent
    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    // Tentukan jenis device
    let deviceType = 'Tidak diketahui';
    if (result.device && result.device.type) {
      switch (result.device.type) {
        case 'mobile':
          deviceType = 'Mobile';
          break;
        case 'tablet':
          deviceType = 'Tablet';
          break;
        case 'desktop':
          deviceType = 'Desktop';
          break;
        default:
          deviceType = 'Tidak diketahui';
      }
    } else if (!result.device.type && result.os.name) {
      // Jika tidak ada device type tapi ada OS, asumsikan desktop untuk OS desktop umum
      const desktopOS = ['Windows', 'Mac OS', 'Linux', 'Ubuntu', 'Debian'];
      if (desktopOS.includes(result.os.name)) {
        deviceType = 'Desktop';
      }
    }
    
    // Dapatkan IP address
    const ip = req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // Data log
    const logData = {
      tracking_id: id,
      ip: ip || 'Unknown',
      device: deviceType,
      browser: result.browser.name || 'Unknown',
      os: result.os.name || 'Unknown'
    };
    
    // Simpan log ke database
    const { error: logError } = await supabase
      .from('logs')
      .insert([logData]);
    
    if (logError) {
      console.error('Error saving log to database:', logError);
      // Lanjutkan meskipun gagal menyimpan log
    }
    
    // Update link clicks
    const { error: updateError } = await supabase
      .from('links')
      .update({ 
        clicks: supabase.rpc('increment_counter', { x: 1 }),
        last_click: new Date().toISOString()
      })
      .eq('tracking_id', id);
    
    if (updateError) {
      console.error('Error updating link clicks:', updateError);
      // Lanjutkan meskipun gagal update clicks
    }
    
    // Redirect ke URL yang ditentukan
    res.redirect(302, REDIRECT_URL);
  } catch (error) {
    console.error('Error in tracker API:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}; 