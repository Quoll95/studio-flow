ALTER TABLE public.punti_situazione ADD COLUMN ora_inizio time without time zone DEFAULT NULL;
ALTER TABLE public.punti_situazione ADD COLUMN ora_fine time without time zone DEFAULT NULL;