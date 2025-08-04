
-- Storage setup

-- Create uploads bucket
INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public)
VALUES ('uploads', 'uploads', null, NOW(), NOW(), false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for uploads
CREATE POLICY "uploads_policy" ON storage.objects
  FOR ALL USING (
    bucket_id = 'uploads' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'service_role')
  );
