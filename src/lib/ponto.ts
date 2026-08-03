import type { PontoRegistro, TipoPonto } from "@/integrations/external-supabase/client";
import { chaveDiaOperacional } from "@/lib/tempo";

export type RegistroPontoSimples = { tipo: TipoPonto; registrado_em: string };

export type LinhaPonto = {
  userId: string;
  nome: string;
  dia: string;
  entrada: string | null;
  intervalo: string | null;
  retorno: string | null;
  saida: string | null;
  msTrabalhados: number;
  latitude: number | null;
  longitude: number | null;
};

// Agrupa registros de ponto por colaborador+dia, resolvendo o horário de
// cada tipo de batida e o total trabalhado no dia.
export function agruparPontosPorDia(pontos: PontoRegistro[]): LinhaPonto[] {
  const porGrupo = new Map<string, { nome: string; dia: string; registros: PontoRegistro[] }>();
  for (const p of pontos) {
    const dia = chaveDiaOperacional(p.registrado_em);
    const chave = `${p.user_id}|${dia}`;
    const grupo = porGrupo.get(chave) ?? { nome: p.nome_vendedor, dia, registros: [] };
    grupo.registros.push(p);
    porGrupo.set(chave, grupo);
  }

  return [...porGrupo.values()]
    .map((grupo) => {
      const porTipo: Partial<Record<TipoPonto, PontoRegistro>> = {};
      for (const r of grupo.registros) porTipo[r.tipo] = r;
      const comLocalizacao = grupo.registros.find(
        (r) => r.latitude !== null && r.longitude !== null,
      );
      return {
        userId: grupo.registros[0].user_id,
        nome: grupo.nome,
        dia: grupo.dia,
        entrada: porTipo.entrada?.registrado_em ?? null,
        intervalo: porTipo.intervalo?.registrado_em ?? null,
        retorno: porTipo.retorno?.registrado_em ?? null,
        saida: porTipo.saida?.registrado_em ?? null,
        msTrabalhados: calcularMsTrabalhados(grupo.registros),
        latitude: comLocalizacao?.latitude ?? null,
        longitude: comLocalizacao?.longitude ?? null,
      };
    })
    .sort((a, b) => b.dia.localeCompare(a.dia) || a.nome.localeCompare(b.nome));
}

// Soma o tempo entre entrada e saída, descontando qualquer intervalo
// (intervalo -> retorno) registrado no meio. `registros` deve estar
// ordenado por registrado_em ascendente. Retorna milissegundos.
export function calcularMsTrabalhados(registros: RegistroPontoSimples[]): number {
  let entradaTs: number | null = null;
  let intervaloTs: number | null = null;
  let totalMs = 0;
  for (const r of registros) {
    const t = new Date(r.registrado_em).getTime();
    if (r.tipo === "entrada") {
      entradaTs = t;
    } else if (r.tipo === "intervalo") {
      intervaloTs = t;
    } else if (r.tipo === "retorno" && intervaloTs !== null) {
      totalMs -= t - intervaloTs;
      intervaloTs = null;
    } else if (r.tipo === "saida" && entradaTs !== null) {
      totalMs += t - entradaTs;
      entradaTs = null;
    }
  }
  return totalMs;
}

export function fmtDuracaoHoras(horas: number) {
  const totalMin = Math.round(horas * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
