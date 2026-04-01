CREATE TABLE public.note_cliente (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_cliente uuid NOT NULL REFERENCES public.clienti(id) ON DELETE CASCADE,
  testo text NOT NULL DEFAULT '',
  colore text NOT NULL DEFAULT '#fef08a',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.note_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage note_cliente" ON public.note_cliente FOR ALL TO authenticated USING (true) WITH CHECK (true);