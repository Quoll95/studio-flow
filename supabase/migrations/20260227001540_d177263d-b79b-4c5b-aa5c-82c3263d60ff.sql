
-- Create table for daily notes on calendar
CREATE TABLE public.note_giornaliere (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  contenuto TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(data, user_id)
);

ALTER TABLE public.note_giornaliere ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes" ON public.note_giornaliere FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.note_giornaliere FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.note_giornaliere FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.note_giornaliere FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_note_giornaliere_updated_at
BEFORE UPDATE ON public.note_giornaliere
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
