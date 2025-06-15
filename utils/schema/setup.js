// Script untuk membuat tabel-tabel di Supabase
const { supabaseAdmin } = require('../supabase');

// Setup database
async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Buat tabel links jika belum ada
    console.log('Creating links table...');
    const { error: createLinksError } = await supabaseAdmin.rpc('create_table_if_not_exists', { 
      table_name: 'links',
      table_definition: `
        id SERIAL PRIMARY KEY,
        tracking_id TEXT UNIQUE NOT NULL,
        target_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        clicks INTEGER DEFAULT 0,
        last_click TIMESTAMP WITH TIME ZONE,
        custom_code TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_by TEXT,
        notes TEXT,
        expiry_date TIMESTAMP WITH TIME ZONE
      `
    });
    
    if (createLinksError) {
      // Jika RPC tidak ada, buat tabel secara langsung
      console.log('Creating links table directly...');
      const { error } = await supabaseAdmin.from('links').select('count').limit(1);
      
      if (error && error.code === 'PGRST116') {
        // Tabel tidak ada, buat secara manual menggunakan API Supabase
        console.log('Table links does not exist, creating...');
        
        // Gunakan Supabase API untuk membuat tabel
        // Catatan: Ini hanya simulasi, karena Supabase JS client tidak mendukung DDL
        console.log('Please create the links table manually in Supabase dashboard with the following structure:');
        console.log(`
          CREATE TABLE links (
            id SERIAL PRIMARY KEY,
            tracking_id TEXT UNIQUE NOT NULL,
            target_url TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            clicks INTEGER DEFAULT 0,
            last_click TIMESTAMP WITH TIME ZONE,
            custom_code TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_by TEXT,
            notes TEXT,
            expiry_date TIMESTAMP WITH TIME ZONE
          );
          
          CREATE INDEX idx_links_tracking_id ON links (tracking_id);
          CREATE INDEX idx_links_custom_code ON links (custom_code);
        `);
      } else {
        console.log('Table links already exists');
        
        // Tambahkan kolom baru jika tabel sudah ada
        console.log('Adding new columns to links table if they do not exist...');
        console.log(`
          ALTER TABLE links ADD COLUMN IF NOT EXISTS custom_code TEXT;
          ALTER TABLE links ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
          ALTER TABLE links ADD COLUMN IF NOT EXISTS created_by TEXT;
          ALTER TABLE links ADD COLUMN IF NOT EXISTS notes TEXT;
          ALTER TABLE links ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;
          
          CREATE INDEX IF NOT EXISTS idx_links_custom_code ON links (custom_code);
        `);
      }
    } else {
      console.log('Links table created successfully');
    }
    
    // Buat tabel logs jika belum ada
    console.log('Creating logs table...');
    const { error: createLogsError } = await supabaseAdmin.rpc('create_table_if_not_exists', { 
      table_name: 'logs',
      table_definition: `
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        tracking_id TEXT NOT NULL,
        ip TEXT,
        device TEXT,
        browser TEXT,
        os TEXT,
        latitude NUMERIC,
        longitude NUMERIC,
        user_agent TEXT,
        screen_resolution TEXT,
        language TEXT,
        referrer TEXT,
        country TEXT,
        city TEXT,
        isp TEXT
      `
    });
    
    if (createLogsError) {
      // Jika RPC tidak ada, buat tabel secara langsung
      console.log('Creating logs table directly...');
      const { error } = await supabaseAdmin.from('logs').select('count').limit(1);
      
      if (error && error.code === 'PGRST116') {
        // Tabel tidak ada, buat secara manual menggunakan API Supabase
        console.log('Table logs does not exist, creating...');
        
        // Gunakan Supabase API untuk membuat tabel
        // Catatan: Ini hanya simulasi, karena Supabase JS client tidak mendukung DDL
        console.log('Please create the logs table manually in Supabase dashboard with the following structure:');
        console.log(`
          CREATE TABLE logs (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            tracking_id TEXT NOT NULL,
            ip TEXT,
            device TEXT,
            browser TEXT,
            os TEXT,
            latitude NUMERIC,
            longitude NUMERIC,
            user_agent TEXT,
            screen_resolution TEXT,
            language TEXT,
            referrer TEXT,
            country TEXT,
            city TEXT,
            isp TEXT
          );
          
          CREATE INDEX idx_logs_tracking_id ON logs (tracking_id);
          CREATE INDEX idx_logs_timestamp ON logs (timestamp);
        `);
      } else {
        console.log('Table logs already exists');
        
        // Tambahkan kolom baru jika tabel sudah ada
        console.log('Adding new columns to logs table if they do not exist...');
        console.log(`
          ALTER TABLE logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
          ALTER TABLE logs ADD COLUMN IF NOT EXISTS screen_resolution TEXT;
          ALTER TABLE logs ADD COLUMN IF NOT EXISTS language TEXT;
          ALTER TABLE logs ADD COLUMN IF NOT EXISTS referrer TEXT;
          ALTER TABLE logs ADD COLUMN IF NOT EXISTS country TEXT;
          ALTER TABLE logs ADD COLUMN IF NOT EXISTS city TEXT;
          ALTER TABLE logs ADD COLUMN IF NOT EXISTS isp TEXT;
        `);
      }
    } else {
      console.log('Logs table created successfully');
    }
    
    // Buat tabel users untuk autentikasi admin
    console.log('Creating users table...');
    const { error: createUsersError } = await supabaseAdmin.rpc('create_table_if_not_exists', { 
      table_name: 'users',
      table_definition: `
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE
      `
    });
    
    if (createUsersError) {
      console.log('Creating users table directly...');
      const { error } = await supabaseAdmin.from('users').select('count').limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log('Table users does not exist, creating...');
        console.log(`
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_login TIMESTAMP WITH TIME ZONE
          );
          
          CREATE INDEX idx_users_username ON users (username);
          
          -- Insert default admin user (password: admin123)
          INSERT INTO users (username, password_hash, is_admin)
          VALUES ('admin', '$2a$10$XQtB7TL1q9wMvwG4rMvQy.zea7gRG5z.zZCl5UuM1xQKPRVIQzkXy', TRUE);
        `);
      } else {
        console.log('Table users already exists');
      }
    } else {
      console.log('Users table created successfully');
    }
    
    // Buat fungsi increment_counter jika belum ada
    console.log('Creating increment_counter function...');
    const { error: incrementFunctionError } = await supabaseAdmin.rpc('increment_counter', { x: 1 });
    
    if (incrementFunctionError) {
      console.log('Function increment_counter does not exist, please create it manually:');
      console.log(`
        CREATE OR REPLACE FUNCTION increment_counter(x integer)
        RETURNS integer AS $$
        BEGIN
          RETURN x + 1;
        END;
        $$ LANGUAGE plpgsql;
      `);
    } else {
      console.log('Function increment_counter already exists');
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

// Ekspor fungsi
module.exports = { setupDatabase };

// Jika file dijalankan langsung, setup database
if (require.main === module) {
  setupDatabase()
    .then(() => console.log('Setup completed'))
    .catch(err => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
} 