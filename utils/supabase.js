const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Inisialisasi klien Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set');
console.log('Supabase Service Role Key:', supabaseServiceRoleKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

// Klien dengan anonymous key (untuk operasi publik)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Klien dengan service role key (untuk operasi admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = { supabase, supabaseAdmin }; 