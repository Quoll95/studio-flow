
ALTER TABLE public.spese_fisse ADD COLUMN frequenza_mesi integer NOT NULL DEFAULT 0;
UPDATE public.spese_fisse SET frequenza_mesi = 1 WHERE ricorrente = true;
ALTER TABLE public.spese_fisse DROP COLUMN ricorrente;
