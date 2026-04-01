
-- Practice colors table
CREATE TABLE public.colori_pratica (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  colore text NOT NULL DEFAULT '#3b82f6',
  ordine integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.colori_pratica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage colori_pratica" ON public.colori_pratica FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can read colori_pratica" ON public.colori_pratica FOR SELECT TO authenticated USING (true);

-- Insert 3 default colors
INSERT INTO public.colori_pratica (label, colore, ordine) VALUES
  ('Blu', '#3b82f6', 1),
  ('Verde', '#22c55e', 2),
  ('Viola', '#8b5cf6', 3);

-- Add colore field to pratiche
ALTER TABLE public.pratiche ADD COLUMN colore text DEFAULT NULL;

-- Add id_pratica to eventi_calendario for linking
ALTER TABLE public.eventi_calendario ADD COLUMN id_pratica uuid DEFAULT NULL REFERENCES public.pratiche(id) ON DELETE SET NULL;

-- Movimenti pratica table (income/expenses per practice)
CREATE TABLE public.movimenti_pratica (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_pratica uuid NOT NULL REFERENCES public.pratiche(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'entrata' CHECK (tipo IN ('entrata', 'uscita')),
  importo numeric NOT NULL DEFAULT 0,
  descrizione text,
  data date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.movimenti_pratica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage movimenti_pratica" ON public.movimenti_pratica FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime for movimenti
ALTER PUBLICATION supabase_realtime ADD TABLE public.movimenti_pratica;
