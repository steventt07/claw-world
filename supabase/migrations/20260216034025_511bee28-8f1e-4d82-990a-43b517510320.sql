
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (signup)
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist
  FOR INSERT
  WITH CHECK (true);

-- No public read access
CREATE POLICY "No public read"
  ON public.waitlist
  FOR SELECT
  USING (false);
