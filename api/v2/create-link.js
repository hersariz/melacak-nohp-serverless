// Import yang dibutuhkan
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

/**
 * Generate random tracking ID
 * @param {number} length - Length of ID
 * @returns {string} Random ID
 */
function generateTrackingId(length = 8) {
  return crypto.randomBytes(Math.ceil(length * 3 / 4))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, length);
}

/**
 * Get base URL for the application
 * @param {Object} req - Request object
 * @returns {string} Base URL
 */
function getBaseUrl(req) {
  const customDomain = process.env.NEXT_PUBLIC_SITE_URL;
  if (customDomain) {
    return customDomain;
  }
  
  const host = req.headers.host || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

/**
 * API handler for creating tracking links
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only accept POST method
  if (req.method !== 'POST') {
    return res.status(200).json({ 
      success: false, 
      error: 'Method Not Allowed',
      message: 'Only POST method is allowed'
    });
  }

  try {
    // Log request for debugging
    console.log('[v2/create-link] Request body:', req.body);
    
    // Validate request body
    if (!req.body) {
      return res.status(200).json({ 
        success: false, 
        error: 'Bad Request',
        message: 'Request body is empty'
      });
    }
    
    // Parse request body
    let url, tracking_id, custom_code, notes, expiry_date;
    
    try {
      // Try to parse the body properly
      if (typeof req.body === 'string') {
        const parsedBody = JSON.parse(req.body);
        url = parsedBody.url;
        tracking_id = parsedBody.tracking_id;
        custom_code = parsedBody.custom_code;
        notes = parsedBody.notes;
        expiry_date = parsedBody.expiry_date;
      } else {
        url = req.body.url;
        tracking_id = req.body.tracking_id;
        custom_code = req.body.custom_code;
        notes = req.body.notes;
        expiry_date = req.body.expiry_date;
      }
    } catch (parseError) {
      console.error('[v2/create-link] Error parsing request body:', parseError);
      // Default fallback if parsing fails
      url = req.body?.url;
    }
    
    // Log received parameters
    console.log('[v2/create-link] Received URL:', url);
    console.log('[v2/create-link] Received tracking_id:', tracking_id);
    console.log('[v2/create-link] Received custom_code:', custom_code);
    
    // Validate required parameters
    if (!url) {
      return res.status(200).json({ 
        success: false, 
        error: 'Bad Request',
        message: 'URL parameter is required'
      });
    }
    
    // Generate or use provided tracking ID
    const finalTrackingId = tracking_id || generateTrackingId();
    
    // Create tracking URL
    const baseUrl = getBaseUrl(req);
    const trackingUrl = `${baseUrl}/v2/t/${finalTrackingId}`;
    
    console.log('[v2/create-link] Generated tracking URL:', trackingUrl);
    console.log('[v2/create-link] Target URL:', url);
    
    // Prepare link data
    const linkData = {
      tracking_id: finalTrackingId,
      target_url: url,
      clicks: 0,
      custom_code: custom_code || null,
      created_at: new Date().toISOString(),
      is_active: true
    };
    
    // Add optional fields if provided
    if (notes) linkData.notes = notes;
    if (expiry_date) linkData.expiry_date = expiry_date;
    
    // Buat koneksi Supabase langsung di sini
    const supabaseUrl = process.env.SUPABASE_URL || 'https://tgoonwkaafjkwvntdxnv.supabase.co';
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb29ud2thYWZqa3d2bnRkeG52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0NzI4NCwiZXhwIjoyMDY1NTIzMjg0fQ.ddn8IOLEBZ_Iypb4xAPqc02ZGMBmw9SiswGJazjjBCY';
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Coba simpan ke database
    let dbResult = { status: 'pending', error: null };
    
    try {
      // Coba buat tabel jika belum ada (untuk jaga-jaga)
      try {
        await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.links (
              id SERIAL PRIMARY KEY,
              tracking_id VARCHAR(255) NOT NULL UNIQUE,
              target_url TEXT NOT NULL,
              custom_code VARCHAR(255) NULL,
              clicks INT DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              is_active BOOLEAN DEFAULT TRUE,
              notes TEXT NULL,
              expiry_date TIMESTAMP WITH TIME ZONE NULL
            );
          `
        });
      } catch (tableError) {
        console.log('[v2/create-link] Table creation attempt error (expected):', tableError.message);
      }
      
      // Insert data
      const { data, error } = await supabase
        .from('links')
        .insert([linkData]);
      
      if (error) {
        console.error('[v2/create-link] Error inserting link to database:', error);
        dbResult = { status: 'error', error: error.message };
      } else {
        console.log('[v2/create-link] Link saved to database successfully');
        dbResult = { status: 'success', data };
      }
    } catch (dbError) {
      console.error('[v2/create-link] Database operation error:', dbError);
      dbResult = { status: 'error', error: dbError.message };
    }
    
    // Selalu kembalikan sukses meskipun ada masalah database
    return res.status(200).json({
      success: true,
      tracking_id: finalTrackingId,
      short_url: trackingUrl,
      target_url: url,
      created_at: linkData.created_at,
      db_status: dbResult.status,
      db_message: dbResult.status === 'error' ? 
        `Error: ${dbResult.error}` : 
        'Data saved successfully'
    });
  } catch (error) {
    // Log error for debugging
    console.error('[v2/create-link] Error:', error);
    
    // Return error response but with status 200 to ensure client gets a valid JSON response
    return res.status(200).json({ 
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while creating the tracking link',
      details: error.message
    });
  }
}; 