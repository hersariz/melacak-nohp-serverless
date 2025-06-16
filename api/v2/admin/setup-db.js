const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

// Inisialisasi klien Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://tgoonwkaafjkwvntdxnv.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb29ud2thYWZqa3d2bnRkeG52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0NzI4NCwiZXhwIjoyMDY1NTIzMjg0fQ.ddn8IOLEBZ_Iypb4xAPqc02ZGMBmw9SiswGJazjjBCY';
const setupKey = process.env.SETUP_KEY || 'setup123';

// API Endpoint handler
module.exports = async (req, res) => {
  // Ini untuk debug environment
  console.log('Environment variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('SUPABASE_URL:', supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'Set (masked)' : 'Not set');
  console.log('SETUP_KEY:', setupKey ? 'Set (masked)' : 'Not set');
  
  // Debug request
  console.log('Request query:', req.query);
  console.log('Request path:', req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Basic security check
  const requestKey = req.query.key || '';
  if (requestKey !== setupKey) {
    console.log('Unauthorized access attempt with key:', requestKey);
    return res.status(403).json({ 
      success: false, 
      message: 'Unauthorized access. Please provide the correct setup key via ?key=YOUR_KEY'
    });
  }

  try {
    console.log('Initializing Supabase client...');
    
    // Buat klien Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });
    
    console.log('Creating tables...');
    
    // Buat tabel links jika belum ada
    try {
      const createLinksTableQuery = `
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
        
        CREATE INDEX IF NOT EXISTS idx_links_tracking_id ON public.links(tracking_id);
        CREATE INDEX IF NOT EXISTS idx_links_custom_code ON public.links(custom_code);
      `;
      
      const { error: createLinksError } = await supabase.rpc('exec_sql', {
        sql: createLinksTableQuery
      });
      
      if (createLinksError) {
        console.error('Error creating links table:', createLinksError);
      } else {
        console.log('Links table created or already exists');
      }
    } catch (tableError) {
      console.error('Error in table creation:', tableError);
    }
    
    // Buat tabel tracker_visits jika belum ada
    try {
      const createVisitsTableQuery = `
        CREATE TABLE IF NOT EXISTS public.tracker_visits (
          id SERIAL PRIMARY KEY,
          tracking_id VARCHAR(255) NOT NULL,
          visit_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ip_address VARCHAR(45) NULL,
          user_agent TEXT NULL,
          browser VARCHAR(255) NULL,
          browser_version VARCHAR(100) NULL,
          os VARCHAR(255) NULL,
          os_version VARCHAR(100) NULL,
          device_type VARCHAR(50) NULL,
          device_brand VARCHAR(100) NULL,
          device_model VARCHAR(100) NULL,
          country VARCHAR(100) NULL,
          city VARCHAR(100) NULL,
          latitude DECIMAL(10,6) NULL,
          longitude DECIMAL(10,6) NULL,
          isp VARCHAR(255) NULL,
          network VARCHAR(255) NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_tracker_visits_tracking_id ON public.tracker_visits(tracking_id);
      `;
      
      const { error: createVisitsError } = await supabase.rpc('exec_sql', {
        sql: createVisitsTableQuery
      });
      
      if (createVisitsError) {
        console.error('Error creating visits table:', createVisitsError);
      } else {
        console.log('Tracker visits table created or already exists');
      }
    } catch (tableError) {
      console.error('Error in visits table creation:', tableError);
    }
    
    // Verifikasi tabel
    console.log('Verifying tables...');
    
    // Cek tabel links
    const { data: linksData, error: linksError } = await supabase
      .from('links')
      .select('id')
      .limit(1);
    
    // Cek tabel tracker_visits
    const { data: visitsData, error: visitsError } = await supabase
      .from('tracker_visits')
      .select('id')
      .limit(1);
    
    return res.status(200).json({
      success: true,
      message: 'Database setup process completed',
      verification: {
        links_table: !linksError ? 'OK' : 'Error: ' + linksError.message,
        visits_table: !visitsError ? 'OK' : 'Error: ' + visitsError.message,
      },
      environment: {
        node_env: process.env.NODE_ENV,
        supabase_url_set: !!supabaseUrl,
        supabase_key_set: !!supabaseServiceRoleKey,
        setup_key_set: !!setupKey
      }
    });
  } catch (error) {
    console.error('Error in setup-db endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Error in setup-db endpoint',
      error: error.message
    });
  }
}; 