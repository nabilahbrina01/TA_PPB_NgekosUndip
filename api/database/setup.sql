-- ---------------------------------------------------------------------
-- 1. TABEL
-- ---------------------------------------------------------------------

-- Akun pengguna. role: pencari (melihat) atau pemilik (memasang iklan)
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,                -- password disimpan sebagai hash bcrypt
  role text not null default 'pencari' check (role in ('pencari', 'pemilik')),
  is_verified boolean not null default false, -- sudah verifikasi OTP email?
  created_at timestamptz default now()
);

create table areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  distance_km numeric(4,1)  -- perkiraan jarak ke kampus Undip Tembalang
);

create table kos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area_id uuid references areas(id) on delete set null,
  owner_id uuid references users(id) on delete set null,  -- akun pemilik yang memasang iklan
  type text not null default 'campur' check (type in ('putra', 'putri', 'campur')),
  price_per_month integer not null default 0,
  address text,
  description text,
  facilities text[] default '{}',
  image_url text,                              -- foto sampul
  image_urls text[] not null default '{}',    -- galeri foto (maks 5)
  latitude double precision,                   -- titik lokasi di peta
  longitude double precision,
  owner_name text,
  owner_phone text,
  distance_km numeric(4,1),                    -- jarak ke kampus (dihitung otomatis oleh API)
  available_rooms integer default 0,
  created_at timestamptz default now()
);

create table kontrakan (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area_id uuid references areas(id) on delete set null,
  owner_id uuid references users(id) on delete set null,
  price_per_year integer not null default 0,
  bedrooms integer default 1,
  bathrooms integer default 1,
  address text,
  description text,
  facilities text[] default '{}',
  image_url text,
  image_urls text[] not null default '{}',
  latitude double precision,
  longitude double precision,
  owner_name text,
  owner_phone text,
  distance_km numeric(4,1),
  is_available boolean default true,
  created_at timestamptz default now()
);

-- Favorit: setiap akun punya daftar kos/kontrakan favoritnya sendiri
create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  item_type text not null check (item_type in ('kos', 'kontrakan')),
  item_id uuid not null,
  created_at timestamptz default now(),
  unique (user_id, item_type, item_id)
);

-- Kode OTP (disimpan dalam bentuk hash, berlaku 1 menit)
create table otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  purpose text not null check (purpose in ('register', 'reset')),
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz default now()
);

create index otp_codes_email_purpose_idx on otp_codes (email, purpose);

-- ---------------------------------------------------------------------
-- 2. DATA CONTOH (area, kos, kontrakan)
-- ---------------------------------------------------------------------
-- ============================================
-- 1. DATA AREAS
-- ============================================

INSERT INTO areas (id, name, description, distance_km) VALUES
('a1000001-0001-4000-8000-000000000001', 'Tembalang', 'Kawasan pendidikan dengan akses dekat ke gedung perkuliahan, tempat makan, dan fasilitas mahasiswa.', 0.7),
('a1000002-0002-4000-8000-000000000002', 'Sumurboto', 'Lingkungan permukiman yang memiliki banyak pilihan hunian mahasiswa dan akses transportasi umum.', 1.5),
('a1000003-0003-4000-8000-000000000003', 'Meteseh', 'Kawasan berkembang dengan pilihan tempat tinggal yang relatif luas dan lingkungan permukiman.', 3.8),
('a1000004-0004-4000-8000-000000000004', 'Jatimulyo', 'Area hunian mahasiswa dengan akses menuju kawasan kampus dan berbagai kebutuhan sehari-hari.', 2.4),
('a1000005-0005-4000-8000-000000000005', 'Banyumanik', 'Kawasan permukiman dengan fasilitas publik, pusat perbelanjaan, dan akses jalan utama.', 5.2);


-- ============================================
-- 2. DATA KOS
-- ============================================

INSERT INTO kos (
    name, area_id, type, price_per_month, address,
    description, facilities, image_url, owner_name,
    owner_phone, distance_km, available_rooms
) VALUES

(
    'Paviliun Nawasena',
    'a1000001-0001-4000-8000-000000000001',
    'putri', 1350000,
    'Jl. Banjarsari Selatan No. 18, Tembalang, Semarang',
    'Hunian khusus putri dengan lingkungan yang nyaman, dilengkapi ruang belajar dan akses internet untuk menunjang aktivitas perkuliahan.',
    ARRAY['WiFi','AC','Kamar mandi dalam','Lemari pakaian','Meja belajar','Dapur bersama'],
    'https://picsum.photos/seed/nawasena/800/500',
    'Ibu Ratih', '081298761245', 0.9, 2
),

(
    'Kost Arunika Residence',
    'a1000002-0002-4000-8000-000000000002',
    'campur', 1100000,
    'Jl. Mulawarman Raya No. 27, Sumurboto, Semarang',
    'Kos dengan konsep hunian praktis untuk mahasiswa dan pekerja. Tersedia area parkir dan fasilitas bersama.',
    ARRAY['WiFi','Kasur','Lemari','Parkir motor','Dapur bersama','Kamar mandi luar'],
    'https://picsum.photos/seed/arunika/800/500',
    'Bapak Hermawan', '081325678912', 1.7, 4
),

(
    'Griya Samara',
    'a1000003-0003-4000-8000-000000000003',
    'putri', 800000,
    'Jl. Sendangmulyo No. 42, Meteseh, Semarang',
    'Hunian sederhana dengan suasana lingkungan yang relatif tenang. Cocok bagi mahasiswa yang mencari tempat tinggal ekonomis.',
    ARRAY['Kasur','Lemari','Meja belajar','Parkir motor','Dapur bersama'],
    'https://picsum.photos/seed/samara/800/500',
    'Ibu Nurhayati', '085726341890', 4.1, 3
),

(
    'Urban Stay Jatimulyo',
    'a1000004-0004-4000-8000-000000000004',
    'campur', 1650000,
    'Jl. Jatimulyo Tengah No. 9, Semarang',
    'Kos modern dengan fasilitas kamar pribadi, akses keamanan, serta area komunal untuk penghuni.',
    ARRAY['AC','WiFi','Kamar mandi dalam','Water heater','CCTV','Parkir motor'],
    'https://picsum.photos/seed/urbanstay/800/500',
    'Bapak Hendra', '081390456721', 2.2, 1
),

(
    'Kost Damar Living',
    'a1000005-0005-4000-8000-000000000005',
    'putra', 1250000,
    'Jl. Durian Raya No. 56, Banyumanik, Semarang',
    'Tempat tinggal khusus putra dengan fasilitas penunjang kegiatan sehari-hari dan lokasi dekat pusat kebutuhan masyarakat.',
    ARRAY['WiFi','AC','Kasur','Lemari','Kamar mandi dalam','Parkir motor'],
    'https://picsum.photos/seed/damarliving/800/500',
    'Bapak Suryanto', '082134567890', 5.4, 2
);


-- ============================================
-- 3. DATA KONTRAKAN
-- ============================================

INSERT INTO kontrakan (
    name, area_id, price_per_year, bedrooms, bathrooms,
    address, description, facilities, image_url,
    owner_name, owner_phone, distance_km, is_available
) VALUES

(
    'Rumah Sewa Citra Harmoni',
    'a1000001-0001-4000-8000-000000000001',
    32000000, 3, 2,
    'Jl. Timoho Barat No. 31, Tembalang, Semarang',
    'Rumah tinggal dengan tiga kamar tidur dan ruang keluarga yang cukup luas. Cocok untuk mahasiswa yang ingin tinggal bersama.',
    ARRAY['Ruang keluarga','Dapur','Carport','Kamar mandi dalam','Air PDAM'],
    'https://picsum.photos/seed/citraharmoni/800/500',
    'Ibu Lestari', '081287654321', 1.1, true
),

(
    'Pondok Keluarga Mulawarman',
    'a1000002-0002-4000-8000-000000000002',
    24000000, 2, 1,
    'Jl. Mulawarman Selatan No. 14, Sumurboto, Semarang',
    'Rumah kontrakan dua kamar dengan tata ruang sederhana dan lingkungan permukiman yang mudah dijangkau.',
    ARRAY['Ruang tamu','Dapur','Halaman kecil','Air sumur','Parkir motor'],
    'https://picsum.photos/seed/mulawarman/800/500',
    'Bapak Slamet', '085640123789', 1.8, true
),

(
    'Graha Sendang Asri',
    'a1000003-0003-4000-8000-000000000003',
    19500000, 3, 1,
    'Jl. Sendang Utara No. 67, Meteseh, Semarang',
    'Rumah kontrakan dengan halaman depan dan tiga kamar tidur. Sesuai untuk kelompok mahasiswa atau keluarga kecil.',
    ARRAY['Dapur','Ruang tamu','Halaman','Garasi motor','Air PDAM'],
    'https://picsum.photos/seed/sendangasri/800/500',
    'Ibu Sri Wahyuni', '081567890234', 4.0, true
),

(
    'Casa Jatimulyo',
    'a1000004-0004-4000-8000-000000000004',
    36000000, 4, 2,
    'Jl. Jatimulyo Permai No. 22, Semarang',
    'Hunian dengan empat kamar tidur, dua kamar mandi, dan ruang keluarga. Dilengkapi area parkir untuk kendaraan penghuni.',
    ARRAY['Dapur','Ruang keluarga','Carport','WiFi','Air PDAM','Teras'],
    'https://picsum.photos/seed/casajatimulyo/800/500',
    'Bapak Wahid', '082245678901', 2.5, false
),

(
    'Rumah Singgah Banyumanik',
    'a1000005-0005-4000-8000-000000000005',
    28000000, 3, 2,
    'Jl. Sukun Raya No. 39, Banyumanik, Semarang',
    'Rumah kontrakan dengan desain minimalis dan sirkulasi udara yang baik. Memiliki ruang terbuka untuk aktivitas bersama.',
    ARRAY['Dapur','Ruang tamu','Teras','Carport','Kamar mandi dalam'],
    'https://picsum.photos/seed/sukunraya/800/500',
    'Ibu Mariani', '081298345672', 5.0, true
);

-- Foto contoh juga dimasukkan ke galeri
update kos set image_urls = array[image_url] where image_url is not null;
update kontrakan set image_urls = array[image_url] where image_url is not null;

-- Koordinat perkiraan untuk data contoh (di sekitar pusat areanya)
--    (pemilik bisa memperbaikinya lewat form Ubah iklan)
with pusat(nama, lat, lng) as (
  values ('Tembalang', -7.0555, 110.4395),
         ('Sumurboto', -7.0475, 110.4310),
         ('Meteseh', -7.0700, 110.4525),
         ('Jatimulyo', -7.0565, 110.4245),
         ('Banyumanik', -7.0650, 110.4175)
)
update kos k
set latitude = p.lat + (random() - 0.5) * 0.004,
    longitude = p.lng + (random() - 0.5) * 0.004
from areas a join pusat p on p.nama = a.name
where k.area_id = a.id and k.latitude is null;

with pusat(nama, lat, lng) as (
  values ('Tembalang', -7.0555, 110.4395),
         ('Sumurboto', -7.0475, 110.4310),
         ('Meteseh', -7.0700, 110.4525),
         ('Jatimulyo', -7.0565, 110.4245),
         ('Banyumanik', -7.0650, 110.4175)
)
update kontrakan k
set latitude = p.lat + (random() - 0.5) * 0.004,
    longitude = p.lng + (random() - 0.5) * 0.004
from areas a join pusat p on p.nama = a.name
where k.area_id = a.id and k.latitude is null;

-- Jarak ke kampus dihitung dari titik peta (rumus Haversine, titik Undip Tembalang)
update kos set distance_km = round((6371 * 2 * asin(sqrt(
  power(sin(radians(latitude - (-7.0507)) / 2), 2) +
  cos(radians(latitude)) * cos(radians(-7.0507)) * power(sin(radians(longitude - 110.4387) / 2), 2)
)))::numeric, 1) where latitude is not null;

update kontrakan set distance_km = round((6371 * 2 * asin(sqrt(
  power(sin(radians(latitude - (-7.0507)) / 2), 2) +
  cos(radians(latitude)) * cos(radians(-7.0507)) * power(sin(radians(longitude - 110.4387) / 2), 2)
)))::numeric, 1) where latitude is not null;

-- ---------------------------------------------------------------------
-- 3. STORAGE: tempat menyimpan foto yang diunggah pemilik
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('kos-images', 'kos-images', true)
on conflict (id) do nothing;

create policy "API boleh upload foto kos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'kos-images');
