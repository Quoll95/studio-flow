
-- eventi_calendario: allow all authenticated to view, but only owner can modify
DROP POLICY IF EXISTS "Users can manage own events" ON public.eventi_calendario;

CREATE POLICY "Users can view all events"
ON public.eventi_calendario FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own events"
ON public.eventi_calendario FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
ON public.eventi_calendario FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
ON public.eventi_calendario FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- netto_tasse_config: allow all authenticated to view
DROP POLICY IF EXISTS "Users manage own netto_tasse_config" ON public.netto_tasse_config;

CREATE POLICY "Users can view all netto_tasse_config"
ON public.netto_tasse_config FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own netto_tasse_config"
ON public.netto_tasse_config FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own netto_tasse_config"
ON public.netto_tasse_config FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own netto_tasse_config"
ON public.netto_tasse_config FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- netto_tasse_storico: allow all authenticated to view
DROP POLICY IF EXISTS "Users manage own netto_tasse_storico" ON public.netto_tasse_storico;

CREATE POLICY "Users can view all netto_tasse_storico"
ON public.netto_tasse_storico FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own netto_tasse_storico"
ON public.netto_tasse_storico FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own netto_tasse_storico"
ON public.netto_tasse_storico FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own netto_tasse_storico"
ON public.netto_tasse_storico FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- spese_fisse: allow all authenticated to view
DROP POLICY IF EXISTS "Users can manage own spese_fisse" ON public.spese_fisse;

CREATE POLICY "Users can view all spese_fisse"
ON public.spese_fisse FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own spese_fisse"
ON public.spese_fisse FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spese_fisse"
ON public.spese_fisse FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spese_fisse"
ON public.spese_fisse FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- note_giornaliere: allow all authenticated to view
DROP POLICY IF EXISTS "Users can view own notes" ON public.note_giornaliere;
DROP POLICY IF EXISTS "Users can insert own notes" ON public.note_giornaliere;
DROP POLICY IF EXISTS "Users can update own notes" ON public.note_giornaliere;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.note_giornaliere;

CREATE POLICY "Users can view all notes"
ON public.note_giornaliere FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own notes"
ON public.note_giornaliere FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
ON public.note_giornaliere FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
ON public.note_giornaliere FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- note_giornaliere_postit: allow all authenticated to view
DROP POLICY IF EXISTS "Users manage own note_giornaliere_postit" ON public.note_giornaliere_postit;

CREATE POLICY "Users can view all postit"
ON public.note_giornaliere_postit FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own postit"
ON public.note_giornaliere_postit FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own postit"
ON public.note_giornaliere_postit FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own postit"
ON public.note_giornaliere_postit FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- note_spese: allow all authenticated to view
DROP POLICY IF EXISTS "Manage own note_spese" ON public.note_spese;

CREATE POLICY "Users can view all note_spese"
ON public.note_spese FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own note_spese"
ON public.note_spese FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own note_spese"
ON public.note_spese FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own note_spese"
ON public.note_spese FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
