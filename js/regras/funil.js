// Regras do funil de vendas: etapas, mudanças de etapa, fechamento e alertas.
//
// Arquivo PURO. Recebe oportunidades como objetos simples e devolve decisões
// ("pode mover?", "está parada?"). Quem grava o resultado é a camada de dados.

import { diasEntre } from './datas.js';
import { validarValor } from './validacoes.js';

/**
 * Etapas abertas, na ordem em que aparecem no quadro.
 * "exigeValor": a partir do orçamento o vendedor já sabe quanto o cliente vai
 * gastar, e o valor alimenta o "valor em jogo" do painel.
 */
export const ETAPAS = [
  { id: 'novo', nome: 'Novo', exigeValor: false },
  { id: 'atendendo', nome: 'Atendendo', exigeValor: false },
  { id: 'orcamento', nome: 'Orçamento', exigeValor: true },
  { id: 'negociacao', nome: 'Negociação', exigeValor: true },
];

/** Etapas finais: só se chega nelas pelos botões Ganho e Perdido. */
export const ETAPAS_FINAIS = ['ganho', 'perdido'];

export const MOTIVOS_DE_PERDA = [
  'Preço',
  'Sem estoque',
  'Comprou em outra loja',
  'Desistiu',
  'Sem retorno',
];

export const ORIGENS = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  loja: 'Loja',
  ia: 'Assistente IA',
};

/** Dias sem contato para o card ficar em alerta (combinado com a loja: 3). */
export const DIAS_PARA_ALERTA_PADRAO = 3;

export function buscarEtapa(idEtapa) {
  return ETAPAS.find((etapa) => etapa.id === idEtapa) ?? null;
}

export function estaAberta(oportunidade) {
  return !ETAPAS_FINAIS.includes(oportunidade.etapa);
}

/**
 * A IA passou este atendimento para um vendedor (o cliente quer negociar)?
 * Não usamos a "origem" para isso: um cliente que chegou pelo Instagram pode,
 * dias depois, conversar com a IA e ser transferido.
 */
export function foiTransferidaPelaIa(oportunidade) {
  return Boolean(oportunidade.transferidaPelaIaEm);
}

/**
 * Pode mover a oportunidade para outra etapa aberta?
 * Se a etapa de destino exige valor e a oportunidade ainda não tem, a tela
 * precisa perguntar o valor antes (precisaValor: true).
 */
export function verificarMudancaDeEtapa(oportunidade, idEtapaDestino) {
  if (!estaAberta(oportunidade)) {
    return { permitido: false, erro: 'Esta oportunidade já foi fechada' };
  }
  const destino = buscarEtapa(idEtapaDestino);
  if (!destino) {
    return { permitido: false, erro: 'Para fechar, use os botões Ganho ou Perdido' };
  }
  if (destino.id === oportunidade.etapa) return { permitido: false, erro: null };

  const temValor = Number(oportunidade.valor) > 0;
  return { permitido: true, precisaValor: destino.exigeValor && !temValor };
}

/** Marcar como ganho: precisa de um valor maior que zero, que conta na meta. */
export function verificarGanho(oportunidade, valorInformado) {
  if (!estaAberta(oportunidade)) return { permitido: false, erro: 'Esta oportunidade já foi fechada' };
  const resultado = validarValor(valorInformado);
  if (!resultado.valido) return { permitido: false, erro: resultado.erro };
  return { permitido: true, valor: resultado.valor };
}

/** Marcar como perdido: o motivo é obrigatório para a loja entender as perdas. */
export function verificarPerda(oportunidade, motivo) {
  if (!estaAberta(oportunidade)) return { permitido: false, erro: 'Esta oportunidade já foi fechada' };
  if (!MOTIVOS_DE_PERDA.includes(motivo)) return { permitido: false, erro: 'Escolha o motivo da perda' };
  return { permitido: true };
}

export function diasSemContato(oportunidade, agora) {
  return diasEntre(oportunidade.ultimoContatoEm, agora);
}

/** Card em alerta: aberto e sem contato há "diasLimite" dias ou mais. */
export function estaParada(oportunidade, agora, diasLimite = DIAS_PARA_ALERTA_PADRAO) {
  return estaAberta(oportunidade) && diasSemContato(oportunidade, agora) >= diasLimite;
}

/**
 * Separa as oportunidades abertas por etapa, para montar as colunas do quadro.
 * Dentro de cada coluna, quem está há mais tempo sem contato vem primeiro:
 * é quem mais precisa de atenção.
 */
export function agruparPorEtapa(oportunidades) {
  const colunas = Object.fromEntries(ETAPAS.map((etapa) => [etapa.id, []]));
  for (const oportunidade of oportunidades) {
    if (colunas[oportunidade.etapa]) colunas[oportunidade.etapa].push(oportunidade);
  }
  for (const lista of Object.values(colunas)) {
    lista.sort((a, b) => new Date(a.ultimoContatoEm) - new Date(b.ultimoContatoEm));
  }
  return colunas;
}

/** Soma do que está em aberto ("valor em jogo"). */
export function somarValorEmAberto(oportunidades) {
  return oportunidades
    .filter(estaAberta)
    .reduce((total, oportunidade) => total + (Number(oportunidade.valor) || 0), 0);
}
