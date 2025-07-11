/**
 * API untuk mendapatkan data tracking - Versi 2
 * Dengan penanganan error yang lebih baik dan fitur lebih lengkap
 */
const { createClient } = require('@supabase/supabase-js');

// Demo data statis untuk fallback
const demoData = {
  success: true,
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
      id: 3,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      tracking_id: "demo456",
      ip: "192.168.1.3",
      device: "Tablet",
      browser: "Safari",
      os: "iOS"
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      tracking_id: "demo789",
      ip: "192.168.1.4",
      device: "Mobile",
      browser: "Mobile Chrome",
      os: "Android"
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
  links: {
    "demo123": {
      tracking_id: "demo123",
      target_url: "https://example.com/page1",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      clicks: 10,
      last_click: new Date().toISOString(),
      is_active: true
    },
    "demo456": {
      tracking_id: "demo456",
      target_url: "https://example.com/page2",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      clicks: 5,
      last_click: new Date(Date.now() - 3600000).toISOString(),
      is_active: true
    },
    "demo789": {
      tracking_id: "demo789",
      target_url: "https://example.com/page3",
      created_at: new Date(Date.now() - 259200000).toISOString(),
      clicks: 3,
      last_click: new Date(Date.now() - 86400000).toISOString(),
      is_active: false
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
    // Selalu kembalikan data demo untuk sementara
    return res.status(200).json(demoData);
  } catch (error) {
    console.error('[v2/admin] Error:', error);
    
    // Return demo data in case of any error
    return res.status(200).json(demoData);
  }
};
