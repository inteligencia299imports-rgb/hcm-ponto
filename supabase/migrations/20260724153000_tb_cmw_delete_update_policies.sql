-- Recria as policies de UPDATE/DELETE em tb_cmw derrubadas por CASCADE junto
-- com nome_vendedor (ver tb_cmw_lead_id.sql). Antes elas casavam a venda
-- pelo nome do vendedor; agora usam user_id, que é o identificador estável
-- (ver tb_cmw_user_id.sql) — só quem lançou a venda pode editá-la/excluí-la.
CREATE POLICY "auth delete tb_cmw" ON public.tb_cmw
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "auth update tb_cmw" ON public.tb_cmw
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
