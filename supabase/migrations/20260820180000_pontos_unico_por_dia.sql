-- Impede mais de uma batida do mesmo tipo (entrada/intervalo/retorno/saida)
-- por usuário no mesmo dia operacional (mesma regra de corte às 3h usada
-- em chaveDiaOperacional no app: desloca -3h antes de truncar a data).
create unique index pontos_user_tipo_dia_operacional_key
on public.pontos (
  user_id,
  tipo,
  (((registrado_em at time zone 'America/Sao_Paulo') - interval '3 hours')::date)
);
