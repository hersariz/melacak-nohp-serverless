/**
 * API untuk admin dashboard v2
 * Menangani berbagai aksi admin
 */

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Get action from query parameter
    const action = req.query.action || '';
    
    console.log('[v2/admin] Processing action:', action);
    
    // Handle different actions
    switch (action) {
      case 'info':
        // Return environment info
        return res.status(200).json({
          success: true,
          info: {
            environment: process.env.NODE_ENV || 'development',
            vercel: {
              region: process.env.VERCEL_REGION || 'unknown',
              url: process.env.VERCEL_URL || 'unknown'
            },
            supabase: {
              url: process.env.SUPABASE_URL || 'https://tgoonwkaafjkwvntdxnv.supabase.co',
              anon_key_set: !!process.env.SUPABASE_ANON_KEY,
              service_role_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY
            }
          }
        });
      
      case 'test':
        // Test endpoint
        return res.status(200).json({
          success: true,
          message: 'API is working',
          timestamp: new Date().toISOString()
        });
      
      case 'setup-db':
        // Setup database tables
        try {
          const { createClient } = require('@supabase/supabase-js');
          
          // Buat koneksi Supabase langsung di sini
          const supabaseUrl = process.env.SUPABASE_URL || 'https://tgoonwkaafjkwvntdxnv.supabase.co';
          const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb29ud2thYWZqa3d2bnRkeG52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0NzI4NCwiZXhwIjoyMDY1NTIzMjg0fQ.ddn8IOLEBZ_Iypb4xAPqc02ZGMBmw9SiswGJazjjBCY';
          
          const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          });
          
          // Create links table
          try {
            await supabase.rpc('exec_sql', {
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
                  expiry_date TIMESTAMP WITH TIME ZONE NULL,
                  last_click TIMESTAMP WITH TIME ZONE NULL
                );
              `
            });
            console.log('[v2/admin] Links table created or already exists');
          } catch (tableError) {
            console.log('[v2/admin] Links table creation error:', tableError.message);
          }
          
          // Create logs table
          try {
            await supabase.rpc('exec_sql', {
              sql: `
                CREATE TABLE IF NOT EXISTS public.logs (
                  id SERIAL PRIMARY KEY,
                  tracking_id VARCHAR(255) NOT NULL,
                  ip VARCHAR(255),
                  device VARCHAR(50),
                  browser VARCHAR(50),
                  os VARCHAR(50),
                  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  user_agent TEXT,
                  language VARCHAR(50),
                  referrer TEXT
                );
              `
            });
            console.log('[v2/admin] Logs table created or already exists');
          } catch (tableError) {
            console.log('[v2/admin] Logs table creation error:', tableError.message);
          }
          
          return res.status(200).json({
            success: true,
            message: 'Database setup completed',
            tables: ['links', 'logs']
          });
        } catch (dbError) {
          console.error('[v2/admin] Database setup error:', dbError);
          return res.status(200).json({
            success: false,
            error: 'Database Setup Error',
            message: dbError.message
          });
        }
      
      case 'get-tracking-data':
        // Get real tracking data from Supabase
        console.log('[v2/admin] Fetching tracking data from Supabase');
        
        try {
          const { createClient } = require('@supabase/supabase-js');
          
          // Buat koneksi Supabase langsung di sini
          const supabaseUrl = process.env.SUPABASE_URL || 'https://tgoonwkaafjkwvntdxnv.supabase.co';
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb29ud2thYWZqa3d2bnRkeG52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0NzI4NCwiZXhwIjoyMDY1NTIzMjg0fQ.ddn8IOLEBZ_Iypb4xAPqc02ZGMBmw9SiswGJazjjBCY';
          
          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          });
          
          // Coba ambil data dari tabel links dan logs
          const [linksResult, logsResult] = await Promise.all([
            supabase.from('links').select('*'),
            supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(100)
          ]);
          
          // Check for errors
          if (linksResult.error) {
            console.error('[v2/admin] Error fetching links:', linksResult.error);
            throw new Error(`Links fetch error: ${linksResult.error.message}`);
          }
          
          if (logsResult.error) {
            console.error('[v2/admin] Error fetching logs:', logsResult.error);
            throw new Error(`Logs fetch error: ${logsResult.error.message}`);
          }
          
          // Format data untuk dashboard
          const links = {};
          const logs = logsResult.data || [];
          const linksData = linksResult.data || [];
          
          // Format links data
          linksData.forEach(link => {
            links[link.tracking_id] = {
              tracking_id: link.tracking_id,
              target_url: link.target_url,
              created_at: link.created_at,
              clicks: link.clicks || 0,
              last_click: link.last_click || null,
              custom_code: link.custom_code || null,
              is_active: link.is_active !== false,
              notes: link.notes || null,
              expiry_date: link.expiry_date || null
            };
          });
          
          // Calculate stats
          const deviceStats = {
            Mobile: 0,
            Desktop: 0,
            Tablet: 0,
            Unknown: 0
          };
          
          const browserStats = {};
          const osStats = {};
          const dateStats = {};
          const groupedLogs = {};
          
          logs.forEach(log => {
            // Count device types
            const device = log.device || 'Unknown';
            deviceStats[device] = (deviceStats[device] || 0) + 1;
            
            // Count browsers
            const browser = log.browser || 'Unknown';
            browserStats[browser] = (browserStats[browser] || 0) + 1;
            
            // Count OS
            const os = log.os || 'Unknown';
            osStats[os] = (osStats[os] || 0) + 1;
            
            // Group by date
            const date = log.timestamp ? new Date(log.timestamp).toISOString().split('T')[0] : 'Unknown';
            dateStats[date] = (dateStats[date] || 0) + 1;
            
            // Group logs by tracking_id
            if (log.tracking_id) {
              if (!groupedLogs[log.tracking_id]) {
                groupedLogs[log.tracking_id] = [];
              }
              groupedLogs[log.tracking_id].push(log);
            }
          });
          
          // Prepare response
          const trackingData = {
            success: true,
            stats: {
              totalLogs: logs.length,
              totalLinks: linksData.length,
              totalTrackingIds: Object.keys(groupedLogs).length,
              deviceStats,
              browserStats,
              osStats,
              dateStats
            },
            logs,
            links,
            groupedLogs,
            pagination: {
              limit: 100,
              offset: 0,
              total: logs.length
            }
          };
          
          return res.status(200).json(trackingData);
        } catch (error) {
          console.error('[v2/admin] Error getting tracking data:', error);
          
          // Return demo data if there's an error
          console.log('[v2/admin] Returning demo tracking data due to error');
          
          // Demo data untuk dashboard
          const demoData = {
            success: false,
            error: error.message,
            message: 'Menggunakan data demo karena terjadi error',
            stats: {
              totalLogs: 5,
              totalLinks: 3,
              totalTrackingIds: 3,
              deviceStats: {
                Mobile: 3,
                Desktop: 1,
                Tablet: 1,
                Unknown: 0
              },
              browserStats: {
                Chrome: 2,
                Firefox: 1,
                Safari: 1,
                "Mobile Chrome": 1
              },
              osStats: {
                Android: 2,
                Windows: 1,
                iOS: 1,
                MacOS: 1
              },
              dateStats: {
                "2023-06-15": 3,
                "2023-06-14": 2
              }
            },
            logs: [
              {
                id: 1,
                timestamp: new Date().toISOString(),
                tracking_id: "demo123",
                ip: "192.168.1.1",
                device: "Mobile",
                browser: "Chrome",
                os: "Android",
                country: "Indonesia",
                city: "Jakarta",
                isp: "Telkomsel"
              },
              {
                id: 2,
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                tracking_id: "demo123",
                ip: "192.168.1.2",
                device: "Desktop",
                browser: "Firefox",
                os: "Windows",
                country: "Indonesia",
                city: "Bandung",
                isp: "Indihome"
              },
              {
                id: 3,
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                tracking_id: "demo456",
                ip: "192.168.1.3",
                device: "Tablet",
                browser: "Safari",
                os: "iOS",
                country: "Indonesia",
                city: "Surabaya",
                isp: "XL Axiata"
              },
              {
                id: 4,
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                tracking_id: "demo789",
                ip: "192.168.1.4",
                device: "Mobile",
                browser: "Mobile Chrome",
                os: "Android",
                country: "Indonesia",
                city: "Medan",
                isp: "Smartfren"
              },
              {
                id: 5,
                timestamp: new Date(Date.now() - 172800000).toISOString(),
                tracking_id: "demo123",
                ip: "192.168.1.5",
                device: "Desktop",
                browser: "Chrome",
                os: "MacOS",
                country: "Indonesia",
                city: "Denpasar",
                isp: "Biznet"
              }
            ],
            links: {
              "demo123": {
                tracking_id: "demo123",
                target_url: "https://example.com/page1",
                created_at: new Date(Date.now() - 86400000).toISOString(),
                clicks: 10,
                last_click: new Date().toISOString(),
                custom_code: "promo2023",
                is_active: true,
                notes: "Kampanye promosi Juni",
                expiry_date: new Date(Date.now() + 604800000).toISOString()
              },
              "demo456": {
                tracking_id: "demo456",
                target_url: "https://example.com/page2",
                created_at: new Date(Date.now() - 172800000).toISOString(),
                clicks: 5,
                last_click: new Date(Date.now() - 3600000).toISOString(),
                custom_code: null,
                is_active: true,
                notes: null,
                expiry_date: null
              },
              "demo789": {
                tracking_id: "demo789",
                target_url: "https://example.com/page3",
                created_at: new Date(Date.now() - 259200000).toISOString(),
                clicks: 3,
                last_click: new Date(Date.now() - 86400000).toISOString(),
                custom_code: "test123",
                is_active: false,
                notes: "Link uji coba",
                expiry_date: new Date(Date.now() - 86400000).toISOString()
              }
            },
            groupedLogs: {
              "demo123": [
                {
                  id: 1,
                  timestamp: new Date().toISOString(),
                  tracking_id: "demo123",
                  ip: "192.168.1.1",
                  device: "Mobile",
                  browser: "Chrome",
                  os: "Android"
                },
                {
                  id: 2,
                  timestamp: new Date(Date.now() - 3600000).toISOString(),
                  tracking_id: "demo123",
                  ip: "192.168.1.2",
                  device: "Desktop",
                  browser: "Firefox",
                  os: "Windows"
                },
                {
                  id: 5,
                  timestamp: new Date(Date.now() - 172800000).toISOString(),
                  tracking_id: "demo123",
                  ip: "192.168.1.5",
                  device: "Desktop",
                  browser: "Chrome",
                  os: "MacOS"
                }
              ],
              "demo456": [
                {
                  id: 3,
                  timestamp: new Date(Date.now() - 7200000).toISOString(),
                  tracking_id: "demo456",
                  ip: "192.168.1.3",
                  device: "Tablet",
                  browser: "Safari",
                  os: "iOS"
                }
              ],
              "demo789": [
                {
                  id: 4,
                  timestamp: new Date(Date.now() - 86400000).toISOString(),
                  tracking_id: "demo789",
                  ip: "192.168.1.4",
                  device: "Mobile",
                  browser: "Mobile Chrome",
                  os: "Android"
                }
              ]
            },
            pagination: {
              limit: 100,
              offset: 0,
              total: 5
            }
          };
          
          return res.status(200).json(demoData);
        }
      
      default:
        // Unknown action
        return res.status(200).json({
          success: false,
          error: 'Invalid Action',
          message: `Action '${action}' is not supported`,
          available_actions: ['info', 'test', 'setup-db', 'get-tracking-data']
        });
    }
  } catch (error) {
    console.error('[v2/admin] Error:', error);
    
    // Return error response
    return res.status(200).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}; 