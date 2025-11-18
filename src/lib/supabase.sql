-- 1) Buat fungsi trigger di schema public
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Hanya insert jika belum ada user dengan id yang sama
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NEW.created_at, NEW.created_at);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Jika ada race condition dan row sudah dibuat oleh proses lain, abaikan
    RETURN NEW;
END;
$$;

-- 2) Beri hak eksekusi pada role yang diperlukan (biasanya postgres owner sudah cukup)
-- Pastikan owner fungsi bisa membaca auth.users; SECURITY DEFINER membuat fungsi berjalan dengan hak pemilik.

-- 3) Cabut eksekusi dari anon dan authenticated untuk keamanan
REVOKE EXECUTE ON FUNCTION public.sync_auth_user_to_public() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_auth_user_to_public() FROM authenticated;

-- 4) Buat trigger di auth.users untuk memanggil fungsi setelah insert
DROP TRIGGER IF EXISTS auth_user_after_insert_sync_public ON auth.users;

CREATE TRIGGER auth_user_after_insert_sync_public
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_auth_user_to_public();