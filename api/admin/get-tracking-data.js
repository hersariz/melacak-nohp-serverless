// API untuk mendapatkan data tracking
const { supabaseAdmin } = require('../../utils/supabase');

// Demo data statis untuk fallback
const demoData = {
  stats: {
    totalLogs: 3,
    totalLinks: 2,
    totalTrackingIds: 2,
    deviceStats: {
      Mobile: 1,
      Desktop: 1,
      Tablet: 1,
      Unknown: 0
    },
    browserStats: {
      Chrome: 1,
      Firefox: 1,
      Safari: 1
    },
    osStats: {
      Android: 1,
      Windows: 1,
      iOS: 1
    }
  },
  logs: [
    {
      timestamp: new Date().toISOString(),
      tracking_id: 'demo123',
      ip: '192.168.1.1',
      device: 'Mobile',
      browser: 'Chrome',
      os: 'Android'
    },
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      tracking_id: 'demo123',
      ip: '192.168.1.2',
      device: 'Desktop',
      browser: 'Firefox',
      os: 'Windows'
    },
    {
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      tracking_id: 'demo456',
      ip: '192.168.1.3',
      device: 'Tablet',
      browser: 'Safari',
      os: 'iOS'
    }
  ],
  links: {
    'demo123': {
      target_url: 'https://example.com/tracker?id=demo123',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      clicks: 10,
      last_click: new Date().toISOString()
    },
    'demo456': {
      target_url: 'https://example.com/tracker?id=demo456',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      clicks: 5,
      last_click: new Date(Date.now() - 3600000).toISOString()
    }
  },
  groupedLogs: {
    'demo123': [
      {
        timestamp: new Date().toISOString(),
        tracking_id: 'demo123',
        ip: '192.168.1.1',
        device: 'Mobile',
        browser: 'Chrome',
        os: 'Android'
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        tracking_id: 'demo123',
        ip: '192.168.1.2',
        device: 'Desktop',
        browser: 'Firefox',
        os: 'Windows'
      }
    ],
    'demo456': [
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        tracking_id: 'demo456',
        ip: '192.168.1.3',
        device: 'Tablet',
        browser: 'Safari',
        os: 'iOS'
      }
    ]
  }
};

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Verifikasi autentikasi (sederhana)
    const authHeader = req.headers.authorization;
    const expectedAuth = 'Basic ' + Buffer.from('admin:admin123').toString('base64');
    
    if (!authHeader || authHeader !== expectedAuth) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin Access"');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    // Coba ambil data dari Supabase dengan timeout
    try {
      console.log('Fetching data from Supabase...');
      
      // Tambahkan timeout untuk operasi database
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timed out')), 5000)
      );
      
      // Jalankan query dengan timeout
      const logsPromise = supabaseAdmin.from('logs').select('*').order('timestamp', { ascending: false });
      const linksPromise = supabaseAdmin.from('links').select('*');
      
      // Race antara operasi database dan timeout
      const [logsResult, linksResult] = await Promise.all([
        Promise.race([logsPromise, timeoutPromise]),
        Promise.race([linksPromise, timeoutPromise])
      ]);
      
      if (logsResult.error) {
        console.error('Error fetching logs:', logsResult.error);
        throw new Error(`Error fetching logs: ${logsResult.error.message}`);
      }
      
      if (linksResult.error) {
        console.error('Error fetching links:', linksResult.error);
        throw new Error(`Error fetching links: ${linksResult.error.message}`);
      }
      
      const logs = logsResult.data || [];
      const linksData = linksResult.data || [];
      
      // Format links data
      const links = {};
      linksData.forEach(link => {
        links[link.tracking_id] = {
          target_url: link.target_url,
          created_at: link.created_at,
          clicks: link.clicks || 0,
          last_click: link.last_click
        };
      });
      
      // Kelompokkan log berdasarkan tracking_id
      const groupedLogs = {};
      logs.forEach(log => {
        if (!log.tracking_id) return;
        
        if (!groupedLogs[log.tracking_id]) {
          groupedLogs[log.tracking_id] = [];
        }
        
        groupedLogs[log.tracking_id].push(log);
      });
      
      // Hitung statistik
      const stats = {
        totalLogs: logs.length,
        totalLinks: Object.keys(links).length,
        totalTrackingIds: Object.keys(groupedLogs).length,
        deviceStats: {
          Mobile: logs.filter(log => log.device === 'Mobile').length,
          Desktop: logs.filter(log => log.device === 'Desktop').length,
          Tablet: logs.filter(log => log.device === 'Tablet').length,
          Unknown: logs.filter(log => !log.device || log.device === 'Tidak diketahui').length
        },
        browserStats: {},
        osStats: {}
      };
      
      // Hitung statistik browser dan OS
      logs.forEach(log => {
        if (log.browser) {
          stats.browserStats[log.browser] = (stats.browserStats[log.browser] || 0) + 1;
        }
        
        if (log.os) {
          stats.osStats[log.os] = (stats.osStats[log.os] || 0) + 1;
        }
      });
      
      const response = {
        logs,
        links,
        groupedLogs,
        stats
      };
      
      console.log('Successfully fetched data from Supabase');
      return res.status(200).json(response);
    } catch (supabaseError) {
      console.error('Error with Supabase, falling back to demo data:', supabaseError);
      
      // Fallback ke data demo
      console.log('Returning demo data');
      return res.status(200).json(demoData);
    }
  } catch (error) {
    console.error('Error in admin API:', error);
    
    // Fallback ke data demo jika terjadi error
    console.log('Error in admin API, returning demo data');
    return res.status(200).json(demoData);
  }
};
