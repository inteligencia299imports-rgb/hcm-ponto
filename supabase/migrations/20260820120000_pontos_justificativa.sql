-- Ajuste manual de ponto (Relatórios > Ponto) passa a exigir uma
-- justificativa do gestor. A coluna fica nullable no banco porque batidas
-- normais feitas pelo colaborador (rota /ponto) nunca preenchem esse campo;
-- a obrigatoriedade é aplicada na tela de ajuste, não no schema.
ALTER TABLE public.pontos
ADD COLUMN justificativa text;
