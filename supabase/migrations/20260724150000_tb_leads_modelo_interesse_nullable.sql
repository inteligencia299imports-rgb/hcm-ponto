-- "Modelo de interesse" é opcional: nem toda venda lançada em Atendimentos
-- vem de um lead com um modelo de moto de interesse já definido. Sem essa
-- migração, o insert de lead novo em tb_cmw's fluxo de vendas falha com
-- "null value in column modelo_interesse violates not-null constraint".
ALTER TABLE public.tb_leads ALTER COLUMN modelo_interesse DROP NOT NULL;
