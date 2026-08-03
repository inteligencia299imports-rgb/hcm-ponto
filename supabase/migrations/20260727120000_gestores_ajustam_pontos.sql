-- Permite que usuários com departamento = "gestor" (em user_roles_cmw)
-- insiram registros de ponto em nome de qualquer colaborador (ajuste manual
-- em Relatórios > Ponto), além da política existente que restringe cada
-- usuário a inserir apenas os próprios pontos. Políticas RLS do mesmo
-- comando (INSERT) são combinadas com OR, então isso só amplia o acesso.
CREATE POLICY "gestores ajustam pontos de qualquer colaborador"
ON public.pontos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles_cmw
    WHERE user_roles_cmw.user_id = auth.uid()
      AND lower(trim(user_roles_cmw.departamento)) = 'gestor'
  )
);
