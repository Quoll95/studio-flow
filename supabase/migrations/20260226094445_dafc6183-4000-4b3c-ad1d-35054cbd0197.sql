
-- Add spese and guadagni columns to pratiche
ALTER TABLE public.pratiche ADD COLUMN spese numeric DEFAULT 0;
ALTER TABLE public.pratiche ADD COLUMN guadagni numeric DEFAULT 0;
