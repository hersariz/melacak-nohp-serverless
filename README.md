# Pelacak Nomor HP - OSINT Tool

Aplikasi untuk melacak informasi nomor telepon menggunakan AbstractAPI. Aplikasi ini dibuat untuk tujuan edukasi dan keamanan.

## Fitur

- Validasi nomor telepon
- Identifikasi operator dan negara
- Menampilkan lokasi perkiraan pada peta
- Informasi OSINT dan keamanan
- Mendukung format nomor Indonesia dan internasional
- Tampilan yang responsif dan user-friendly
- **NEW!** Fitur link tracking untuk melacak informasi perangkat dan lokasi pengguna
- Deteksi lokasi berdasarkan kode negara
- Analisis keamanan dan risiko
- Informasi OSINT dan pencarian lanjutan
- Tampilan peta lokasi menggunakan OpenStreetMap
- Pembuatan link tracking untuk melacak perangkat dan lokasi target
- Admin panel untuk melihat hasil tracking dan statistik

## Cara Deploy ke Vercel

### Prasyarat

- Akun GitHub
- Akun Vercel (bisa daftar dengan GitHub)
- API key dari AbstractAPI (sudah tersedia: `1df4c01438444ee68c02339880acba31`)

### Langkah-langkah Deployment

1. **Clone repository ke GitHub**

   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/username/pelacak-nohp.git
   git push -u origin main
   ```

2. **Deploy ke Vercel**

   - Buka [Vercel Dashboard](https://vercel.com/dashboard)
   - Klik "New Project"
   - Import repository GitHub yang baru dibuat
   - Konfigurasi project:
     - Framework Preset: Other
     - Build Command: `npm run build` (default)
     - Output Directory: `public` (default)
   - Klik "Deploy"

3. **Tambahkan Environment Variables**

   Di dashboard Vercel, pilih project:
   - Buka tab "Settings" > "Environment Variables"
   - Tambahkan:
     - Name: `ABSTRACT_API_KEY`
     - Value: `1df4c01438444ee68c02339880acba31`
     - Name: `REDIRECT_URL`
     - Value: `https://www.instagram.com/accounts/login/` (URL untuk redirect setelah tracking)
     - Name: `NEXT_PUBLIC_SITE_URL`
     - Value: `https://your-domain.com` (jika menggunakan custom domain)
   - Klik "Save"
   - Re-deploy aplikasi

## Penggunaan Lokal

### Menggunakan Vercel CLI

1. Install dependencies:
   ```
   npm install
   ```

2. Jalankan server development:
   ```
   npm run dev
   ```

3. Buka browser dan akses `http://localhost:3000`

### Menggunakan XAMPP

1. Letakkan semua file di folder `htdocs/melacak_nohp`
2. Jalankan Apache server
3. Buka browser dan akses `http://localhost/melacak_nohp`

## Teknologi yang Digunakan

- HTML, CSS, JavaScript
- Bootstrap 5
- Font Awesome
- Leaflet.js untuk peta
- jQuery
- Vercel Serverless Functions
- AbstractAPI untuk validasi nomor telepon

## Catatan Keamanan

Aplikasi ini dibuat untuk tujuan edukasi dan keamanan. Gunakan dengan bijak dan bertanggung jawab. Informasi yang ditampilkan hanya perkiraan berdasarkan data operator dan mungkin tidak menunjukkan lokasi fisik sebenarnya dari pengguna nomor tersebut.

## Cara Penggunaan

### Persyaratan

- XAMPP atau server PHP lainnya
- API key dari [AbstractAPI](https://www.abstractapi.com/api/phone-validation-api) (gratis)

### Langkah Instalasi

1. Clone atau download repository ini ke folder htdocs XAMPP Anda
   ```
   git clone https://github.com/username/melacak_nohp.git
   ```
   atau ekstrak file zip ke folder `C:\xampp\htdocs\melacak_nohp`

2. Buka file `track_phone.php` dan ganti `YOUR_ABSTRACTAPI_KEY` dengan API key Anda dari AbstractAPI
   ```php
   $api_key = "YOUR_ABSTRACTAPI_KEY"; // Ganti dengan API key Anda
   ```

3. Jalankan XAMPP dan aktifkan Apache

4. Buka browser dan akses `http://localhost/melacak_nohp/`

### Cara Menggunakan

1. Melacak Nomor HP:
   - Masukkan nomor telepon yang ingin dilacak (format: 08123456789 atau +628123456789)
   - Klik tombol "Lacak"
   - Lihat informasi detail tentang nomor tersebut

2. Melacak Perangkat dan Lokasi via Link:
   - Klik tombol "Buat Link Tracking" di halaman utama
   - Buat link tracking baru (opsional: tentukan ID tracking dan kode kustom)
   - Salin link pendek yang dihasilkan
   - Kirim link tersebut ke target melalui WhatsApp, SMS, atau media sosial
   - Ketika target mengklik link, informasi perangkat dan lokasi mereka akan dicatat
   - Lihat hasil tracking di Admin Panel

## Fitur Link Tracking

Fitur baru ini memungkinkan Anda untuk:

1. Membuat link khusus yang dapat melacak informasi perangkat dan lokasi pengguna yang mengklik link tersebut
2. Mendapatkan informasi seperti:
   - IP address
   - Jenis perangkat (mobile, tablet, desktop)
   - Browser dan sistem operasi
   - Lokasi geografis (jika diizinkan oleh pengguna)
   - User agent dan informasi teknis lainnya
3. Melihat semua data yang dikumpulkan di Admin Panel
4. Membuat link pendek yang lebih mudah dibagikan

## Versi Aplikasi

Ada dua versi aplikasi yang tersedia:

1. **index.php** - Versi lengkap dengan fitur dan tampilan yang lebih baik
2. **index_simple.php** - Versi sederhana dengan fungsi dasar (untuk troubleshooting)

## Troubleshooting

Jika Anda mengalami masalah:

1. **Error 500**: Periksa apakah API key sudah benar dan PHP cURL sudah diaktifkan di XAMPP
2. **Peta tidak muncul**: Aplikasi menggunakan OpenStreetMap yang tidak memerlukan API key. Jika peta tidak muncul, aplikasi akan menampilkan informasi lokasi dalam bentuk teks
3. **API tidak berfungsi**: Aplikasi memiliki fitur fallback yang akan memberikan informasi dasar bahkan jika API tidak berfungsi
4. **Link tracking tidak berfungsi**: Pastikan pengguna mengizinkan akses lokasi di browser mereka

## Penggunaan Link Tracking

Fitur link tracking memungkinkan Anda untuk melacak informasi perangkat dan lokasi target ketika mereka mengklik link yang Anda bagikan:

1. Buka halaman "Buat Link Tracking" melalui tombol di halaman utama
2. Isi form untuk membuat link tracking (ID dan kode kustom opsional)
3. Salin link pendek yang dihasilkan
4. Bagikan link tersebut ke target melalui WhatsApp, SMS, email, atau media sosial
5. Ketika target mengklik link, informasi perangkat dan lokasi mereka akan dicatat
6. Data tracking disimpan di file `tracker_logs.txt` di server Vercel

**Catatan Penting:** Link tracking akan berfungsi dengan baik di Vercel dan dapat diakses dari perangkat manapun. URL yang dihasilkan akan menggunakan domain Vercel (contoh: `your-app.vercel.app`) bukan localhost.

## Admin Panel

Aplikasi ini dilengkapi dengan admin panel untuk melihat hasil tracking dan statistik:

1. Buka halaman "Admin Panel" melalui tombol di halaman utama
2. Login dengan kredensial default:
   - Username: `admin`
   - Password: `admin123`
3. Di admin panel Anda dapat melihat:
   - Dashboard dengan statistik tracking
   - Data tracking lengkap dengan filter pencarian
   - Daftar link pendek yang telah dibuat

**Catatan Keamanan:** Untuk penggunaan di lingkungan produksi, disarankan untuk mengubah kredensial admin di file `api/admin/get-tracking-data.js`.

## Lisensi

Aplikasi ini bersifat open source dan tersedia untuk digunakan secara gratis.

## Migrasi dari PHP ke Serverless

Aplikasi ini telah berhasil dimigrasi dari PHP/XAMPP ke arsitektur serverless di Vercel:

1. **Backend**: Semua endpoint PHP telah dikonversi menjadi serverless functions Node.js di direktori `api/`
2. **Frontend**: Halaman HTML/CSS/JS tetap dipertahankan dengan penyesuaian untuk bekerja dengan serverless API
3. **Database**: Data disimpan dalam file JSON dan teks di Vercel (tidak memerlukan database terpisah)

Keuntungan dari migrasi ini:
- Dapat di-deploy secara global dengan Vercel
- Tidak memerlukan server PHP atau database
- Skalabilitas otomatis
- Biaya lebih rendah (pay-per-execution)

File PHP lama masih disimpan di repositori untuk referensi, tetapi tidak digunakan dalam deployment. 