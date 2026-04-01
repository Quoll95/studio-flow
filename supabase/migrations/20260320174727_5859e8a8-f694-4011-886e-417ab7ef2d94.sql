
CREATE TABLE public.note_giornaliere_postit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  data date NOT NULL,
  testo text NOT NULL DEFAULT '',
  colore text NOT NULL DEFAULT '#fef08a',
  ordine integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.note_giornaliere_postit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own note_giornaliere_postit"
  ON public.note_giornaliere_postit
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
