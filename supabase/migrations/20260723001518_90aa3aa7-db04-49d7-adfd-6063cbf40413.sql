
ALTER TABLE public.tb_cmw
  ADD COLUMN IF NOT EXISTS loja text
    CHECK (loja IS NULL OR loja IN ('299', 'Ducati'));
