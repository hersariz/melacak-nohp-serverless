// Script untuk membuat tabel-tabel di Supabase
const { supabaseAdmin } = require('../supabase');

// Fungsi untuk membuat tabel links
async function createLinksTable() {
  const { error } = await supabaseAdmin
    .from('links')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (error && error.code === 'PGRST116') {
    // Tabel belum ada, buat tabel
    console.log('Creating links table...');
    const { error: createError } = await supabaseAdmin.rpc('create_links_table');
    
    if (createError) {
      console.error('Error creating links table:', createError);
      throw createError;
    }
    console.log('Links table created successfully');
  } else {
    console.log('Links table already exists');
  }
}

// Fungsi untuk membuat tabel logs
async function createLogsTable() {
  const { error } = await supabaseAdmin
    .from('logs')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (error && error.code === 'PGRST116') {
    // Tabel belum ada, buat tabel
    console.log('Creating logs table...');
    const { error: createError } = await supabaseAdmin.rpc('create_logs_table');
    
    if (createError) {
      console.error('Error creating logs table:', createError);
      throw createError;
    }
    console.log('Logs table created successfully');
  } else {
    console.log('Logs table already exists');
  }
}

// Setup database
async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Buat SQL function untuk membuat tabel links jika belum ada
    const { error: createLinksFnError } = await supabaseAdmin.rpc('create_function_create_links_table');
    if (createLinksFnError) {
      console.log('Creating create_links_table function...');
      const { error } = await supabaseAdmin.sql(`
        CREATE OR REPLACE FUNCTION create_links_table()
        RETURNS void AS $$
        BEGIN
          CREATE TABLE IF NOT EXISTS links (
            id SERIAL PRIMARY KEY,
            tracking_id TEXT UNIQUE NOT NULL,
            target_url TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            clicks INTEGER DEFAULT 0,
            last_click TIMESTAMP WITH TIME ZONE
          );
          
          -- Tambahkan indeks untuk pencarian cepat
          CREATE INDEX IF NOT EXISTS idx_links_tracking_id ON links (tracking_id);
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      if (error) {
        console.error('Error creating function create_links_table:', error);
        throw error;
      }
      console.log('Function create_links_table created successfully');
    }
    
    // Buat SQL function untuk membuat tabel logs jika belum ada
    const { error: createLogsFnError } = await supabaseAdmin.rpc('create_function_create_logs_table');
    if (createLogsFnError) {
      console.log('Creating create_logs_table function...');
      const { error } = await supabaseAdmin.sql(`
        CREATE OR REPLACE FUNCTION create_logs_table()
        RETURNS void AS $$
        BEGIN
          CREATE TABLE IF NOT EXISTS logs (
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
          
          -- Tambahkan indeks untuk pencarian cepat
          CREATE INDEX IF NOT EXISTS idx_logs_tracking_id ON logs (tracking_id);
          CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs (timestamp);
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      if (error) {
        console.error('Error creating function create_logs_table:', error);
        throw error;
      }
      console.log('Function create_logs_table created successfully');
    }
    
    // Buat tabel-tabel
    await createLinksTable();
    await createLogsTable();
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

// Ekspor fungsi
module.exports = { setupDatabase, createLinksTable, createLogsTable };

// Jika file dijalankan langsung, setup database
if (require.main === module) {
  setupDatabase()
    .then(() => console.log('Setup completed'))
    .catch(err => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
} 