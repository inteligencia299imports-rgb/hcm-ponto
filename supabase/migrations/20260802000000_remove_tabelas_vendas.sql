-- O sistema deixou de ter módulo de vendas/leads/NPS e agora é só ponto.
-- Remove as tabelas que só existiam pra isso (nenhum código atual as usa).
-- Ordem respeita as foreign keys: respostas_nps -> tb_leads,
-- atendimentos -> vendedores, user_roles_cmw.equipe_id -> equipes_cmw.
DROP TABLE IF EXISTS public.respostas_nps;
DROP TABLE IF EXISTS public.tb_cmw;
DROP TABLE IF EXISTS public.tb_leads;

-- Tabelas legadas da primeira migration, substituídas por
-- tb_cmw/user_roles_cmw faz tempo — já sem uso mesmo antes desta limpeza.
DROP TABLE IF EXISTS public.atendimentos;
DROP TABLE IF EXISTS public.vendedores;

ALTER TABLE public.user_roles_cmw DROP COLUMN IF EXISTS equipe_id;
DROP TABLE IF EXISTS public.equipes_cmw;
