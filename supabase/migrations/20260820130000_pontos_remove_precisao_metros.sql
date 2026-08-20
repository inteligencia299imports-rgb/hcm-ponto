-- Precisão do GPS (metros) capturada na batida do colaborador deixou de ser
-- usada pela aplicação; remove a coluna.
ALTER TABLE public.pontos
DROP COLUMN precisao_metros;
