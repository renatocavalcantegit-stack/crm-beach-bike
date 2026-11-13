// Lista da vez: como cada contato novo é distribuído entre os vendedores.
//
// A loja não tem carteira de clientes. Para ser justo, quem recebe o próximo
// contato é o primeiro disponível da fila, que depois vai para o fim.
//
// Arquivo PURO: toda função recebe a fila e devolve uma fila NOVA (nunca altera
// a recebida). Assim a camada de dados decide quando gravar, e os testes ficam simples.
//
// Formato da fila:
//   { data: '2026-11-13', ordem: ['joao', 'maria', 'pedro'],
//     situacao: { joao: 'disponivel', maria: 'pausa', pedro: 'ausente' } }

import { chaveDoDia } from './datas.js';
import { estaAberta } from './funil.js';

export const SITUACOES = {
  disponivel: 'Na fila',
  pausa: 'Em pausa',
  ausente: 'Ausente',
};

/** Regras que o gerente poderá mudar numa tela própria, mais tarde. */
export const CONFIGURACAO_PADRAO = {
  // Canais cujos contatos entram na fila.
  canaisNaFila: ['whatsapp', 'instagram', 'ia'],
  // Cliente atendido no balcão fica com quem o recebeu e conta como a vez dele.
  balcaoContaComoVez: true,
};

function copiarFila(fila) {
  return { data: fila.data, ordem: [...fila.ordem], situacao: { ...fila.situacao } };
}

/**
 * A fila vale por um dia. No primeiro acesso do dia todos começam "ausentes"
 * e cada vendedor marca presença ao chegar. A ordem do dia anterior é mantida
 * só como ponto de partida.
 */
export function prepararFilaDoDia(fila, hoje) {
  const chave = chaveDoDia(hoje);
  if (fila.data === chave) return fila;
  const situacao = Object.fromEntries(fila.ordem.map((id) => [id, 'ausente']));
  return { data: chave, ordem: [...fila.ordem], situacao };
}

/** Coloca o vendedor no fim da fila. */
export function passarAVez(fila, idVendedor) {
  const nova = copiarFila(fila);
  nova.ordem = nova.ordem.filter((id) => id !== idVendedor).concat(idVendedor);
  return nova;
}

/** Quem chega entra no fim da fila: quem já estava esperando não perde a vez. */
export function marcarPresenca(fila, idVendedor) {
  const nova = passarAVez(fila, idVendedor);
  nova.situacao[idVendedor] = 'disponivel';
  return nova;
}

/** Pausa (almoço, atendimento demorado): é pulado, mas mantém a posição. */
export function pausar(fila, idVendedor) {
  const nova = copiarFila(fila);
  nova.situacao[idVendedor] = 'pausa';
  return nova;
}

export function voltarDaPausa(fila, idVendedor) {
  const nova = copiarFila(fila);
  nova.situacao[idVendedor] = 'disponivel';
  return nova;
}

/** Vendedores disponíveis, na ordem da vez. */
export function listarDisponiveis(fila) {
  return fila.ordem.filter((id) => fila.situacao[id] === 'disponivel');
}

export function proximoDaVez(fila) {
  return listarDisponiveis(fila)[0] ?? null;
}

/** Posição do vendedor entre os disponíveis (1 = é a vez dele). Null se não está na fila. */
export function posicaoNaVez(fila, idVendedor) {
  const indice = listarDisponiveis(fila).indexOf(idVendedor);
  return indice === -1 ? null : indice + 1;
}

/** Vendedor da oportunidade mais recente do cliente (aberta ou fechada). */
function ultimoVendedorQueAtendeu(oportunidadesDoCliente) {
  const maisRecente = [...oportunidadesDoCliente].sort((a, b) => new Date(b.criadaEm) - new Date(a.criadaEm))[0];
  return maisRecente?.idVendedor ?? null;
}

/**
 * Decide quem atende um contato novo. A ordem das regras importa:
 *
 *   1. Cliente que chegou na loja (e o balcão não entra na fila): fica com quem o recebeu.
 *   2. Cliente com oportunidade aberta: volta para o mesmo vendedor, que já conhece a conversa.
 *   3. Transferência da IA de cliente que já foi atendido: vai para quem já atendeu.
 *   4. Todos os outros: o próximo da vez.
 *
 * "contaComoVez" diz se o vendedor deve ir para o fim da fila. Nos casos 2 e 3 não
 * conta: o cliente voltou para quem já cuidava dele, não é um contato "sorteado".
 */
export function decidirResponsavel({ origem, idCliente, oportunidades, fila, configuracao = CONFIGURACAO_PADRAO, idVendedorDoBalcao = null }) {
  const entraNaFila = configuracao.canaisNaFila.includes(origem);

  if (!entraNaFila && idVendedorDoBalcao) {
    return { idVendedor: idVendedorDoBalcao, motivo: 'balcao', contaComoVez: configuracao.balcaoContaComoVez };
  }

  const doCliente = idCliente ? oportunidades.filter((oportunidade) => oportunidade.idCliente === idCliente) : [];
  const aberta = doCliente.find(estaAberta);
  if (aberta) {
    return { idVendedor: aberta.idVendedor, motivo: 'oportunidade_aberta', contaComoVez: false };
  }

  if (origem === 'ia' && doCliente.length > 0) {
    return { idVendedor: ultimoVendedorQueAtendeu(doCliente), motivo: 'ja_atendeu', contaComoVez: false };
  }

  const proximo = proximoDaVez(fila);
  if (!proximo) return { idVendedor: null, motivo: 'ninguem_disponivel', contaComoVez: false };
  return { idVendedor: proximo, motivo: 'fila', contaComoVez: true };
}

/** Frase curta explicando a decisão, para o aviso na tela. */
export function explicarMotivo(motivo) {
  const textos = {
    balcao: 'atendimento no balcão',
    oportunidade_aberta: 'o cliente já tinha um atendimento aberto',
    ja_atendeu: 'quem já atendeu este cliente',
    fila: 'pela ordem da fila',
    ninguem_disponivel: 'nenhum vendedor disponível na fila',
  };
  return textos[motivo] ?? motivo;
}
