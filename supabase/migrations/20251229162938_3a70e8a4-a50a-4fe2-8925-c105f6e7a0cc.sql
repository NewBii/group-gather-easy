-- Allow anonymous event creation (where created_by is NULL)
CREATE POLICY "Anyone can create anonymous events" ON public.events
FOR INSERT WITH CHECK (created_by IS NULL);

-- Allow authenticated users to claim anonymous events they own
CREATE POLICY "Anyone can claim anonymous events" ON public.events
FOR UPDATE USING (created_by IS NULL)
WITH CHECK (auth.uid() = created_by);