
CREATE TABLE public.plan_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  plan text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own plan signup"
  ON public.plan_signups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own plan signup"
  ON public.plan_signups FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
