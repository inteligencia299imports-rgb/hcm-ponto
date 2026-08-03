export const primeiroNome = (nome: string) => nome.split(" ")[0];

const CONECTIVOS_SOBRENOME = new Set(["de", "do", "da", "dos", "das"]);

// Primeiro nome + primeiro sobrenome (nomes do meio e demais sobrenomes são
// descartados), ignorando conectivos como "de"/"do"/"da"/"dos"/"das" na
// hora de achar o primeiro sobrenome de verdade.
export const primeiroNomeESobrenome = (nome: string) => {
  const normalized = nome.trim().replace(/\s+/g, " ");
  const partes = normalized.split(" ");
  if (partes.length <= 1) return normalized || "—";
  const primeiro = partes[0];
  let indiceSobrenome = 1;
  while (
    indiceSobrenome < partes.length - 1 &&
    CONECTIVOS_SOBRENOME.has(partes[indiceSobrenome].toLowerCase())
  ) {
    indiceSobrenome += 1;
  }
  const sobrenome = partes[indiceSobrenome];
  return `${primeiro} ${sobrenome}`;
};

const CONECTIVOS_NOME = new Set(["de", "do", "da", "dos", "das", "e"]);

// Deixa cada palavra com inicial maiúscula (conectivos como "de"/"do"/"da"
// ficam minúsculos, exceto quando são a primeira palavra). Preserva os
// espaços exatamente como digitados, pra servir de máscara em tempo real.
export const capitalizarNomeCompleto = (nome: string) =>
  nome
    .split(" ")
    .map((palavra, i) => {
      if (!palavra) return palavra;
      const minuscula = palavra.toLowerCase();
      if (i > 0 && CONECTIVOS_NOME.has(minuscula)) return minuscula;
      return minuscula.charAt(0).toUpperCase() + minuscula.slice(1);
    })
    .join(" ");

// Primeiro nome + inicial do primeiro sobrenome (mesma lógica de
// primeiroNomeESobrenome para achar o sobrenome, ignorando conectivos como
// "de"/"do"/"da"/"dos"/"das"), mas abreviado.
export const abreviarNomeCompleto = (nome: string) => {
  const normalized = nome.trim().replace(/\s+/g, " ");
  const partes = normalized.split(" ");
  if (partes.length <= 1) return normalized || "—";
  const primeiro = partes[0];
  let indiceSobrenome = 1;
  while (
    indiceSobrenome < partes.length - 1 &&
    CONECTIVOS_SOBRENOME.has(partes[indiceSobrenome].toLowerCase())
  ) {
    indiceSobrenome += 1;
  }
  const sobrenome = partes[indiceSobrenome];
  return `${primeiro} ${sobrenome.charAt(0).toUpperCase()}.`;
};
