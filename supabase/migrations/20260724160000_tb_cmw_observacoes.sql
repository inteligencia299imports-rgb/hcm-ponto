-- Campo livre e opcional pro vendedor anotar algo sobre o atendimento
-- (ex.: detalhe do que foi conversado, motivo de não ter fechado venda etc.).
ALTER TABLE public.tb_cmw ADD COLUMN IF NOT EXISTS observacoes text;
