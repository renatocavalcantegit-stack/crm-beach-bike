// Conversas do WhatsApp e do Instagram, dentro do CRM.
//
// O vendedor nunca sai do CRM: lê e responde aqui. O cliente continua no
// WhatsApp (ou Instagram) dele. No sistema real, enviar = chamar a WhatsApp
// Business API pelo servidor; receber = webhook. Aqui tudo fica no navegador
// e js/dados/whatsapp-simulado.js faz o papel do cliente.
//
// As regras (janela de 24 h, tamanho, modelos) estão em js/regras/conversas.js.

import { canalDaOrigem, preencherModelo, validarMensagem, verificarEnvioLivre } from '../regras/conversas.js';
import { aguardar, gerarId, gravar, ler } from './armazenamento.js';
import { buscarCliente } from './clientes.js';
import { buscarOportunidade, registrarContatoPorMensagem } from './oportunidades.js';
import { simularLadoDoCliente } from './whatsapp-simulado.js';

// ---------------------------------------------------------------------------
// Avisos de mudança: a tela se inscreve para redesenhar quando chega mensagem.
// No sistema real, isto vira uma conexão com o servidor (WebSocket ou SSE).

const inscritos = new Set();

/** callback({ tipo: 'nova' | 'status', mensagem }). Devolve a função para cancelar. */
export function acompanharConversas(callback) {
  inscritos.add(callback);
  return () => inscritos.delete(callback);
}

function avisar(tipo, mensagem) {
  for (const callback of inscritos) callback({ tipo, mensagem });
}

// ---------------------------------------------------------------------------
// Leitura

export async function listarMensagensDoCliente(idCliente) {
  await aguardar(60);
  return ler('mensagens', []).filter((mensagem) => mensagem.idCliente === idCliente);
}

/** Todas as mensagens agrupadas por cliente: { idCliente: [mensagens] }. Usado no funil e no Meu dia. */
export async function listarMensagensPorCliente() {
  await aguardar(60);
  const porCliente = {};
  for (const mensagem of ler('mensagens', [])) {
    (porCliente[mensagem.idCliente] ??= []).push(mensagem);
  }
  return porCliente;
}

export async function listarRespostasRapidas() {
  return ler('respostasRapidas', []);
}

export async function listarModelos() {
  return ler('modelos', []);
}

export async function listarCatalogo() {
  return ler('catalogo', []);
}

// ---------------------------------------------------------------------------
// Gravação

function adicionarMensagem(campos) {
  const mensagem = {
    id: gerarId('msg'),
    idVendedor: null,
    texto: '',
    foto: null,
    idModelo: null,
    enviadaEm: new Date().toISOString(),
    status: null,
    ...campos,
  };
  gravar('mensagens', [...ler('mensagens', []), mensagem]);
  avisar('nova', mensagem);
  return mensagem;
}

function alterarStatus(filtro, status) {
  const alteradas = [];
  const mensagens = ler('mensagens', []).map((mensagem) => {
    if (!filtro(mensagem) || mensagem.status === status || mensagem.status === 'lida') return mensagem;
    const alterada = { ...mensagem, status };
    alteradas.push(alterada);
    return alterada;
  });
  gravar('mensagens', mensagens);
  alteradas.forEach((mensagem) => avisar('status', mensagem));
}

/**
 * Mensagem que chega do cliente (ou da IA, ou um aviso do sistema).
 * Usada pela simulação e pela chegada de contatos (js/dados/atendimentos.js).
 */
export function registrarMensagemRecebida({ idCliente, canal, autor = 'cliente', texto, enviadaEm }) {
  return adicionarMensagem({ idCliente, canal, autor, texto, enviadaEm: enviadaEm ?? new Date().toISOString() });
}

/** O canal segue o da última mensagem do cliente; sem conversa ainda, vem da origem. */
async function descobrirCanal(oportunidade) {
  const mensagens = await listarMensagensDoCliente(oportunidade.idCliente);
  return mensagens.filter((m) => m.autor === 'cliente').pop()?.canal ?? canalDaOrigem(oportunidade.origem);
}

/** Passos comuns a todo envio da loja: grava, conta como contato e aciona o "cliente". */
async function enviarDaLoja(oportunidade, campos) {
  const canal = await descobrirCanal(oportunidade);
  if (!canal) throw new Error('Atendimento presencial não tem conversa');

  const mensagem = adicionarMensagem({
    idCliente: oportunidade.idCliente,
    canal,
    autor: 'vendedor',
    idVendedor: oportunidade.idVendedor,
    status: 'enviada',
    ...campos,
  });
  await registrarContatoPorMensagem(oportunidade.id);

  simularLadoDoCliente(oportunidade.idCliente, {
    aoEntregar: () => alterarStatus((m) => m.id === mensagem.id, 'entregue'),
    aoResponder: (texto) => {
      const daLoja = (m) => m.idCliente === oportunidade.idCliente && m.autor !== 'cliente' && m.status;
      alterarStatus(daLoja, 'lida');
      registrarMensagemRecebida({ idCliente: oportunidade.idCliente, canal, texto });
    },
  });
  return mensagem;
}

/** Só com a janela de 24 h aberta. Lança erro com a mensagem pronta para a tela. */
async function garantirJanelaAberta(idCliente) {
  const verificacao = verificarEnvioLivre(await listarMensagensDoCliente(idCliente), new Date());
  if (!verificacao.permitido) throw new Error(verificacao.erro);
}

export async function enviarMensagem(idOportunidade, texto) {
  const validacao = validarMensagem(texto);
  if (!validacao.valido) throw new Error(validacao.erro);

  const oportunidade = await buscarOportunidade(idOportunidade);
  await garantirJanelaAberta(oportunidade.idCliente);
  return enviarDaLoja(oportunidade, { texto: validacao.texto });
}

export async function enviarFoto(idOportunidade, idProduto) {
  const oportunidade = await buscarOportunidade(idOportunidade);
  await garantirJanelaAberta(oportunidade.idCliente);

  const produto = (await listarCatalogo()).find((item) => item.id === idProduto);
  if (!produto) throw new Error('Produto não encontrado no catálogo');
  return enviarDaLoja(oportunidade, { foto: { imagem: produto.imagem, legenda: produto.legenda } });
}

/** Modelo aprovado pela Meta: pode ser enviado mesmo com a janela fechada. */
export async function enviarModelo(idOportunidade, idModelo) {
  const oportunidade = await buscarOportunidade(idOportunidade);
  const modelo = (await listarModelos()).find((item) => item.id === idModelo);
  if (!modelo) throw new Error('Modelo não encontrado');

  const cliente = await buscarCliente(oportunidade.idCliente);
  const texto = preencherModelo(modelo.texto, { nomeCliente: cliente.nome, interesse: oportunidade.interesse });
  return enviarDaLoja(oportunidade, { texto, idModelo: modelo.id });
}
