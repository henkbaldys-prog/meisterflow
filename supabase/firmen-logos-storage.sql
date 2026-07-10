-- Supabase Storage für Firmenlogos (im SQL Editor ausführen)
-- Bucket: firmen-logos, öffentlich lesbar, Upload nur im eigenen Ordner

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'firmen-logos',
  'firmen-logos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Öffentliches Lesen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Firmenlogos public read'
  ) THEN
    CREATE POLICY "Firmenlogos public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'firmen-logos');
  END IF;
END $$;

-- Upload nur in eigenen Ordner: {user_id}/...
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users upload own firmenlogo'
  ) THEN
    CREATE POLICY "Users upload own firmenlogo"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'firmen-logos'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users update own firmenlogo'
  ) THEN
    CREATE POLICY "Users update own firmenlogo"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'firmen-logos'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users delete own firmenlogo'
  ) THEN
    CREATE POLICY "Users delete own firmenlogo"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'firmen-logos'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;
