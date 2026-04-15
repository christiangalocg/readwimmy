
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'bug',
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.reading_progress ADD COLUMN IF NOT EXISTS location_cfi text;
