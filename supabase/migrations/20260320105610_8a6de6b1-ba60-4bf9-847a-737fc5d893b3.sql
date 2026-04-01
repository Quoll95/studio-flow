
-- Change frequenza_mesi to numeric to support weekly frequencies (0.25, 0.5)
ALTER TABLE public.spese_fisse ALTER COLUMN frequenza_mesi TYPE numeric USING frequenza_mesi::numeric;

-- Add ordine to note tables for drag-and-drop reordering
ALTER TABLE public.note_pratica ADD COLUMN IF NOT EXISTS ordine integer NOT NULL DEFAULT 0;
ALTER TABLE public.note_cliente ADD COLUMN IF NOT EXISTS ordine integer NOT NULL DEFAULT 0;
ALTER TABLE public.note_spese ADD COLUMN IF NOT EXISTS ordine integer NOT NULL DEFAULT 0;

-- Create netto_tasse_config table for persisting fiscal parameters
CREATE TABLE IF NOT EXISTS public.netto_tasse_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  categoria_key text NOT NULL,
  nome text NOT NULL,
  fatturato numeric NOT NULL DEFAULT 0,
  min_sogg numeric NOT NULL DEFAULT 0,
  min_int numeric NOT NULL DEFAULT 0,
  perc_sogg numeric NOT NULL DEFAULT 0,
  perc_int numeric NOT NULL DEFAULT 0,
  perc_tasse numeric NOT NULL DEFAULT 0,
  coefficiente numeric NOT NULL DEFAULT 78,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, categoria_key)
);

ALTER TABLE public.netto_tasse_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own netto_tasse_config"
  ON public.netto_tasse_config FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create netto_tasse_storico table for year history
CREATE TABLE IF NOT EXISTS public.netto_tasse_storico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  anno text NOT NULL,
  paolo_lordo numeric NOT NULL DEFAULT 0,
  paolo_netto numeric NOT NULL DEFAULT 0,
  paolo_tasse numeric NOT NULL DEFAULT 0,
  sergio_lordo numeric NOT NULL DEFAULT 0,
  sergio_netto numeric NOT NULL DEFAULT 0,
  sergio_tasse numeric NOT NULL DEFAULT 0,
  roberto_lordo numeric NOT NULL DEFAULT 0,
  roberto_netto numeric NOT NULL DEFAULT 0,
  roberto_tasse numeric NOT NULL DEFAULT 0,
  totale_famiglia numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, anno)
);

ALTER TABLE public.netto_tasse_storico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own netto_tasse_storico"
  ON public.netto_tasse_storico FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
