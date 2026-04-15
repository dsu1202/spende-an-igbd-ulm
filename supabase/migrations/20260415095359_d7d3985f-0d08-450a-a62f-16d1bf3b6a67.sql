
CREATE TABLE public.purpose_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purpose_id UUID REFERENCES public.donation_purposes(id) ON DELETE SET NULL,
  purpose_title_de TEXT NOT NULL,
  purpose_title_bs TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 3),
  action TEXT NOT NULL CHECK (action IN ('activated', 'deactivated', 'moved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.purpose_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read purpose history"
  ON public.purpose_history FOR SELECT USING (true);

CREATE POLICY "Anyone can insert purpose history"
  ON public.purpose_history FOR INSERT WITH CHECK (true);
