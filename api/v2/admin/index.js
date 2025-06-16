/**
 * API untuk admin dashboard v2
 * Menangani berbagai aksi admin
 */

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Get action from query parameter
    const action = req.query.action || '';
    
    console.log('[v2/admin] Processing action:', action);
    
    // Handle different actions
    switch (action) {
      case 'info':
        // Return environment info
        return res.status(200).json({
          success: true,
          info: {
            environment: process.env.NODE_ENV || 'development',
            vercel: {
              region: process.env.VERCEL_REGION || 'unknown',
              url: process.env.VERCEL_URL || 'unknown'
            },
            supabase: {
              url: process.env.SUPABASE_URL || 'https://tgoonwkaafjkwvntdxnv.supabase.co',
              anon_key_set: !!process.env.SUPABASE_ANON_KEY,
              service_role_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY
            }
          }
        });
      
      case 'test':
        // Test endpoint
        return res.status(200).json({
          success: true,
          message: 'API is working',
          timestamp: new Date().toISOString()
        });
      
      case 'setup-db':
        // Setup database tables
        try {
          const { createClient } = require('@supabase/supabase-js');
          
          // Buat koneksi Supabase langsung di sini
          const supabaseUrl = process.env.SUPABASE_URL || 'https://tgoonwkaafjkwvntdxnv.supabase.co';
          const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb29ud2thYWZqa3d2bnRkeG52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0NzI4NCwiZXhwIjoyMDY1NTIzMjg0fQ.ddn8IOLEBZ_Iypb4xAPqc02ZGMBmw9SiswGJazjjBCY';
          
          const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          });
          
          // Create links table
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
                  expiry_date TIMESTAMP WITH TIME ZONE NULL,
                  last_click TIMESTAMP WITH TIME ZONE NULL
                );
              `
            });
            console.log('[v2/admin] Links table created or already exists');
          } catch (tableError) {
            console.log('[v2/admin] Links table creation error:', tableError.message);
          }
          
          // Create logs table
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
            console.log('[v2/admin] Logs table created or already exists');
          } catch (tableError) {
            console.log('[v2/admin] Logs table creation error:', tableError.message);
          }
          
          return res.status(200).json({
            success: true,
            message: 'Database setup completed',
            tables: ['links', 'logs']
          });
        } catch (dbError) {
          console.error('[v2/admin] Database setup error:', dbError);
          return res.status(200).json({
            success: false,
            error: 'Database Setup Error',
            message: dbError.message
          });
        }
      
      default:
        // Unknown action
        return res.status(200).json({
          success: false,
          error: 'Invalid Action',
          message: `Action '${action}' is not supported`,
          available_actions: ['info', 'test', 'setup-db']
        });
    }
  } catch (error) {
    console.error('[v2/admin] Error:', error);
    
    // Return error response
    return res.status(200).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}; 