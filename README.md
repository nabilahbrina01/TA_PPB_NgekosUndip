# NgekosUndip

**Aplikasi Informasi Kos dan Kontrakan untuk Mahasiswa Universitas Diponegoro**

Tugas Akhir Praktikum Pemrograman Perangkat Bergerak (PPB) 2026

| | |
|---|---|
| Nama | Nabilah Brina Assyifa |
| NIM | 21120123120025 |
| Program Studi | Teknik Komputer, Universitas Diponegoro |

**Buka aplikasi (PWA):** `https://ta-ppb-ngekos-undip-app.vercel.app/` — buka di Chrome HP, lalu pilih **Tambahkan ke layar utama** / **Instal aplikasi**.

NgekosUndip membantu mahasiswa Undip mencari kos dan kontrakan di sekitar kampus (Tembalang, Sumurboto, Meteseh, Jatimulyo, Banyumanik). Pengguna bisa melihat daftar dan detail kos/kontrakan, mencari dan memfilter, menyimpan favorit, serta login dengan akun sendiri.

## Arsitektur

```
Aplikasi PWA (React)  --HTTP-->  REST API buatan sendiri (Express.js, Vercel)  -->  Database PostgreSQL (Supabase)
```

Aplikasi PWA **hanya** memanggil API buatan sendiri di `https://ta-ppb-ngekos-undip-api.vercel.app/api`. Aplikasi tidak mengakses Supabase secara langsung. Seluruh baca/tulis database dilakukan oleh backend Express.

## Struktur Folder

```
TA_PPB_NgekosUndip/
├── api/                    # Backend: Express.js + Supabase (deploy di Vercel)
│   ├── database/setup.sql  # seluruh tabel, data contoh, dan bucket foto
│   ├── src/
│   │   ├── config/         # koneksi Supabase
│   │   ├── models/         # query ke database
│   │   ├── controllers/    # logika tiap endpoint
│   │   ├── routes/         # definisi endpoint
│   │   ├── middleware/     # verifikasi token JWT, role pemilik, upload foto
│   │   └── index.js        # entry point server
│   ├── .env.example
│   └── vercel.json
└── web/                    # Frontend: PWA (React + Vite, deploy di Vercel)
    ├── public/             # ikon aplikasi (PWA)
    ├── src/
    │   ├── config/api.js   # axios instance (base URL, token, penanganan error)
    │   ├── services/       # authService, kosService, kontrakanService, areaService, favoriteService
    │   ├── hooks/          # custom hooks (useAsync, useKosList, useKontrakanList, ...)
    │   ├── context/        # sesi login, favorit, pesan toast
    │   ├── components/     # komponen UI & bottom navigation
    │   ├── pages/          # halaman-halaman aplikasi
    │   ├── utils/          # format Rupiah, jarak, link WhatsApp/Maps
    │   ├── App.jsx         # daftar route (halaman)
    │   └── styles.css      # tema navy + emas
    ├── vite.config.js      # konfigurasi Vite + PWA (manifest, service worker)
    └── vercel.json
```

## Fitur dan Halaman

- **Login & Daftar**: autentikasi akun (password di-hash bcrypt, token JWT)
- **Verifikasi OTP email**: akun baru harus memasukkan kode 6 digit yang dikirim ke email
- **Lupa password**: reset password dengan kode OTP dari email
- **Beranda**: sapaan, pencarian cepat, pilihan area, rekomendasi kos
- **List Kos → Detail Kos**: cari, filter area & tipe (putra/putri/campur)
- **List Kontrakan → Detail Kontrakan**: cari, filter area & ketersediaan
- **Role akun**: saat daftar pilih **Pencari kos** (melihat & menyimpan favorit) atau **Pemilik kos** (memasang iklan)
- **Galeri foto**: pemilik mengunggah hingga 5 foto langsung dari HP (diperkecil otomatis, disimpan di Supabase Storage lewat API); foto pertama jadi sampul, di detail bisa digeser
- **Peta & jarak otomatis**: pemilik menandai titik properti di peta (OpenStreetMap), jarak ke Undip Tembalang dihitung otomatis di API; pencari bisa melihat tampilan peta, jarak "dari kamu", dan urutan *Dekat saya*
- **Filter harga & fasilitas** di halaman list
- **Mode offline**: data dan foto yang pernah dibuka tetap tampil tanpa internet (service worker + cache), dengan banner offline
- **Pasang iklan bertahap**: form 5 langkah (foto & nama, lokasi, harga & kamar, fasilitas, kontak & tinjau) dan halaman **Iklan Saya**
- **Kelola iklan (CRUD)**: pemilik kos bisa menambah iklan, serta mengubah dan menghapus iklan miliknya sendiri; filter "Iklan saya"
- **Urutkan**: harga termurah, termahal, atau jarak terdekat (diproses di API)
- **Hubungi pemilik via WhatsApp** dan **buka lokasi di Google Maps** dari halaman detail
- **Favorit**: tersimpan di database per akun, jadi tetap ada walau ganti HP
- **Profil**: data pengguna, info pembuat aplikasi, logout

Navigasi utama menggunakan **Bottom Navigation Bar** (Beranda, Kos, Kontrakan, Favorit, Profil).

## Endpoint API

Base URL: `https://ta-ppb-ngekos-undip-api.vercel.app/api`

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/auth/register` | Daftar akun (`name`, `email`, `phone`, `password`, `role`: pencari/pemilik), kode OTP dikirim ke email. Password minimal 8 karakter, berisi huruf dan angka |
| POST | `/auth/login` | Login (`email`, `password`), mengembalikan token |
| POST | `/auth/verify-otp` | Verifikasi akun (`email`, `code`), mengembalikan token |
| POST | `/auth/resend-otp` | Kirim ulang kode (`email`, `purpose`: register/reset) |
| POST | `/auth/forgot-password` | Kirim kode OTP reset password (`email`) |
| POST | `/auth/reset-password` | Ganti password (`email`, `code`, `password`) |
| GET | `/auth/me` | Data user yang login (header `Authorization: Bearer <token>`) |
| GET | `/areas` | Semua area |
| GET | `/areas/:id` | Detail area |
| POST / PUT / DELETE | `/areas`, `/areas/:id` | Tambah / ubah / hapus area (khusus pemilik) |
| GET | `/kos` | Semua kos. Query opsional: `search`, `area_id`, `type`, `owner_id`, `sort` (`termurah`/`termahal`/`terdekat`) |
| GET | `/kos/:id` | Detail kos |
| POST / PUT / DELETE | `/kos`, `/kos/:id` | Tambah kos (khusus pemilik); ubah / hapus hanya iklan milik sendiri |
| GET | `/kontrakan` | Semua kontrakan. Query opsional: `search`, `area_id`, `available`, `sort` |
| GET | `/kontrakan/:id` | Detail kontrakan |
| POST / PUT / DELETE | `/kontrakan`, `/kontrakan/:id` | Tambah kontrakan (khusus pemilik); ubah / hapus hanya iklan milik sendiri |
| POST | `/upload` | Upload foto (form-data, field `image`, maks 4 MB), khusus pemilik, mengembalikan `url` |
| GET | `/favorites` | Favorit milik user yang login (wajib token) |
| POST | `/favorites` | Tambah favorit (`item_type`: kos/kontrakan, `item_id`), wajib token |
| DELETE | `/favorites/:type/:id` | Hapus favorit, wajib token |

## Cara Menjalankan

### Backend (api)

1. Buat project Supabase baru, lalu jalankan seluruh isi `api/database/setup.sql` di **SQL Editor** (sekali saja). Isinya: 6 tabel (`users`, `areas`, `kos`, `kontrakan`, `favorites`, `otp_codes`), data contoh, dan bucket foto `kos-images`.
2. Salin `.env.example` menjadi `.env`, lalu isi `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, `GMAIL_USER`, dan `GMAIL_APP_PASSWORD` (App Password Gmail untuk mengirim OTP).
3. Jalankan:
   ```bash
   cd api
   npm install
   npm run dev
   ```
   Server berjalan di `http://localhost:3000`.

### Frontend (web / PWA)

```bash
cd web
npm install
npm run dev
```

Buka `http://localhost:5173`. Alamat API diatur lewat `VITE_API_BASE_URL` di file `web/.env` (contoh di `.env.example`); jika kosong memakai `https://ta-ppb-ngekos-undip-api.vercel.app/api`.

Untuk mencoba di HP (laptop dan HP di jaringan Wi-Fi yang sama):

```bash
npm run build
npm run preview -- --host
```

Buka alamat **Network** yang muncul di browser HP.

### Deploy PWA ke Vercel

Buat project Vercel baru dari repository yang sama dengan **Root Directory** `web` (Framework: Vite) dan Environment Variable `VITE_API_BASE_URL=https://ta-ppb-ngekos-undip-api.vercel.app/api`. Setelah deploy, buka link-nya di Chrome HP lalu pilih **Tambahkan ke layar utama**.

## Teknologi

- **Frontend:** PWA dengan React, Vite, React Router, Axios, `vite-plugin-pwa` (Workbox), Leaflet + `react-leaflet` (OpenStreetMap), `lucide-react`
- **Backend:** Node.js, Express.js, `@supabase/supabase-js`, `bcryptjs`, `jsonwebtoken`, `nodemailer`, `multer`, `cors`, `dotenv`
- **Database:** PostgreSQL (Supabase)
- **Deploy:** Vercel