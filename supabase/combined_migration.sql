-- ============================================================
-- Combined initial migration for a fresh Supabase project.
-- Runs all 3 migrations in order, in one transaction-friendly file.
-- Paste entire file into the Supabase SQL Editor and click "Run".
-- ============================================================


-- ============================================================
-- 1. donation_purposes (main table for what people donate for)
-- ============================================================
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

CREATE POLICY "Anyone can read donation purposes"
  ON public.donation_purposes FOR SELECT USING (true);

CREATE POLICY "Anyone can insert donation purposes"
  ON public.donation_purposes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update donation purposes"
  ON public.donation_purposes FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete donation purposes"
  ON public.donation_purposes FOR DELETE USING (true);

-- Shared updated_at trigger function (used by multiple tables)
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


-- ============================================================
-- 2. purpose_history (audit log of purpose activations / moves)
-- ============================================================
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


-- ============================================================
-- 3. donations (stores every payment attempt — success + fail)
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

CREATE POLICY "Anyone can insert donations"
  ON public.donations FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read donations"
  ON public.donations FOR SELECT USING (true);


-- ============================================================
-- 4. preset_amounts (admin-editable quick-select amounts)
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
  ON public.preset_amounts FOR SELECT USING (true);

CREATE POLICY "Anyone can insert preset amounts"
  ON public.preset_amounts FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update preset amounts"
  ON public.preset_amounts FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete preset amounts"
  ON public.preset_amounts FOR DELETE USING (true);

CREATE TRIGGER update_preset_amounts_updated_at
  BEFORE UPDATE ON public.preset_amounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the default 4 preset amounts (5/10/20/50 EUR)
INSERT INTO public.preset_amounts (amount, sort_order) VALUES
  (5, 0),
  (10, 1),
  (20, 2),
  (50, 3);
