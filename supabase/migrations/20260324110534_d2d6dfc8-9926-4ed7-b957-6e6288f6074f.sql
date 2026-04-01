
-- Table for file attachments on pratiche
CREATE TABLE public.file_pratica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pratica uuid NOT NULL REFERENCES public.pratiche(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  nome_file text NOT NULL,
  tipo text NOT NULL DEFAULT 'documento',
  mime_type text,
  dimensione bigint,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.file_pratica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated manage file_pratica" ON public.file_pratica
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Storage bucket for practice files
INSERT INTO storage.buckets (id, name, public) VALUES ('pratica-files', 'pratica-files', false);

-- Storage policies
CREATE POLICY "Auth users upload pratica files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pratica-files');

CREATE POLICY "Auth users view pratica files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'pratica-files');

CREATE POLICY "Auth users delete pratica files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'pratica-files');
