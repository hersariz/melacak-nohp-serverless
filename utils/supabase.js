const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Inisialisasi klien Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://tgoonwkaafjkwvntdxnv.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb29ud2thYWZqa3d2bnRkeG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NDcyODQsImV4cCI6MjA2NTUyMzI4NH0.U6o_pG2LokG2ZUJXyHBrPJsFcf-6kXew-kZkktoubQg';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb29ud2thYWZqa3d2bnRkeG52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0NzI4NCwiZXhwIjoyMDY1NTIzMjg0fQ.ddn8IOLEBZ_Iypb4xAPqc02ZGMBmw9SiswGJazjjBCY';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set');
console.log('Supabase Service Role Key:', supabaseServiceRoleKey ? 'Set' : 'Not set');

// Buat klien Supabase dengan error handling
let supabase = null;
let supabaseAdmin = null;

try {
  // Klien dengan anonymous key (untuk operasi publik)
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Klien dengan service role key (untuk operasi admin)
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  console.log('Supabase clients created successfully');
} catch (error) {
  console.error('Error creating Supabase clients:', error);
  
  // Buat dummy clients jika gagal
  supabase = {
    from: () => ({
      insert: () => Promise.resolve({ data: null, error: { message: 'Dummy client, not connected to Supabase' } }),
      select: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) })
    })
  };
  
  supabaseAdmin = { ...supabase };
  
  console.log('Created fallback dummy Supabase clients');
}

module.exports = { supabase, supabaseAdmin }; 