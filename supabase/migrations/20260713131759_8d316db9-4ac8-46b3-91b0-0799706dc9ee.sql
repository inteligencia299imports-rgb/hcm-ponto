
DROP POLICY IF EXISTS "auth read atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "auth insert atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "auth update atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "auth delete atendimentos" ON public.atendimentos;

DROP POLICY IF EXISTS "auth read vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "auth insert vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "auth update vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "auth delete vendedores" ON public.vendedores;

ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendedores  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.atendimentos FROM anon, authenticated;
REVOKE ALL ON public.vendedores  FROM anon, authenticated;
