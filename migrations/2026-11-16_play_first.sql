-- DEMO branch only. Preserve all existing APK metadata and released records.
-- The public catalog always prefers the verified Google Play listing when available.
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS play_store_status varchar(16) NOT NULL DEFAULT 'unknown';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'apps_play_store_status_check'
      AND conrelid = 'public.apps'::regclass
  ) THEN
    ALTER TABLE public.apps ADD CONSTRAINT apps_play_store_status_check
    CHECK (play_store_status IN ('unknown', 'available', 'unavailable'));
  END IF;
END $$;

COMMENT ON COLUMN public.apps.play_store_status IS
  'Set to available only after checking the official Google Play listing for this package. Unknown prevents guessing Play availability.';