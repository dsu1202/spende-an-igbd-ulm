
CREATE TABLE public.donation_purposes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_de TEXT NOT NULL,
  title_bs TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.donation_purposes ENABLE ROW LEVEL SECURITY;

-- Public read for kiosk
CREATE POLICY "Anyone can read donation purposes"
  ON public.donation_purposes FOR SELECT
  USING (true);

-- Public write for admin (secured by obscure URL)
CREATE POLICY "Anyone can insert donation purposes"
  ON public.donation_purposes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update donation purposes"
  ON public.donation_purposes FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete donation purposes"
  ON public.donation_purposes FOR DELETE
  USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_donation_purposes_updated_at
  BEFORE UPDATE ON public.donation_purposes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
