
ALTER TABLE public.profiles 
  ADD COLUMN daily_email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN daily_email_hour integer NOT NULL DEFAULT 7;

ALTER TABLE public.eventi_calendario 
  ADD COLUMN avvisi text[] NOT NULL DEFAULT '{}';
