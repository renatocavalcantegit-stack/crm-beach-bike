// SIMULAÇÃO do outro lado da conversa: o cliente no WhatsApp ou no Instagram.
//
// No sistema real, as mensagens chegam pelo webhook da WhatsApp Business API
// (e da API do Instagram) no servidor, que avisa a tela. Aqui, para a
// demonstração ter vida, o "cliente" responde alguns segundos depois que o
// vendedor manda algo.
//
// Este arquivo só cuida do relógio da simulação. Quem grava as mensagens é
// js/dados/conversas.js, que passa as funções de gravar como parâmetro (assim
// os dois arquivos não dependem um do outro).

import { RESPOSTAS_SIMULADAS_DO_CLIENTE } from '../demo/dados-demo.js';

const ESPERA_PARA_ENTREGAR_MS = 1200;
const ESPERA_MINIMA_PARA_RESPONDER_MS = 4000;
const ESPERA_MAXIMA_PARA_RESPONDER_MS = 6000;

// Um cronômetro por cliente: se o vendedor manda outra mensagem antes da
// resposta chegar, o "cliente" espera ele terminar de escrever.
const respostasAgendadas = new Map();
let proximaResposta = 0;

function sortearEspera() {
  const variacao = ESPERA_MAXIMA_PARA_RESPONDER_MS - ESPERA_MINIMA_PARA_RESPONDER_MS;
  return ESPERA_MINIMA_PARA_RESPONDER_MS + Math.round(Math.random() * variacao);
}

/** As respostas vão em sequência, para a demonstração não repetir a mesma frase. */
function escolherResposta() {
  const texto = RESPOSTAS_SIMULADAS_DO_CLIENTE[proximaResposta % RESPOSTAS_SIMULADAS_DO_CLIENTE.length];
  proximaResposta += 1;
  return texto;
}

/**
 * Depois que a loja envia uma mensagem:
 *   1. ela vira "entregue" pouco depois;
 *   2. alguns segundos depois o cliente lê e responde.
 */
export function simularLadoDoCliente(idCliente, { aoEntregar, aoResponder }) {
  setTimeout(aoEntregar, ESPERA_PARA_ENTREGAR_MS);

  clearTimeout(respostasAgendadas.get(idCliente));
  const cronometro = setTimeout(() => {
    respostasAgendadas.delete(idCliente);
    aoResponder(escolherResposta());
  }, sortearEspera());
  respostasAgendadas.set(idCliente, cronometro);
}
