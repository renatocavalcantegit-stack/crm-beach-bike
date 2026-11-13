// Regras de datas usadas em todo o CRM.
//
// Arquivo PURO: não mexe na tela nem no armazenamento. Toda função recebe as
// datas como parâmetro (inclusive "agora"), para os testes poderem fixar o
// horário e o servidor poder reaproveitar o arquivo sem mudanças.
//
// Datas são guardadas como texto ISO (ex.: "2026-11-13T15:30:00.000Z") e
// comparadas no fuso do computador do usuário (Fortaleza, UTC-3).

const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

/** Aceita Date ou texto ISO e devolve sempre um Date. */
export function paraData(valor) {
  return valor instanceof Date ? valor : new Date(valor);
}

/** Meia-noite do mesmo dia (horário local). */
export function inicioDoDia(valor) {
  const data = paraData(valor);
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

/** Chave do dia no formato AAAA-MM-DD, usada para saber se a fila já é de hoje. */
export function chaveDoDia(valor) {
  const data = paraData(valor);
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function mesmoDia(a, b) {
  return chaveDoDia(a) === chaveDoDia(b);
}

export function mesmoMes(a, b) {
  const dataA = paraData(a);
  const dataB = paraData(b);
  return dataA.getFullYear() === dataB.getFullYear() && dataA.getMonth() === dataB.getMonth();
}

/**
 * Quantos dias de calendário separam duas datas.
 * Conta viradas de dia, não blocos de 24 h: um contato ontem às 23h, visto hoje
 * às 8h, já é "1 dia", que é como o vendedor pensa.
 */
export function diasEntre(inicio, fim) {
  const diferenca = inicioDoDia(fim) - inicioDoDia(inicio);
  return Math.round(diferenca / MILISSEGUNDOS_POR_DIA);
}

/** Verdadeiro se a pessoa faz aniversário no dia informado (ignora o ano). */
export function fazAniversarioNoDia(dataNascimento, dia) {
  if (!dataNascimento) return false;
  // A data de nascimento é só dia (AAAA-MM-DD); lemos os números direto para
  // não sofrer com fuso horário (new Date("1990-11-13") seria meia-noite UTC,
  // que em Fortaleza ainda é dia 12).
  const [, mes, diaDoMes] = dataNascimento.split('-').map(Number);
  const referencia = paraData(dia);
  return referencia.getMonth() + 1 === mes && referencia.getDate() === diaDoMes;
}

/** Idade que a pessoa completa no ano da data de referência. */
export function idadeQueCompleta(dataNascimento, referencia) {
  const ano = Number(dataNascimento.split('-')[0]);
  return paraData(referencia).getFullYear() - ano;
}
