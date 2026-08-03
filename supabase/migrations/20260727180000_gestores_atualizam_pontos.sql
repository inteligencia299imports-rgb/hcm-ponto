-- Permite que usuários com departamento = "gestor" (em user_roles_cmw)
-- atualizem (UPDATE) registros de ponto de qualquer colaborador — o ajuste
-- manual em Relatórios > Ponto agora corrige o horário de um registro já
-- existente (em vez de só criar um novo) quando aquele tipo (entrada,
-- intervalo, retorno ou saída) já tinha sido lançado naquele dia.
CREATE POLICY "gestores atualizam pontos de qualquer colaborador"
ON public.pontos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles_cmw
    WHERE user_roles_cmw.user_id = auth.uid()
      AND lower(trim(user_roles_cmw.departamento)) = 'gestor'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles_cmw
    WHERE user_roles_cmw.user_id = auth.uid()
      AND lower(trim(user_roles_cmw.departamento)) = 'gestor'
  )
);
