// Helpers de data/hora fixados em America/Sao_Paulo, independente do fuso
// horário do dispositivo do usuário. O Brasil aboliu o horário de verão em
// 2019, então America/Sao_Paulo hoje é sempre UTC-3 — dá pra fazer a conta
// na mão sem precisar de Intl/timezone database.
export const TIME_ZONE = "America/Sao_Paulo";

// Data mais antiga selecionável nos filtros de período do app.
export const DATA_MINIMA_FILTRO = "2026-07-23";
const OFFSET_HORAS = 3;
const OFFSET_MS = OFFSET_HORAS * 60 * 60 * 1000;

// Colunas "timestamp without time zone" (ex.: pontos.registrado_em)
// voltam do Supabase sem Z/offset. Sem isso, o Date() do JS interpreta a
// string como hora LOCAL DO NAVEGADOR em vez de UTC — e como o Postgres
// aqui guarda esse valor em UTC, isso corrompe qualquer cálculo de fuso.
// Força "Z" quando a string não já tem um indicador de fuso.
const TEM_INDICADOR_DE_FUSO = /(Z|[+-]\d{2}(:?\d{2})?)$/;
function comoInstanteUTC(iso: string): Date {
  return new Date(TEM_INDICADOR_DE_FUSO.test(iso) ? iso : `${iso}Z`);
}

// Desloca o instante para que os getters UTC leiam o "relógio de parede" de SP.
function comoDataSaoPaulo(iso: string): Date {
  return new Date(comoInstanteUTC(iso).getTime() - OFFSET_MS);
}

// O dia desse evento vai até 03h da manhã: um registro às 01h30 ainda
// pertence ao dia anterior. Retorna a chave do dia operacional (YYYY-MM-DD).
export function chaveDiaOperacional(iso: string): string {
  const sp = comoDataSaoPaulo(iso);
  if (sp.getUTCHours() < 3) sp.setUTCDate(sp.getUTCDate() - 1);
  const ano = sp.getUTCFullYear();
  const mes = String(sp.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(sp.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function fmtDiaMes(chaveDia: string): string {
  const [, mes, dia] = chaveDia.split("-");
  return `${dia}/${mes}`;
}

export function fmtDataCompleta(chaveDia: string): string {
  const [ano, mes, dia] = chaveDia.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function fmtHoraSaoPaulo(iso: string): string {
  const sp = comoDataSaoPaulo(iso);
  const h = String(sp.getUTCHours()).padStart(2, "0");
  const m = String(sp.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// Início (ISO, em UTC real) do dia operacional atual — 03h00 em SP.
export function inicioDoDiaOperacionalISO(referencia: Date = new Date()): string {
  const sp = comoDataSaoPaulo(referencia.toISOString());
  if (sp.getUTCHours() < 3) sp.setUTCDate(sp.getUTCDate() - 1);
  sp.setUTCHours(3, 0, 0, 0);
  return new Date(sp.getTime() + OFFSET_MS).toISOString();
}

// Instante (ISO, em UTC real) em que começa às 03h00 de SP o dia operacional
// `chaveDia` (YYYY-MM-DD) + `diasSomados` dias. Usado para montar os limites
// gte/lt de uma consulta por período sem cortar registros da madrugada.
export function limiteDiaOperacional(chaveDia: string, diasSomados = 0): string {
  const [ano, mes, dia] = chaveDia.split("-").map(Number);
  const sp = new Date(Date.UTC(ano, mes - 1, dia + diasSomados, 3, 0, 0, 0));
  return new Date(sp.getTime() + OFFSET_MS).toISOString();
}

// Instante (ISO, em UTC real) de uma data (YYYY-MM-DD) + hora ("HH:mm") de
// parede em SP. Usado para lançar manualmente um registro com data/hora
// escolhidas pelo usuário.
export function instanteDeSaoPaulo(data: string, hora: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  const [h, m] = hora.split(":").map(Number);
  const sp = Date.UTC(ano, mes - 1, dia, h, m, 0, 0);
  return new Date(sp + OFFSET_MS).toISOString();
}

// Instante (ISO, em UTC real) de um horário ("HH:mm") dentro do dia
// operacional `diaOperacional` (YYYY-MM-DD, já considerando o corte das 3h).
// Um horário antes das 3h pertence, na data de calendário, ao dia seguinte
// (ex.: dia operacional 20/07 às 02h é, na data real, 21/07 02h) — ver
// chaveDiaOperacional acima, cuja regra esta função inverte.
export function instanteDoDiaOperacional(diaOperacional: string, hora: string): string {
  const [ano, mes, dia] = diaOperacional.split("-").map(Number);
  const [h, m] = hora.split(":").map(Number);
  const diasSomados = h < 3 ? 1 : 0;
  const sp = Date.UTC(ano, mes - 1, dia + diasSomados, h, m, 0, 0);
  return new Date(sp + OFFSET_MS).toISOString();
}

// Data (YYYY-MM-DD) e hora ("HH:mm") atuais no relógio de parede de SP.
export function dataHoraAtualSaoPaulo(): { data: string; hora: string } {
  const sp = comoDataSaoPaulo(new Date().toISOString());
  const ano = sp.getUTCFullYear();
  const mes = String(sp.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(sp.getUTCDate()).padStart(2, "0");
  const h = String(sp.getUTCHours()).padStart(2, "0");
  const m = String(sp.getUTCMinutes()).padStart(2, "0");
  return { data: `${ano}-${mes}-${dia}`, hora: `${h}:${m}` };
}

// Primeiro e último dia (YYYY-MM-DD) do mês atual no calendário de SP —
// usado como período padrão dos filtros de registros.
export function mesAtualSaoPaulo(): { inicio: string; fim: string } {
  const { data } = dataHoraAtualSaoPaulo();
  const [ano, mes] = data.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const mesStr = String(mes).padStart(2, "0");
  return {
    inicio: `${ano}-${mesStr}-01`,
    fim: `${ano}-${mesStr}-${String(ultimoDia).padStart(2, "0")}`,
  };
}
