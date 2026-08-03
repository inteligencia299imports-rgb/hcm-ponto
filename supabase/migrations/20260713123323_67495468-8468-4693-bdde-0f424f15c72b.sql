
CREATE TABLE public.vendedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendedores TO authenticated;
GRANT ALL ON public.vendedores TO service_role;
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read vendedores" ON public.vendedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert vendedores" ON public.vendedores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update vendedores" ON public.vendedores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete vendedores" ON public.vendedores FOR DELETE TO authenticated USING (true);

CREATE TABLE public.atendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id uuid NOT NULL REFERENCES public.vendedores(id) ON DELETE RESTRICT,
  qtd_itens integer NOT NULL CHECK (qtd_itens > 0),
  valor_venda numeric(12,2) NOT NULL CHECK (valor_venda >= 0),
  data_venda timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atendimentos TO authenticated;
GRANT ALL ON public.atendimentos TO service_role;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read atendimentos" ON public.atendimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert atendimentos" ON public.atendimentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update atendimentos" ON public.atendimentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete atendimentos" ON public.atendimentos FOR DELETE TO authenticated USING (true);

CREATE INDEX atendimentos_vendedor_idx ON public.atendimentos(vendedor_id);
CREATE INDEX atendimentos_data_idx ON public.atendimentos(data_venda);

INSERT INTO public.vendedores (nome) VALUES ('Vendedor 1'), ('Vendedor 2'), ('Vendedor 3');
