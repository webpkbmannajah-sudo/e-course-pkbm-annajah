-- Migration: Update level names to Indonesian & Seed all subjects
-- Date: 2026-02-17

-- ==========================================
-- 1. Update Level Names to Indonesian
-- ==========================================
UPDATE public.levels SET name = 'Paket A (Setara SD)' WHERE slug = 'sd';
UPDATE public.levels SET name = 'Paket B (Setara SMP)' WHERE slug = 'smp';
UPDATE public.levels SET name = 'Paket C (Setara SMA)' WHERE slug = 'sma';

-- ==========================================
-- 2. Seed Subjects
-- ==========================================

-- Helper: Get level IDs
DO $$
DECLARE
    v_sd_id UUID;
    v_smp_id UUID;
    v_sma_id UUID;
BEGIN
    SELECT id INTO v_sd_id FROM public.levels WHERE slug = 'sd';
    SELECT id INTO v_smp_id FROM public.levels WHERE slug = 'smp';
    SELECT id INTO v_sma_id FROM public.levels WHERE slug = 'sma';

    -- ========== PAKET A (SD) - 7 Mata Pelajaran ==========
    INSERT INTO public.subjects (level_id, name) VALUES
        (v_sd_id, 'Bahasa Indonesia'),
        (v_sd_id, 'Matematika'),
        (v_sd_id, 'Ilmu Pengetahuan Alam dan Sosial (IPAS)'),
        (v_sd_id, 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)'),
        (v_sd_id, 'Pendidikan Agama Islam'),
        (v_sd_id, 'Bahasa Inggris'),
        (v_sd_id, 'Pendidikan Pancasila')
    ON CONFLICT DO NOTHING;

    -- ========== PAKET B (SMP) - 7 Mata Pelajaran ==========
    INSERT INTO public.subjects (level_id, name) VALUES
        (v_smp_id, 'Bahasa Indonesia'),
        (v_smp_id, 'Bahasa Inggris'),
        (v_smp_id, 'Matematika'),
        (v_smp_id, 'Ilmu Pengetahuan Alam (IPA)'),
        (v_smp_id, 'Ilmu Pengetahuan Sosial (IPS)'),
        (v_smp_id, 'Pendidikan Agama dan Budi Pekerti'),
        (v_smp_id, 'Pendidikan Pancasila')
    ON CONFLICT DO NOTHING;

    -- ========== PAKET C (SMA) - Mata Pelajaran Umum (11) ==========
    INSERT INTO public.subjects (level_id, name) VALUES
        (v_sma_id, 'Bahasa Indonesia'),
        (v_sma_id, 'Bahasa Indonesia Tingkat Lanjut'),
        (v_sma_id, 'Bahasa Inggris'),
        (v_sma_id, 'Bahasa Inggris Tingkat Lanjut'),
        (v_sma_id, 'Matematika'),
        (v_sma_id, 'Matematika Tingkat Lanjut'),
        (v_sma_id, 'Pendidikan Agama dan Budi Pekerti'),
        (v_sma_id, 'Pendidikan Pancasila'),
        (v_sma_id, 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)'),
        (v_sma_id, 'Seni Budaya'),
        (v_sma_id, 'Informatika')
    ON CONFLICT DO NOTHING;

    -- ========== PAKET C (SMA) - Mata Pelajaran Peminatan (8) ==========
    INSERT INTO public.subjects (level_id, name) VALUES
        (v_sma_id, 'Fisika'),
        (v_sma_id, 'Kimia'),
        (v_sma_id, 'Biologi'),
        (v_sma_id, 'Sejarah'),
        (v_sma_id, 'Ekonomi'),
        (v_sma_id, 'Geografi'),
        (v_sma_id, 'Sosiologi'),
        (v_sma_id, 'Antropologi')
    ON CONFLICT DO NOTHING;

END $$;
