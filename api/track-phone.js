// API untuk melacak nomor telepon
const axios = require('axios');

// Konfigurasi API
const API_KEY = process.env.ABSTRACT_API_KEY || "1df4c01438444ee68c02339880acba31";
const API_ENDPOINT = "https://phonevalidation.abstractapi.com/v1/";

// Fungsi untuk mendapatkan data fallback jika API gagal
function getFallbackData(phone) {
  // Deteksi negara berdasarkan kode negara
  let country_code = "";
  let country_name = "";
  let carrier = "";
  let type = "mobile";
  let valid = true;
  let timezone = "Asia/Jakarta";
  
  // Deteksi kode negara dari nomor telepon
  if (phone.startsWith('+62')) {
    country_code = "ID";
    country_name = "Indonesia";
    
    // Deteksi operator berdasarkan prefix (untuk Indonesia)
    const prefix = phone.substring(3, 6);
    switch (prefix) {
      case '811':
      case '812':
      case '813':
      case '821':
      case '822':
      case '823':
      case '852':
      case '853':
        carrier = "Telkomsel";
        break;
      case '814':
      case '815':
      case '816':
      case '855':
      case '856':
      case '857':
      case '858':
        carrier = "Indosat";
        break;
      case '817':
      case '818':
      case '819':
      case '859':
      case '877':
      case '878':
        carrier = "XL Axiata";
        break;
      case '831':
      case '832':
      case '833':
      case '838':
        carrier = "Axis";
        break;
      case '895':
      case '896':
      case '897':
      case '898':
      case '899':
        carrier = "Tri";
        break;
      case '881':
      case '882':
      case '883':
      case '884':
      case '885':
      case '886':
      case '887':
      case '888':
      case '889':
        carrier = "Smartfren";
        break;
      default:
        carrier = "Operator Indonesia Lainnya";
    }
  } else if (phone.startsWith('+1')) {
    country_code = "US";
    country_name = "United States";
    carrier = "US Carrier";
    timezone = "America/New_York";
  } else if (phone.startsWith('+44')) {
    country_code = "GB";
    country_name = "United Kingdom";
    carrier = "UK Carrier";
    timezone = "Europe/London";
  } else if (phone.startsWith('+60')) {
    country_code = "MY";
    country_name = "Malaysia";
    carrier = "Malaysia Carrier";
    timezone = "Asia/Kuala_Lumpur";
  } else if (phone.startsWith('+65')) {
    country_code = "SG";
    country_name = "Singapore";
    carrier = "Singapore Carrier";
    timezone = "Asia/Singapore";
  } else {
    country_code = "UNKNOWN";
    country_name = "Unknown";
    carrier = "Unknown Carrier";
    timezone = "UTC";
  }
  
  // Buat data fallback
  return {
    phone: phone,
    valid: valid,
    type: type,
    carrier: carrier,
    country_code: country_code,
    country_name: country_name,
    timezone: timezone,
    is_fallback: true
  };
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Periksa metode request
    if (req.method !== 'POST') {
      return res.status(405).json({ error: true, message: 'Method Not Allowed' });
    }

    // Ambil nomor telepon dari body
    const { phone } = req.body;
    
    if (!phone || phone.trim() === '') {
      return res.status(400).json({ error: true, message: 'No phone number provided' });
    }

    // Bersihkan nomor telepon dari karakter yang tidak diinginkan
    let cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Pastikan nomor dimulai dengan +
    if (!cleanPhone.startsWith('+')) {
      // Jika dimulai dengan 0, ganti dengan +62 (untuk Indonesia)
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '+62' + cleanPhone.substring(1);
      } else {
        cleanPhone = '+' + cleanPhone;
      }
    }

    try {
      // Panggil API Abstract
      const apiUrl = `${API_ENDPOINT}?api_key=${API_KEY}&phone=${encodeURIComponent(cleanPhone)}`;
      const response = await axios.get(apiUrl);
      
      if (response.status === 200 && response.data) {
        // Tambahkan informasi tambahan
        const result = {
          ...response.data,
          processed_at: new Date().toISOString()
        };
        
        return res.status(200).json(result);
      } else {
        // Gunakan data fallback jika API gagal
        const fallbackData = getFallbackData(cleanPhone);
        return res.status(200).json({
          ...fallbackData,
          processed_at: new Date().toISOString()
        });
      }
    } catch (apiError) {
      // Gunakan data fallback jika API gagal
      const fallbackData = getFallbackData(cleanPhone);
      return res.status(200).json({
        ...fallbackData,
        processed_at: new Date().toISOString()
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      error: true, 
      message: error.message || 'Internal Server Error' 
    });
  }
}; 