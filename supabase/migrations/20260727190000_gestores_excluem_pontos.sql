-- Permite que usuários com departamento = "gestor" (em user_roles_cmw)
-- excluam (DELETE) registros de ponto de qualquer colaborador — o ícone de
-- lixeira no ajuste manual em Relatórios > Ponto só aparece pro último tipo
-- lançado no dia (entrada/intervalo/retorno/saída), pra desfazer uma batida
-- indevida sem quebrar a sequência do dia.
CREATE POLICY "gestores excluem pontos de qualquer colaborador"
ON public.pontos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles_cmw
    WHERE user_roles_cmw.user_id = auth.uid()
      AND lower(trim(user_roles_cmw.departamento)) = 'gestor'
  )
);
