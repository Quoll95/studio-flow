ALTER TABLE public.netto_tasse_storico 
ADD COLUMN paolo_rim_sogg numeric NOT NULL DEFAULT 0,
ADD COLUMN paolo_rim_int numeric NOT NULL DEFAULT 0,
ADD COLUMN sergio_rim_sogg numeric NOT NULL DEFAULT 0,
ADD COLUMN sergio_rim_int numeric NOT NULL DEFAULT 0,
ADD COLUMN roberto_rim_sogg numeric NOT NULL DEFAULT 0,
ADD COLUMN roberto_rim_int numeric NOT NULL DEFAULT 0;