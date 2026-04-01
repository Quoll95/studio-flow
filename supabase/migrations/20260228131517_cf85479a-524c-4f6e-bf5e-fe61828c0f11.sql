
-- Table for "Punto della situazione" items per pratica
CREATE TABLE public.punti_situazione (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_pratica UUID NOT NULL REFERENCES public.pratiche(id) ON DELETE CASCADE,
  testo TEXT NOT NULL,
  completata BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.punti_situazione ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage punti_situazione" ON public.punti_situazione FOR ALL USING (true) WITH CHECK (true);

-- Add guadagni fields to pratiche
ALTER TABLE public.pratiche
  ADD COLUMN guadagno_preventivato NUMERIC DEFAULT 0,
  ADD COLUMN data_preventivata_fine DATE,
  ADD COLUMN soldi_presi NUMERIC DEFAULT 0;

-- Table for calendar events (like Google Calendar)
CREATE TABLE public.eventi_calendario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titolo TEXT NOT NULL,
  descrizione TEXT,
  colore TEXT NOT NULL DEFAULT '#3b82f6',
  data DATE NOT NULL,
  ora_inizio TIME,
  ora_fine TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.eventi_calendario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own events" ON public.eventi_calendario FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
