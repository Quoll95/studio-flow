-- Categorie spesa configurabili
CREATE TABLE public.categorie_spesa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  ordine integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.categorie_spesa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage categorie_spesa" ON public.categorie_spesa FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inserisci categorie di default
INSERT INTO public.categorie_spesa (label, ordine) VALUES
  ('Bollette', 0), ('Affitto', 1), ('Macchinari', 2), ('Cancelleria', 3),
  ('Software', 4), ('Assicurazioni', 5), ('Personale', 6), ('Altro', 7);

-- Note generali spese fisse
CREATE TABLE public.note_spese (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  testo text NOT NULL DEFAULT '',
  colore text NOT NULL DEFAULT '#fef08a',
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.note_spese ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own note_spese" ON public.note_spese FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- N rate per spese fisse
ALTER TABLE public.spese_fisse ADD COLUMN n_rate integer NOT NULL DEFAULT 1;