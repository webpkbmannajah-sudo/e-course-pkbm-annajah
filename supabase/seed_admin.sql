-- Script SQL untuk membuat akun Admin
-- Cara penggunaan: Copy dan jalankan seluruh kode ini di Supabase Dashboard -> SQL Editor

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- Hapus user jika sudah ada sebelumnya (mencegah error duplikasi email)
  DELETE FROM auth.users WHERE email = 'my070441@gmail.com';

  -- Buat user admin baru di auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated', -- Audience
    'authenticated', -- Role
    'my070441@gmail.com',
    crypt('Admin123*', gen_salt('bf')), -- Password di-hash menggunakan bcrypt
    now(), -- Email otomatis tervalidasi
    '{"provider":"email","providers":["email"]}',
    '{"name":"Administrator", "role":"admin"}', -- Trigger database akan membaca role ini
    now(),
    now()
  );

  -- Catatan:
  -- Eksekusi INSERT di atas otomatis memanggil trigger `handle_new_user()` 
  -- yang akan menambahkan data ke tabel `public.profiles` sebagai role 'admin'.
END $$;
