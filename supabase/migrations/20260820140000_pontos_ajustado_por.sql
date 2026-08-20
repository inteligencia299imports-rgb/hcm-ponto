-- Registra qual usuário (gestor) fez o ajuste/inclusão manual de um ponto,
-- distinto do user_id da linha (que é o colaborador dono do ponto). Fica
-- null em batidas normais feitas pelo próprio colaborador.
ALTER TABLE public.pontos
ADD COLUMN ajustado_por uuid;
