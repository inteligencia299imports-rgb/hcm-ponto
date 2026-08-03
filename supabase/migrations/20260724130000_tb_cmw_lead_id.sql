-- Vincula cada venda a um lead (tb_leads) pra capturar nome/telefone/UF do
-- cliente no momento da venda, e remove nome_vendedor: o vendedor já é
-- identificado de forma estável por user_id (ver tb_cmw_user_id.sql).
--
-- ATENÇÃO: vendas antigas sem user_id preenchido perdiam o fallback por
-- nome_vendedor e deixam de casar com nenhum vendedor no app depois desta
-- migração — decisão deliberada, não um efeito colateral esquecido.
--
-- Confira o tipo de tb_leads.id antes de rodar; a FK abaixo assume uuid.
ALTER TABLE public.tb_cmw ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.tb_leads(id);
CREATE INDEX IF NOT EXISTS tb_cmw_lead_id_idx ON public.tb_cmw(lead_id);

-- As policies "auth delete tb_cmw" e "auth update tb_cmw" referenciam
-- nome_vendedor, então o DROP COLUMN abaixo derruba as duas junto (CASCADE).
-- Depois de rodar, tb_cmw fica SEM nenhuma policy de delete/update — decisão
-- deliberada, mas confira se isso é aceitável antes de rodar em produção, e
-- crie novas policies (baseadas em user_id, se necessário) se não for.
ALTER TABLE public.tb_cmw DROP COLUMN IF EXISTS nome_vendedor CASCADE;
