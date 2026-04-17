-- ============================================================
-- Donations table: stores every payment attempt (success + fail)
-- ============================================================
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount INTEGER NOT NULL CHECK (amount > 0 AND amount <= 50000),
  currency TEXT NOT NULL DEFAULT 'EUR',
  purpose_id UUID REFERENCES public.donation_purposes(id) ON DELETE SET NULL,
  purpose_title_de TEXT NOT NULL,
  purpose_title_bs TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'cancelled', 'pending')),
  sumup_tx_code TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_donations_created_at ON public.donations (created_at DESC);
CREATE INDEX idx_donations_status ON public.donations (status);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Public insert for kiosk (anon key writes transactions)
CREATE POLICY "Anyone can insert donations"
  ON public.donations FOR INSERT
  WITH CHECK (true);

-- Public read for admin panel (secured by obscure URL + auth)
CREATE POLICY "Anyone can read donations"
  ON public.donations FOR SELECT
  USING (true);


-- ============================================================
-- Preset amounts table: admin-editable quick-select amounts
-- ============================================================
CREATE TABLE public.preset_amounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount INTEGER NOT NULL CHECK (amount > 0 AND amount <= 500),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_preset_amounts_sort ON public.preset_amounts (sort_order);

ALTER TABLE public.preset_amounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read preset amounts"
  ON public.preset_amounts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert preset amounts"
  ON public.preset_amounts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update preset amounts"
  ON public.preset_amounts FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete preset amounts"
  ON public.preset_amounts FOR DELETE
  USING (true);

-- updated_at trigger
CREATE TRIGGER update_preset_amounts_updated_at
  BEFORE UPDATE ON public.preset_amounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the original 4 preset amounts
INSERT INTO public.preset_amounts (amount, sort_order) VALUES
  (5, 0),
  (10, 1),
  (20, 2),
  (50, 3);
