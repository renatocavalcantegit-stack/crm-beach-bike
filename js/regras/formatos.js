// Formatos de exibição: dinheiro, telefone, datas e textos curtos.
//
// Arquivo PURO: só transforma valores em texto (e texto digitado em valor).
// Nenhuma função aqui acessa a tela ou o armazenamento.

import { diasEntre, paraData } from './datas.js';

const formatoMoedaInteira = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const formatoMoedaComCentavos = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * R$ 12.990 (padrão, para painéis) ou R$ 12.990,00 (com centavos: true).
 * Painéis mostram valor redondo porque o vendedor lê de relance.
 */
export function formatarMoeda(valor, { centavos = false } = {}) {
  const numero = Number(valor) || 0;
  return (centavos ? formatoMoedaComCentavos : formatoMoedaInteira).format(numero);
}

/**
 * Converte o que o vendedor digitou ("R$ 4.890,50", "4890", "4.890") em número.
 * Devolve null quando não dá para entender o texto.
 * No Brasil o ponto separa milhar e a vírgula separa centavos.
 */
export function converterTextoEmValor(texto) {
  if (typeof texto === 'number') return Number.isFinite(texto) ? texto : null;
  if (typeof texto !== 'string') return null;

  const limpo = texto.replace(/R\$/g, '').replace(/\s/g, '');
  if (!/^[\d.,]+$/.test(limpo)) return null;

  const semMilhar = limpo.replace(/\./g, '');
  const numero = Number(semMilhar.replace(',', '.'));
  return Number.isFinite(numero) ? numero : null;
}

/** Mantém só os dígitos de um telefone. */
export function somenteDigitos(texto) {
  return String(texto ?? '').replace(/\D/g, '');
}

/** (85) 98812-4410 para celular, (85) 3224-1010 para fixo. */
export function formatarTelefone(telefone) {
  const digitos = somenteDigitos(telefone);
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return String(telefone ?? '');
}

/** "Carla Menezes" → "CM"; "Ana" → "AN". Usado nos avatares. */
export function obterIniciais(nome) {
  const partes = String(nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** "Carla Menezes Albuquerque" → "Carla M." (nome curto para os cards). */
export function nomeCurto(nome) {
  const partes = String(nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes[0]} ${partes[1][0]}.`;
}

/** 13/11 */
export function formatarDiaMes(valor) {
  const data = paraData(valor);
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
}

/** 13/11/2026 */
export function formatarData(valor) {
  return `${formatarDiaMes(valor)}/${paraData(valor).getFullYear()}`;
}

/** 15:30 */
export function formatarHora(valor) {
  const data = paraData(valor);
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

/**
 * Tempo desde um acontecimento, do jeito que se fala na loja:
 * "agora", "há 12 min", "há 3 h", "ontem", "há 5 dias".
 */
export function descreverTempoDecorrido(desde, agora) {
  const minutos = Math.floor((paraData(agora) - paraData(desde)) / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;

  const dias = diasEntre(desde, agora);
  if (dias === 0) return `há ${Math.floor(minutos / 60)} h`;
  if (dias === 1) return 'ontem';
  return `há ${dias} dias`;
}

/** Separador de dia na conversa: "Hoje", "Ontem" ou "10/11". */
export function descreverDiaDaConversa(dia, agora) {
  const dias = diasEntre(dia, agora);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Ontem';
  return formatarDiaMes(dia);
}

/** Tempo que falta, para a janela de 24 h: "3 h 12 min", "45 min", "menos de 1 min". */
export function descreverTempoRestante(milissegundos) {
  const minutos = Math.floor(milissegundos / 60000);
  if (minutos < 1) return 'menos de 1 min';
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

/** "1 dia", "5 dias" — usado no alerta de tempo parado. */
export function descreverDias(dias) {
  return dias === 1 ? '1 dia' : `${dias} dias`;
}
