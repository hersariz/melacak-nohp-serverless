/**
 * API untuk redirect dari URL pendek ke tracker
 * Versi baru dengan penanganan error yang lebih baik
 */
const { createClient } = require('@supabase/supabase-js');

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
    
    console.log('[v2/t/id] Processing tracking ID:', id);
    
    if (!id) {
      console.error('[v2/t/id] No tracking ID provided');
      return res.redirect(302, DEFAULT_REDIRECT_URL);
    }
    
    // Get base URL for tracker API
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    // Buat koneksi Supabase langsung di sini
    const supabaseUrl = process.env.SUPABASE_URL || 'https://tgoonwkaafjkwvntdxnv.supabase.co';
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb29ud2thYWZqa3d2bnRkeG52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0NzI4NCwiZXhwIjoyMDY1NTIzMjg0fQ.ddn8IOLEBZ_Iypb4xAPqc02ZGMBmw9SiswGJazjjBCY';
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Try to get target URL from database with timeout protection
    let targetUrl = null;
    
    try {
      // Query database
      const { data, error } = await supabase
        .from('links')
        .select('target_url, is_active, expiry_date')
        .eq('tracking_id', id)
        .single();
      
      if (error) {
        console.error('[v2/t/id] Error fetching link from database:', error);
      } else if (data) {
        // Check if link is active
        if (!data.is_active) {
          console.log('[v2/t/id] Link is inactive:', id);
        } 
        // Check if link has expired
        else if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
          console.log('[v2/t/id] Link has expired:', id);
        }
        // Use target URL if link is active and not expired
        else if (data.target_url) {
          targetUrl = data.target_url;
          console.log('[v2/t/id] Found target URL in database:', targetUrl);
        }
      }
    } catch (dbError) {
      console.error('[v2/t/id] Database operation error:', dbError);
    }
    
    // Build tracker URL with target URL as parameter if available
    const trackerUrl = targetUrl 
      ? `${baseUrl}/api/v2/tracker?id=${id}&target=${encodeURIComponent(targetUrl)}`
      : `${baseUrl}/api/v2/tracker?id=${id}`;
    
    console.log('[v2/t/id] Redirecting to tracker:', trackerUrl);
    
    // Redirect to tracker API
    return res.redirect(302, trackerUrl);
  } catch (error) {
    console.error('[v2/t/id] Error:', error);
    
    // Always redirect to default URL if any error occurs
    return res.redirect(302, DEFAULT_REDIRECT_URL);
  }
};
