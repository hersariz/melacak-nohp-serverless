// API untuk redirect dari short link ke target URL
const { supabase } = require('../../utils/supabase');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Ambil kode dari path parameter
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Short code is required' });
    }
    
    // Cari link di database
    const { data, error } = await supabase
      .from('links')
      .select('target_url')
      .eq('tracking_id', code)
      .single();
    
    if (error || !data) {
      console.error('Error finding link:', error);
      return res.status(404).json({ error: 'Link not found' });
    }
    
    // Update link clicks
    const { error: updateError } = await supabase
      .from('links')
      .update({ 
        clicks: supabase.rpc('increment_counter', { x: 1 }),
        last_click: new Date().toISOString()
      })
      .eq('tracking_id', code);
    
    if (updateError) {
      console.error('Error updating link clicks:', updateError);
      // Lanjutkan meskipun gagal update clicks
    }
    
    // Redirect ke target URL
    res.redirect(302, data.target_url);
  } catch (error) {
    console.error('Error in redirect API:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}; 