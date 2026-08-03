-- Adiciona user_id a tb_cmw: identifica de forma estável o vendedor
-- creditado pela venda (resolvido a partir do vendedor escolhido no
-- dropdown de Vendas, via user_roles_cmw.user_id), em vez de depender
-- só do texto em nome_vendedor. Nullable porque vendas antigas não têm
-- esse valor — nome_vendedor continua sendo preenchido normalmente.
ALTER TABLE public.tb_cmw ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS tb_cmw_user_id_idx ON public.tb_cmw(user_id);
