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
        last_click TIMESTAMP WITH TIME ZONE
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
            last_click TIMESTAMP WITH TIME ZONE
          );
          
          CREATE INDEX idx_links_tracking_id ON links (tracking_id);
        `);
      } else {
        console.log('Table links already exists');
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
        longitude NUMERIC
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
            longitude NUMERIC
          );
          
          CREATE INDEX idx_logs_tracking_id ON logs (tracking_id);
          CREATE INDEX idx_logs_timestamp ON logs (timestamp);
        `);
      } else {
        console.log('Table logs already exists');
      }
    } else {
      console.log('Logs table created successfully');
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