
-- Create dynamic stati_pratica table
CREATE TABLE public.stati_pratica (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  valore text NOT NULL UNIQUE,
  colore text NOT NULL DEFAULT '#3b82f6',
  ordine integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stati_pratica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage stati_pratica" ON public.stati_pratica FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can read stati_pratica" ON public.stati_pratica FOR SELECT USING (true);

-- Seed default states
INSERT INTO public.stati_pratica (label, valore, colore, ordine) VALUES
  ('Da iniziare', 'aperta', '#3b82f6', 1),
  ('In corso', 'in_corso', '#f59e0b', 2),
  ('Chiusa', 'chiusa', '#22c55e', 3);

-- Change pratiche.stato from enum to text
ALTER TABLE public.pratiche ALTER COLUMN stato DROP DEFAULT;
ALTER TABLE public.pratiche ALTER COLUMN stato TYPE text USING stato::text;
ALTER TABLE public.pratiche ALTER COLUMN stato SET DEFAULT 'aperta';

-- Drop the old enum
DROP TYPE IF EXISTS public.stato_pratica;
