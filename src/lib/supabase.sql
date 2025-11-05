
-- BANNERS
CREATE TABLE IF NOT EXISTS public.banners (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Optional: trigger to maintain updated_at on update
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_updated_at_on_banners ON public.banners;
CREATE TRIGGER set_updated_at_on_banners
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Optional index to speed up queries that exclude soft-deleted rows
CREATE INDEX IF NOT EXISTS idx_banners_not_deleted ON public.banners (id) WHERE deleted_at IS NULL;


------------------------------------ ## -----------------------------------------

-- HISTORY_CATEGORY
CREATE TABLE IF NOT EXISTS public.history_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Fungsi trigger untuk mengatur updated_at otomatis saat UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger khusus untuk tabel history_categories
DROP TRIGGER IF EXISTS set_updated_at_on_history_categories ON public.history_categories;
CREATE TRIGGER set_updated_at_on_history_categories
BEFORE UPDATE ON public.history_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Indeks opsional untuk mempercepat query yang hanya mengambil record non-deleted
CREATE INDEX IF NOT EXISTS idx_history_categories_not_deleted
  ON public.history_categories (id)
  WHERE deleted_at IS NULL;

------------------------------------ ## -----------------------------------------

-- HISTORIES
-- 1) Buat tipe enum untuk kolom type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'history_type') THEN
    CREATE TYPE public.history_type AS ENUM ('INCOME', 'SPEND');
  END IF;
END
$$;

-- 2) Tabel histories
CREATE TABLE IF NOT EXISTS public.histories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category_id BIGINT NOT NULL REFERENCES public.history_categories(id) ON DELETE RESTRICT,
  image_url TEXT,
  type public.history_type NOT NULL,
  amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- 3) Pastikan fungsi set_updated_at ada (diperlukan hanya sekali; sudah disertakan sebelumnya but OK idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Pasang trigger untuk histories
DROP TRIGGER IF EXISTS set_updated_at_on_histories ON public.histories;
CREATE TRIGGER set_updated_at_on_histories
BEFORE UPDATE ON public.histories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 5) Indeks opsional untuk mempercepat kueri yang mengabaikan soft-deleted
CREATE INDEX IF NOT EXISTS idx_histories_not_deleted ON public.histories (category_id) WHERE deleted_at IS NULL;

-- 6) Indeks untuk pencarian berdasarkan tipe/amount (opsional)
CREATE INDEX IF NOT EXISTS idx_histories_type ON public.histories (type);
CREATE INDEX IF NOT EXISTS idx_histories_amount ON public.histories (amount);
