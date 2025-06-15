$(document).ready(function() {
    // Koordinat default untuk beberapa negara
    const defaultCoords = {
        indonesia: {
            lat: -6.2088,
            lng: 106.8456,
            name: "Jakarta, Indonesia"
        },
        us: {
            lat: 38.8951,
            lng: -77.0364,
            name: "Washington DC, USA"
        },
        uk: {
            lat: 51.5074,
            lng: -0.1278,
            name: "London, UK"
        },
        malaysia: {
            lat: 3.1390,
            lng: 101.6869,
            name: "Kuala Lumpur, Malaysia"
        },
        singapore: {
            lat: 1.3521,
            lng: 103.8198,
            name: "Singapore"
        },
        unknown: {
            lat: 0,
            lng: 0,
            name: "Lokasi Tidak Diketahui"
        }
    };
    
    let map = null;
    
    // Format nomor telepon
    function formatPhoneNumber(phone) {
        // Hapus semua karakter non-numerik kecuali +
        let formatted = phone.replace(/[^\d+]/g, '');
        
        // Jika nomor dimulai dengan 0, ganti dengan +62
        if (formatted.startsWith('0')) {
            formatted = '+62' + formatted.substring(1);
        }
        
        // Jika nomor tidak dimulai dengan +, tambahkan +
        if (!formatted.startsWith('+')) {
            formatted = '+' + formatted;
        }
        
        return formatted;
    }
    
    // Menampilkan peta dan informasi lokasi
    function showMap(data) {
        // Tentukan koordinat berdasarkan negara
        let coords;
        let locationName;
        
        if (data.country_code === 'ID') {
            coords = defaultCoords.indonesia;
            locationName = data.carrier ? `${data.carrier}, Indonesia` : "Indonesia";
        } else if (data.country_code === 'US') {
            coords = defaultCoords.us;
            locationName = data.carrier ? `${data.carrier}, USA` : "USA";
        } else if (data.country_code === 'GB') {
            coords = defaultCoords.uk;
            locationName = data.carrier ? `${data.carrier}, UK` : "UK";
        } else if (data.country_code === 'MY') {
            coords = defaultCoords.malaysia;
            locationName = data.carrier ? `${data.carrier}, Malaysia` : "Malaysia";
        } else if (data.country_code === 'SG') {
            coords = defaultCoords.singapore;
            locationName = data.carrier ? `${data.carrier}, Singapore` : "Singapore";
        } else {
            // Gunakan koordinat default jika tidak ada koordinat spesifik
            coords = defaultCoords.unknown;
            locationName = data.country_name || "Lokasi Tidak Diketahui";
        }
        
        // Inisialisasi peta jika belum ada
        if (map === null) {
            map = L.map('map').setView([coords.lat, coords.lng], 10);
            
            // Tambahkan layer OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
        } else {
            // Jika peta sudah ada, perbarui view
            map.setView([coords.lat, coords.lng], 10);
            // Hapus marker lama jika ada
            map.eachLayer(function(layer) {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });
        }
        
        // Tambahkan marker
        L.marker([coords.lat, coords.lng]).addTo(map)
            .bindPopup(locationName)
            .openPopup();
            
        // Perbarui ukuran peta
        setTimeout(function() {
            map.invalidateSize();
        }, 100);
    }
    
    // Menampilkan hasil pelacakan
    function showTrackingResult(data) {
        // Informasi dasar
        const basicInfo = $('#basicInfo');
        basicInfo.empty();
        
        basicInfo.append(`<li class="list-group-item">Nomor: <strong>${data.phone}</strong></li>`);
        basicInfo.append(`<li class="list-group-item">Format Lokal: <strong>${data.local_format || 'Tidak tersedia'}</strong></li>`);
        basicInfo.append(`<li class="list-group-item">Format Internasional: <strong>${data.international_format || data.phone}</strong></li>`);
        basicInfo.append(`<li class="list-group-item">Valid: <strong>${data.valid ? '<span class="text-success">Ya</span>' : '<span class="text-danger">Tidak</span>'}</strong></li>`);
        basicInfo.append(`<li class="list-group-item">Tipe: <strong>${data.type || 'Tidak diketahui'}</strong></li>`);
        basicInfo.append(`<li class="list-group-item">Operator: <strong>${data.carrier || 'Tidak diketahui'}</strong></li>`);
        
        // Informasi lokasi
        const locationInfo = $('#locationInfo');
        locationInfo.empty();
        
        locationInfo.append(`<li class="list-group-item">Negara: <strong>${data.country_name || 'Tidak diketahui'}</strong></li>`);
        locationInfo.append(`<li class="list-group-item">Kode Negara: <strong>${data.country_code || 'Tidak diketahui'}</strong></li>`);
        locationInfo.append(`<li class="list-group-item">Zona Waktu: <strong>${data.timezone || 'Tidak diketahui'}</strong></li>`);
        
        // Tambahkan link ke Google Maps
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${data.country_name || 'Unknown'}`;
        locationInfo.append(`<li class="list-group-item">Link: <a href="${googleMapsUrl}" target="_blank">Lihat di Google Maps</a></li>`);
        
        // Tambahkan link ke OpenStreetMap
        const osmUrl = `https://www.openstreetmap.org/search?query=${data.country_name || 'Unknown'}`;
        locationInfo.append(`<li class="list-group-item">Link: <a href="${osmUrl}" target="_blank">Lihat di OpenStreetMap</a></li>`);
        
        // Analisis keamanan
        const securityInfo = $('#securityInfo');
        securityInfo.empty();
        
        // Tentukan tingkat risiko berdasarkan validitas dan tipe
        let riskLevel = 'Rendah';
        let riskClass = 'risk-low';
        
        if (!data.valid) {
            riskLevel = 'Tinggi';
            riskClass = 'risk-high';
        } else if (data.type === 'voip' || data.type === 'toll_free') {
            riskLevel = 'Sedang';
            riskClass = 'risk-medium';
        }
        
        securityInfo.append(`<li class="list-group-item">Tingkat Risiko: <strong class="${riskClass}">${riskLevel}</strong></li>`);
        securityInfo.append(`<li class="list-group-item">Validitas: <strong>${data.valid ? 'Nomor valid' : 'Nomor tidak valid atau mencurigakan'}</strong></li>`);
        
        if (data.is_fallback) {
            securityInfo.append(`<li class="list-group-item"><i class="fas fa-exclamation-triangle text-warning"></i> <strong>Catatan:</strong> Data ini dihasilkan dari analisis lokal, bukan dari API.</li>`);
        }
        
        // Informasi OSINT
        const osintInfo = $('#osintInfo');
        osintInfo.empty();
        
        osintInfo.append(`<li class="list-group-item">Kemungkinan Sumber: <strong>Direktori publik, media sosial, atau kebocoran data</strong></li>`);
        osintInfo.append(`<li class="list-group-item">Pencarian Lebih Lanjut: <a href="https://www.google.com/search?q=${encodeURIComponent(data.phone)}" target="_blank">Google</a> | <a href="https://www.truecaller.com/search/${data.country_code || 'us'}/${data.phone.replace('+', '')}" target="_blank">Truecaller</a></li>`);
        
        if (data.carrier) {
            osintInfo.append(`<li class="list-group-item">Operator: <strong>${data.carrier}</strong> - <a href="https://www.google.com/search?q=${encodeURIComponent(data.carrier + ' contact')}" target="_blank">Info Kontak</a></li>`);
        }
        
        // Tampilkan peta
        showMap(data);
        
        // Tampilkan hasil
        $('.result-card').fadeIn();
    }
    
    // Handle form submission
    $('#phoneForm').submit(function(e) {
        e.preventDefault();
        
        const phoneNumber = $('#phoneNumber').val().trim();
        
        if (phoneNumber === '') {
            alert('Silakan masukkan nomor telepon');
            return;
        }
        
        // Format nomor telepon
        const formattedPhone = formatPhoneNumber(phoneNumber);
        
        // Tampilkan loader
        $('.loader').show();
        $('.result-card').hide();
        
        // Kirim permintaan ke API
        $.ajax({
            url: '/api/track-phone',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ phone: formattedPhone }),
            success: function(response) {
                $('.loader').hide();
                showTrackingResult(response);
            },
            error: function(xhr, status, error) {
                $('.loader').hide();
                alert('Terjadi kesalahan: ' + (xhr.responseJSON?.message || error));
            }
        });
    });
}); 