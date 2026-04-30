
CREATE TABLE public.preset_amounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.preset_amounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read preset amounts" ON public.preset_amounts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert preset amounts" ON public.preset_amounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update preset amounts" ON public.preset_amounts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete preset amounts" ON public.preset_amounts FOR DELETE USING (true);

CREATE TRIGGER update_preset_amounts_updated_at
BEFORE UPDATE ON public.preset_amounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.preset_amounts (amount, sort_order) VALUES
  (5, 1), (10, 2), (20, 3), (50, 4);

CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  purpose_id uuid REFERENCES public.donation_purposes(id) ON DELETE SET NULL,
  purpose_title_de text NOT NULL,
  purpose_title_bs text NOT NULL,
  status text NOT NULL,
  sumup_tx_code text,
  error_code text,
  error_message text,
  device_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read donations" ON public.donations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert donations" ON public.donations FOR INSERT WITH CHECK (true);

CREATE INDEX idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX idx_donations_status ON public.donations(status);
