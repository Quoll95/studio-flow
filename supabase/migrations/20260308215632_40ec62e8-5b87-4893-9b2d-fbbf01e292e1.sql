
-- Note pratica table
CREATE TABLE public.note_pratica (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_pratica uuid NOT NULL REFERENCES public.pratiche(id) ON DELETE CASCADE,
  testo text NOT NULL DEFAULT '',
  colore text NOT NULL DEFAULT '#fef08a',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.note_pratica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage note_pratica" ON public.note_pratica FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add ordine to punti_situazione
ALTER TABLE public.punti_situazione ADD COLUMN ordine integer NOT NULL DEFAULT 0;

-- Add ordine_situazione to pratiche for drag ordering on PuntoSituazione page
ALTER TABLE public.pratiche ADD COLUMN ordine_situazione integer NOT NULL DEFAULT 0;
