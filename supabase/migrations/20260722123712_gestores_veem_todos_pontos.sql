-- Permite que usuários com departamento = "gestor" (em user_roles_cmw)
-- também vejam os registros de ponto de TODOS os colaboradores, além da
-- política já existente que restringe cada usuário aos próprios pontos.
-- Políticas RLS do mesmo comando (SELECT) são combinadas com OR, então
-- isso só amplia o acesso, sem afetar a política atual.
CREATE POLICY "gestores veem todos os pontos"
ON public.pontos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles_cmw
    WHERE user_roles_cmw.user_id = auth.uid()
      AND lower(trim(user_roles_cmw.departamento)) = 'gestor'
  )
);
