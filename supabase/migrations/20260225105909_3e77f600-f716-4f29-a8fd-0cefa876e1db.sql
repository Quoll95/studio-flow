
-- Profiles table for user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clienti
CREATE TABLE public.clienti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  p_iva_cf TEXT,
  email TEXT,
  telefono TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clienti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD clienti" ON public.clienti FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tipi pratica
CREATE TABLE public.tipi_pratica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tipi_pratica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read tipi_pratica" ON public.tipi_pratica FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage tipi_pratica" ON public.tipi_pratica FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pratiche
CREATE TYPE public.stato_pratica AS ENUM ('aperta', 'in_corso', 'chiusa');

CREATE TABLE public.pratiche (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo TEXT NOT NULL,
  descrizione TEXT,
  id_cliente UUID REFERENCES public.clienti(id) ON DELETE SET NULL,
  id_tipo UUID REFERENCES public.tipi_pratica(id) ON DELETE SET NULL,
  stato public.stato_pratica NOT NULL DEFAULT 'aperta',
  privata BOOLEAN NOT NULL DEFAULT false,
  proprietario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pratiche ENABLE ROW LEVEL SECURITY;

-- Non-private: all authenticated can see. Private: only owner.
CREATE POLICY "View pratiche" ON public.pratiche FOR SELECT TO authenticated
  USING (privata = false OR proprietario_id = auth.uid());
CREATE POLICY "Insert pratiche" ON public.pratiche FOR INSERT TO authenticated
  WITH CHECK (proprietario_id = auth.uid());
CREATE POLICY "Update pratiche" ON public.pratiche FOR UPDATE TO authenticated
  USING (proprietario_id = auth.uid() OR privata = false);
CREATE POLICY "Delete pratiche" ON public.pratiche FOR DELETE TO authenticated
  USING (proprietario_id = auth.uid());

-- Scadenze
CREATE TABLE public.scadenze (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo TEXT NOT NULL,
  data_scadenza DATE NOT NULL,
  id_pratica UUID REFERENCES public.pratiche(id) ON DELETE CASCADE,
  completata BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scadenze ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View scadenze" ON public.scadenze FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage scadenze" ON public.scadenze FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  azione TEXT NOT NULL,
  dettagli TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View audit_log" ON public.audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert audit_log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clienti_updated_at BEFORE UPDATE ON public.clienti FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pratiche_updated_at BEFORE UPDATE ON public.pratiche FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed tipi_pratica
INSERT INTO public.tipi_pratica (label) VALUES
  ('Catasto'),
  ('Edilizia Privata'),
  ('Urbanistica'),
  ('Successione'),
  ('Perizia'),
  ('Consulenza Tecnica');
