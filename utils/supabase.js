const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Inisialisasi klien Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://tgoonwkaafjkwvntdxnv.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb29ud2thYWZqa3d2bnRkeG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NDcyODQsImV4cCI6MjA2NTUyMzI4NH0.U6o_pG2LokG2ZUJXyHBrPJsFcf-6kXew-kZkktoubQg';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb29ud2thYWZqa3d2bnRkeG52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0NzI4NCwiZXhwIjoyMDY1NTIzMjg0fQ.ddn8IOLEBZ_Iypb4xAPqc02ZGMBmw9SiswGJazjjBCY';

// Opsi konfigurasi Supabase
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: { 'x-application-name': 'melacak-nohp-serverless' },
  },
  db: {
    schema: 'public'
  },
  realtime: {
    timeout: 10000 // 10 detik
  }
};

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set');
console.log('Supabase Service Role Key:', supabaseServiceRoleKey ? 'Set' : 'Not set');

// Buat klien Supabase dengan error handling
let supabase = null;
let supabaseAdmin = null;

try {
  // Klien dengan anonymous key (untuk operasi publik)
  supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);
  
  // Klien dengan service role key (untuk operasi admin)
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, supabaseOptions);
  
  console.log('Supabase clients created successfully');
  
  // Validasi koneksi dengan ping sederhana
  (async () => {
    try {
      const { data, error } = await supabase.from('links').select('count').limit(1);
      if (error) {
        console.warn('Supabase connection test failed:', error.message);
      } else {
        console.log('Supabase connection test successful');
      }
    } catch (e) {
      console.warn('Supabase connection test error:', e.message);
    }
  })();
} catch (error) {
  console.error('Error creating Supabase clients:', error);
  
  // Buat dummy clients jika gagal
  const createDummyClient = () => {
    return {
      from: (table) => ({
        insert: (data) => {
          console.log(`[DUMMY] Would insert into ${table}:`, data);
          return Promise.resolve({ data: null, error: { message: 'Dummy client, not connected to Supabase' } });
        },
        select: (columns) => {
          console.log(`[DUMMY] Would select ${columns || '*'} from ${table}`);
          return Promise.resolve({ data: [], error: null });
        },
        update: (data) => {
          console.log(`[DUMMY] Would update ${table}:`, data);
          return Promise.resolve({ data: null, error: null });
        },
        eq: (column, value) => {
          console.log(`[DUMMY] Would filter ${table} where ${column} = ${value}`);
          return {
            single: () => Promise.resolve({ data: null, error: null })
          };
        },
        limit: (n) => {
          console.log(`[DUMMY] Would limit ${table} to ${n} rows`);
          return Promise.resolve({ data: [], error: null });
        }
      }),
      auth: {
        signIn: () => Promise.resolve({ user: null, session: null, error: { message: 'Dummy auth client' } }),
        signOut: () => Promise.resolve({ error: null })
      }
    };
  };
  
  supabase = createDummyClient();
  supabaseAdmin = createDummyClient();
  
  console.log('Created fallback dummy Supabase clients');
}

module.exports = { supabase, supabaseAdmin }; 