create function sync_auth_user_to_public() returns trigger
    security definer
    language plpgsql
as
$$
BEGIN
  -- INSERT: hanya buat user jika belum ada
  IF (TG_OP = 'INSERT') THEN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
      INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
      VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.created_at,
        NEW.created_at
      );
    END IF;

    RETURN NEW;
  END IF;

  -- UPDATE: sinkronkan data ke public.users
  IF (TG_OP = 'UPDATE') THEN
    UPDATE public.users
      SET email      = NEW.email,
          name       = NEW.raw_user_meta_data->>'name',
          avatar_url = NEW.raw_user_meta_data->>'avatar_url',
          updated_at = NOW()
    WHERE id = NEW.id;

    RETURN NEW;
  END IF;

  RETURN NEW;

EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$;

alter function sync_auth_user_to_public() owner to postgres;

grant execute on function sync_auth_user_to_public() to service_role;


----------- create trigger
create trigger sync_auth_user_to_public_insert
after insert on auth.users
for each row
execute function sync_auth_user_to_public();


----------- update trigger
create trigger sync_auth_user_to_public_update
after update on auth.users
for each row
execute function sync_auth_user_to_public();
