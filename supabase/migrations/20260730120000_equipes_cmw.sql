-- Cria o conceito de equipe para o gráfico "Resultado por equipe" em
-- Relatórios. Cada vendedor (user_roles_cmw) pode opcionalmente pertencer a
-- uma equipe; quem ainda não foi alocado fica com equipe_id NULL.

CREATE TABLE public.equipes_cmw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipes_cmw TO authenticated;
GRANT ALL ON public.equipes_cmw TO service_role;
ALTER TABLE public.equipes_cmw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read equipes_cmw" ON public.equipes_cmw
  FOR SELECT TO authenticated USING (true);

-- Só master/gestor administram as equipes (criar, renomear, excluir).
CREATE POLICY "gestor cria equipes_cmw" ON public.equipes_cmw
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles_cmw
      WHERE user_roles_cmw.user_id = auth.uid()
        AND (user_roles_cmw.role = 'master' OR lower(trim(user_roles_cmw.departamento)) = 'gestor')
    )
  );

CREATE POLICY "gestor atualiza equipes_cmw" ON public.equipes_cmw
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles_cmw
      WHERE user_roles_cmw.user_id = auth.uid()
        AND (user_roles_cmw.role = 'master' OR lower(trim(user_roles_cmw.departamento)) = 'gestor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles_cmw
      WHERE user_roles_cmw.user_id = auth.uid()
        AND (user_roles_cmw.role = 'master' OR lower(trim(user_roles_cmw.departamento)) = 'gestor')
    )
  );

CREATE POLICY "gestor exclui equipes_cmw" ON public.equipes_cmw
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles_cmw
      WHERE user_roles_cmw.user_id = auth.uid()
        AND (user_roles_cmw.role = 'master' OR lower(trim(user_roles_cmw.departamento)) = 'gestor')
    )
  );

-- Vínculo do vendedor com a equipe (0 ou 1 equipe por vendedor).
ALTER TABLE public.user_roles_cmw
  ADD COLUMN IF NOT EXISTS equipe_id uuid REFERENCES public.equipes_cmw(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_roles_cmw_equipe_id_idx ON public.user_roles_cmw(equipe_id);
