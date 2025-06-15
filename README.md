# Link Tracker - Aplikasi Pelacak Nomor HP

Aplikasi sederhana untuk melacak informasi perangkat dan lokasi target melalui link tracking. Aplikasi ini dibangun dengan Node.js dan dapat di-deploy ke platform serverless seperti Vercel.

## Fitur

- Pembuatan link tracking dengan ID kustom
- Pelacakan informasi perangkat (tipe device, browser, sistem operasi)
- Pelacakan alamat IP
- Dashboard admin untuk melihat hasil tracking
- Statistik kunjungan
- Redirect otomatis ke URL yang ditentukan

## Demo

Aplikasi demo dapat diakses di: [https://melacak-nohp-serverless.vercel.app](https://melacak-nohp-serverless.vercel.app)

## Cara Penggunaan

### Membuat Link Tracking

1. Buka halaman [Create Link](https://melacak-nohp-serverless.vercel.app/create-link)
2. Masukkan ID tracking (opsional, akan dibuat otomatis jika kosong)
3. Klik "Buat Link Tracking"
4. Salin link pendek yang dihasilkan
5. Kirimkan link tersebut ke target melalui WhatsApp, SMS, atau media sosial lainnya

### Melihat Hasil Tracking

1. Buka halaman [Admin](https://melacak-nohp-serverless.vercel.app/admin-new)
2. Login dengan username `admin` dan password `admin123`
3. Lihat hasil tracking di dashboard

## Struktur Proyek

```
├── api/
│   ├── admin/
│   │   └── get-tracking-data.js    # API untuk mendapatkan data tracking
│   ├── t/
│   │   └── [id].js                 # API untuk redirect dari URL pendek ke tracker
│   ├── create-link.js              # API untuk membuat link tracking
│   └── tracker.js                  # API untuk tracking
├── public/
│   ├── admin.html                  # Halaman admin
│   ├── admin-new.html              # Halaman admin baru (client-side)
│   ├── create-link.html            # Halaman pembuatan link
│   └── index.html                  # Halaman utama
├── utils/
│   └── supabase.js                 # Utilitas untuk koneksi ke Supabase
├── .env                            # File konfigurasi environment
├── package.json                    # Dependensi npm
└── vercel.json                     # Konfigurasi Vercel
```

## Teknologi yang Digunakan

- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Backend**: Node.js, Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Setup Lokal

### Prasyarat

- Node.js dan npm
- XAMPP/Apache (untuk pengembangan lokal)
- Akun Supabase (untuk database)

### Langkah-langkah

1. Clone repositori
   ```bash
   git clone https://github.com/hersariz/melacak-nohp-serverless.git
   cd melacak-nohp-serverless
   ```

2. Install dependensi
   ```bash
   npm install
   ```

3. Buat file `.env` dengan konfigurasi berikut:
   ```
   # API keys
   ABSTRACT_API_KEY=your_abstract_api_key

   # Environment
   NODE_ENV=development

   # Redirect URL for tracker
   REDIRECT_URL=https://www.instagram.com/accounts/login/

   # Site URL
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. Jalankan aplikasi
   ```bash
   npm run dev
   ```

5. Buka `http://localhost:3000` di browser

## Setup Database (Supabase)

1. Buat akun di [Supabase](https://supabase.com/)
2. Buat project baru
3. Buat tabel berikut:

### Tabel `logs`
```sql
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  tracking_id TEXT NOT NULL,
  ip TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabel `links`
```sql
CREATE TABLE links (
  id SERIAL PRIMARY KEY,
  tracking_id TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  custom_code TEXT,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_click TIMESTAMPTZ
);
```

## Deployment ke Vercel

1. Fork repositori ini
2. Buat akun di [Vercel](https://vercel.com/)
3. Import repositori yang telah di-fork
4. Tambahkan environment variables berikut:
   - `ABSTRACT_API_KEY`
   - `REDIRECT_URL`
   - `NEXT_PUBLIC_SITE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy

## Keamanan

Aplikasi ini menggunakan autentikasi sederhana untuk admin panel. Untuk lingkungan produksi, disarankan untuk mengimplementasikan metode autentikasi yang lebih aman.

## Catatan Penting

Aplikasi ini dibuat untuk tujuan edukasi. Penggunaan aplikasi ini untuk melacak seseorang tanpa izin dapat melanggar privasi dan hukum yang berlaku.

## Lisensi

[MIT License](LICENSE)

## Kontak

Untuk pertanyaan atau bantuan, silakan hubungi [hersariz@example.com](mailto:hersariz@example.com). 