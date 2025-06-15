const { createClient } = require('@supabase/supabase-js');

// Inisialisasi klien Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Klien dengan anonymous key (untuk operasi publik)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Klien dengan service role key (untuk operasi admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = { supabase, supabaseAdmin }; 