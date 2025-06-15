// API untuk tracking
const { supabase } = require('../utils/supabase');
const UAParser = require('ua-parser-js');

// Konfigurasi
const DEFAULT_REDIRECT_URL = process.env.REDIRECT_URL || 'https://www.instagram.com/accounts/login/';

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

  // Siapkan redirect URL default - ini akan digunakan jika terjadi error
  let redirectUrl = DEFAULT_REDIRECT_URL;
  
  // Ambil tracking ID dan target URL dari query parameter
  const { id, target } = req.query;
  
  console.log('Processing tracking ID:', id);
  console.log('Target URL from query:', target);
  
  // Gunakan target URL dari parameter jika ada
  if (target) {
    redirectUrl = target;
    console.log('Using target URL from parameter:', redirectUrl);
  }
  
  try {
    // Jika tidak ada ID, langsung redirect
    if (!id) {
      console.error('No tracking ID provided');
      return res.redirect(302, redirectUrl);
    }
    
    // Jika tidak ada target URL dari parameter, coba ambil dari database
    // tapi jangan tunggu hasilnya untuk menghindari timeout
    if (!target) {
      // Coba ambil target URL dari database secara asynchronous
      supabase
        .from('links')
        .select('target_url')
        .eq('tracking_id', id)
        .single()
        .then(({ data, error }) => {
          if (!error && data && data.target_url) {
            console.log('Found target URL in database:', data.target_url);
            // Tidak mengubah redirectUrl karena kita sudah memanggil res.redirect
          } else {
            console.log('Target URL not found in database, using default');
          }
        })
        .catch(error => {
          console.error('Error fetching target URL:', error);
        });
    }
    
    // Parse user agent
    const userAgent = req.headers['user-agent'] || '';
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
    } else if (result.os && result.os.name) {
      // Jika tidak ada device type tapi ada OS, asumsikan desktop untuk OS desktop umum
      const desktopOS = ['Windows', 'Mac OS', 'Linux', 'Ubuntu', 'Debian'];
      if (desktopOS.includes(result.os.name)) {
        deviceType = 'Desktop';
      }
    }
    
    // Dapatkan IP address
    const ip = req.headers['x-forwarded-for'] || 
               (req.connection && req.connection.remoteAddress) || 
               (req.socket && req.socket.remoteAddress) ||
               (req.connection && req.connection.socket && req.connection.socket.remoteAddress) || 
               'Unknown';
    
    // Data log
    const logData = {
      tracking_id: id,
      ip: ip,
      device: deviceType,
      browser: result.browser && result.browser.name ? result.browser.name : 'Unknown',
      os: result.os && result.os.name ? result.os.name : 'Unknown',
      timestamp: new Date().toISOString()
    };
    
    console.log('Tracking data:', logData);
    
    // Simpan log ke database dalam background
    // Tidak menunggu operasi database selesai untuk menghindari timeout
    setTimeout(() => {
      try {
        // Simpan log ke database
        supabase
          .from('logs')
          .insert([logData])
          .then(({ error }) => {
            if (error) {
              console.error('Error saving log to database:', error);
            } else {
              console.log('Log saved successfully');
              
              // Update link clicks
              supabase
                .from('links')
                .select('clicks')
                .eq('tracking_id', id)
                .single()
                .then(({ data: linkData, error: getLinkError }) => {
                  if (!getLinkError && linkData) {
                    // Update link clicks
                    const newClicks = (linkData.clicks || 0) + 1;
                    supabase
                      .from('links')
                      .update({ 
                        clicks: newClicks,
                        last_click: new Date().toISOString()
                      })
                      .eq('tracking_id', id)
                      .then(({ error: updateError }) => {
                        if (updateError) {
                          console.error('Error updating link clicks:', updateError);
                        } else {
                          console.log('Link clicks updated successfully');
                        }
                      });
                  }
                });
            }
          })
          .catch(error => {
            console.error('Error in database operation:', error);
          });
      } catch (dbError) {
        console.error('Database operation error:', dbError);
      }
    }, 10);
  } catch (error) {
    console.error('Error in tracker API:', error);
    // Error handling tidak perlu mengubah alur redirect
  } finally {
    // Selalu redirect ke URL target, terlepas dari apapun yang terjadi
    console.log('Redirecting to:', redirectUrl);
    return res.redirect(302, redirectUrl);
  }
}; 