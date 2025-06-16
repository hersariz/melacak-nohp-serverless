const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

// Inisialisasi klien Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://tgoonwkaafjkwvntdxnv.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb29ud2thYWZqa3d2bnRkeG52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0NzI4NCwiZXhwIjoyMDY1NTIzMjg0fQ.ddn8IOLEBZ_Iypb4xAPqc02ZGMBmw9SiswGJazjjBCY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

async function setupDatabase() {
  try {
    // Cek apakah tabel links sudah ada
    console.log('Checking if links table exists...');
    
    // Coba pilih satu baris dari tabel links
    const { data: existingLinks, error: checkError } = await supabase
      .from('links')
      .select('tracking_id')
      .limit(1);
    
    if (checkError) {
      if (checkError.message.includes('relation "public.links" does not exist')) {
        console.log('Table links does not exist, creating it now...');
        
        // Gunakan Supabase SQL untuk membuat tabel
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE public.links (
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
            
            CREATE INDEX idx_links_tracking_id ON public.links(tracking_id);
            CREATE INDEX idx_links_custom_code ON public.links(custom_code);
          `
        });
        
        if (createError) {
          console.error('Error creating table:', createError);
          
          // Coba cara alternatif untuk membuat tabel jika RPC tidak tersedia
          console.log('Trying alternative method for table creation...');
          
          try {
            // Menggunakan REST API untuk membuat tabel
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceRoleKey}`,
                'apikey': supabaseServiceRoleKey
              },
              body: JSON.stringify({
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
                  
                  CREATE INDEX IF NOT EXISTS idx_links_tracking_id ON public.links(tracking_id);
                  CREATE INDEX IF NOT EXISTS idx_links_custom_code ON public.links(custom_code);
                `
              })
            });
            
            if (response.ok) {
              console.log('Table created successfully using REST API');
            } else {
              console.error('Failed to create table using REST API:', await response.text());
              
              // Gunakan metode alternatif jika keduanya gagal
              console.log('Using direct SQL query as last resort...');
              await directSqlCreation();
            }
          } catch (fetchError) {
            console.error('Error using alternative method:', fetchError);
            await directSqlCreation();
          }
        } else {
          console.log('Table created successfully!');
        }
        
        // Fungsi untuk membuat tabel menggunakan SQL langsung
        async function directSqlCreation() {
          try {
            // Menggunakan query SQL langsung
            const { error: directError } = await supabase.rpc('exec_sql', {
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
            
            if (directError) {
              console.error('Direct SQL creation failed:', directError);
            } else {
              console.log('Table created using direct SQL!');
              
              // Buat indeks secara terpisah
              await supabase.rpc('exec_sql', {
                sql: `CREATE INDEX IF NOT EXISTS idx_links_tracking_id ON public.links(tracking_id);`
              });
              
              await supabase.rpc('exec_sql', {
                sql: `CREATE INDEX IF NOT EXISTS idx_links_custom_code ON public.links(custom_code);`
              });
            }
          } catch (err) {
            console.error('Error in direct SQL creation:', err);
          }
        }
        
        // Cek apakah tabel visits perlu dibuat
        const { error: checkVisitsError } = await supabase
          .from('tracker_visits')
          .select('id')
          .limit(1);
        
        if (checkVisitsError && checkVisitsError.message.includes('relation "public.tracker_visits" does not exist')) {
          console.log('Creating tracker_visits table...');
          
          await supabase.rpc('exec_sql', {
            sql: `
              CREATE TABLE public.tracker_visits (
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
              
              CREATE INDEX idx_tracker_visits_tracking_id ON public.tracker_visits(tracking_id);
            `
          });
          
          console.log('tracker_visits table created!');
          
          // Tambahkan foreign key secara terpisah untuk menghindari error jika links belum ada
          try {
            await supabase.rpc('exec_sql', {
              sql: `
                ALTER TABLE public.tracker_visits 
                ADD CONSTRAINT fk_tracker_visits_tracking_id 
                FOREIGN KEY (tracking_id) 
                REFERENCES public.links(tracking_id) 
                ON DELETE CASCADE;
              `
            });
            console.log('Foreign key constraint added successfully');
          } catch (fkError) {
            console.warn('Could not add foreign key constraint:', fkError);
          }
        }
        
        return { success: true, message: 'Tables created successfully' };
      } else {
        console.error('Error checking links table:', checkError);
        return { success: false, message: 'Error checking links table: ' + checkError.message };
      }
    } else {
      console.log('Table links already exists!');
      return { success: true, message: 'Tables already exist' };
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    return { success: false, message: 'Error setting up database: ' + error.message };
  }
}

// API Endpoint handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only accept GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Meminta secret key untuk keamanan (opsional, bisa disesuaikan)
    const requestKey = req.query.key || '';
    const setupKey = process.env.SETUP_KEY || 'setup123'; // tambahkan key ini di .env
    
    if (requestKey !== setupKey) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access. Please provide the correct setup key via ?key=YOUR_KEY'
      });
    }
    
    // Jalankan setup database
    const result = await setupDatabase();
    
    // Kirim hasil sebagai JSON
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in setup-db endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Error in setup-db endpoint',
      error: error.message
    });
  }
}; 