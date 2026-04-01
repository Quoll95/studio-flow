
CREATE TABLE public.spese_fisse (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo text NOT NULL,
  importo numeric NOT NULL DEFAULT 0,
  categoria text NOT NULL DEFAULT 'altro',
  data date NOT NULL DEFAULT CURRENT_DATE,
  ricorrente boolean NOT NULL DEFAULT false,
  note text,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.spese_fisse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own spese_fisse" ON public.spese_fisse
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
