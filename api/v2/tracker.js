/**
 * API untuk tracking - Versi 2
 * Mengumpulkan data pengunjung dan menyimpan ke database
 */
const { createClient } = require('@supabase/supabase-js');
const UAParser = require('ua-parser-js');

// Default redirect URL
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

  // Only accept GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method Not Allowed',
      message: 'Only GET method is allowed'
    });
  }

  // Set default redirect URL
  let redirectUrl = DEFAULT_REDIRECT_URL;
  
  // Get tracking ID and target URL from query parameters
  const { id, target } = req.query;
  
  console.log('[v2/tracker] Processing tracking ID:', id);
  console.log('[v2/tracker] Target URL from query:', target);
  
  // Use target URL from parameter if available
  if (target) {
    redirectUrl = target;
    console.log('[v2/tracker] Using target URL from parameter:', redirectUrl);
  }
  
  // Buat koneksi Supabase langsung di sini
  const supabaseUrl = process.env.SUPABASE_URL || 'https://tgoonwkaafjkwvntdxnv.supabase.co';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb29ud2thYWZqa3d2bnRkeG52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0NzI4NCwiZXhwIjoyMDY1NTIzMjg0fQ.ddn8IOLEBZ_Iypb4xAPqc02ZGMBmw9SiswGJazjjBCY';
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // If no tracking ID provided, redirect immediately
    if (!id) {
      console.error('[v2/tracker] No tracking ID provided');
      return res.redirect(302, redirectUrl);
    }
    
    // If no target URL from parameter, try to get from database asynchronously
    if (!target) {
      // We'll query the database but not wait for the result
      supabase
        .from('links')
        .select('target_url')
        .eq('tracking_id', id)
        .single()
        .then(({ data, error }) => {
          if (!error && data && data.target_url) {
            console.log('[v2/tracker] Found target URL in database:', data.target_url);
            // We can't use this for redirect since we've already sent the response
          } else {
            console.log('[v2/tracker] Target URL not found in database, using default');
          }
        })
        .catch(error => {
          console.error('[v2/tracker] Error fetching target URL:', error);
        });
    }
    
    // Parse user agent
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    // Determine device type
    let deviceType = 'Unknown';
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
          deviceType = 'Unknown';
      }
    } else if (result.os && result.os.name) {
      // If no device type but OS exists, assume desktop for common desktop OS
      const desktopOS = ['Windows', 'Mac OS', 'Linux', 'Ubuntu', 'Debian'];
      if (desktopOS.includes(result.os.name)) {
        deviceType = 'Desktop';
      }
    }
    
    // Get IP address
    const ip = req.headers['x-forwarded-for'] || 
               (req.connection && req.connection.remoteAddress) || 
               (req.socket && req.socket.remoteAddress) ||
               (req.connection && req.connection.socket && req.connection.socket.remoteAddress) || 
               'Unknown';
    
    // Get referrer
    const referrer = req.headers.referer || req.headers.referrer || 'Direct';
    
    // Get language
    const language = req.headers['accept-language'] || 'Unknown';
    
    // Prepare log data
    const logData = {
      tracking_id: id,
      ip: ip,
      device: deviceType,
      browser: result.browser && result.browser.name ? result.browser.name : 'Unknown',
      os: result.os && result.os.name ? result.os.name : 'Unknown',
      timestamp: new Date().toISOString(),
      user_agent: userAgent,
      language: language.split(',')[0],
      referrer: referrer
    };
    
    console.log('[v2/tracker] Tracking data:', logData);
    
    // Coba buat tabel logs jika belum ada (untuk jaga-jaga)
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.logs (
            id SERIAL PRIMARY KEY,
            tracking_id VARCHAR(255) NOT NULL,
            ip VARCHAR(255),
            device VARCHAR(50),
            browser VARCHAR(50),
            os VARCHAR(50),
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            user_agent TEXT,
            language VARCHAR(50),
            referrer TEXT
          );
        `
      });
    } catch (tableError) {
      console.log('[v2/tracker] Table creation attempt error (expected):', tableError.message);
    }
    
    // Save log to database in background
    // Don't wait for database operation to complete to avoid timeout
    setTimeout(() => {
      try {
        // Insert log
        supabase
          .from('logs')
          .insert([logData])
          .then(({ error }) => {
            if (error) {
              console.error('[v2/tracker] Error saving log to database:', error);
            } else {
              console.log('[v2/tracker] Log saved successfully');
              
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
                          console.error('[v2/tracker] Error updating link clicks:', updateError);
                        } else {
                          console.log('[v2/tracker] Link clicks updated successfully');
                        }
                      });
                  }
                });
            }
          })
          .catch(error => {
            console.error('[v2/tracker] Error in database operation:', error);
          });
      } catch (dbError) {
        console.error('[v2/tracker] Database operation error:', dbError);
      }
    }, 10);
  } catch (error) {
    console.error('[v2/tracker] Error:', error);
    // Error handling doesn't change redirect flow
  } finally {
    // Always redirect to target URL, regardless of what happens
    console.log('[v2/tracker] Redirecting to:', redirectUrl);
    return res.redirect(302, redirectUrl);
  }
};
