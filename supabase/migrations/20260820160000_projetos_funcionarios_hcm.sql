-- Prepara o banco do PONTO pra futura unificação com o sistema de HCM: gate
-- de acesso por projeto (em vez de nível de acesso) e fonte de
-- departamento/carga horária vindo de funcionarios_hcm. Versão enxuta do
-- schema real do outro sistema — só as colunas que o hcm-ponto usa hoje.

create table public.projetos (
  id uuid not null default gen_random_uuid(),
  nome text not null,
  slug text not null,
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint projetos_pkey primary key (id),
  constraint projetos_slug_key unique (slug)
);

alter table public.projetos enable row level security;

create policy "auth read projetos"
on public.projetos
for select
to authenticated
using (true);

-- Id fixo desse projeto (hcm-ponto), combinado com o usuário.
insert into public.projetos (id, nome, slug, ativo)
values ('db9033c7-eea3-45e0-abcb-950b664aebe9', 'HCM Ponto', 'hcm-ponto', true);

-- Gate de acesso: só ativo=true + projeto_id certo entra no sistema, sem
-- mais distinção de nível de acesso. departamento continua em user_roles
-- (as políticas de RLS de pontos dependem dele) — não removido, só deixa de
-- ser a fonte usada pela tela pra mostrar/filtrar departamento.
alter table public.user_roles
add column ativo boolean not null default true,
add column projeto_id uuid references public.projetos (id);

update public.user_roles
set projeto_id = 'db9033c7-eea3-45e0-abcb-950b664aebe9'
where projeto_id is null;

create table public.funcionarios_hcm (
  id uuid not null default gen_random_uuid(),
  usuario_id uuid references auth.users (id) on delete set null,
  nome text not null,
  departamento text null,
  carga_horaria numeric null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint funcionarios_hcm_pkey primary key (id),
  constraint funcionarios_hcm_usuario_id_key unique (usuario_id)
);

alter table public.funcionarios_hcm enable row level security;

create policy "auth read funcionarios_hcm"
on public.funcionarios_hcm
for select
to authenticated
using (true);

-- Backfill: um funcionario_hcm por usuário já cadastrado, com o
-- departamento que hoje mora em user_roles. carga_horaria fica null (nunca
-- existiu antes) até alguém preencher.
insert into public.funcionarios_hcm (usuario_id, nome, departamento)
select user_id, nome, departamento from public.user_roles;
