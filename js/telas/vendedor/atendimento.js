// Tela de atendimento: abre por cima da mesa ao clicar num card, num item do
// "Meu dia" ou na busca. É onde o vendedor conversa com o cliente sem sair do CRM.
//
//   ┌ cabeçalho: cliente · etapa · valor · Registrar contato · Ganho · Perdido ┐
//   ├ conversa (mensagens + caixa de escrever)       │ lateral (IA, retorno…)  ┤
//   └─────────────────────────────────────────────────┴─────────────────────────┘
//
// Este arquivo COORDENA: busca os dados, decide o que mostrar e liga os botões.
// Quando chega mensagem nova, redesenha só a conversa (o rascunho fica).

import { buscarCliente, listarBicicletasDoCliente } from '../../dados/clientes.js';
import {
  acompanharConversas, enviarMensagem, enviarModelo, listarCatalogo, listarMensagensDoCliente, listarModelos, listarRespostasRapidas,
} from '../../dados/conversas.js';
import { listarInteracoesDoCliente } from '../../dados/interacoes.js';
import { listarOportunidadesDoCliente, marcarTransferenciaComoVista } from '../../dados/oportunidades.js';
import { listarTarefas } from '../../dados/tarefas.js';
import { listarVendedores } from '../../dados/vendedores.js';
import { calcularJanela, canalDaOrigem } from '../../regras/conversas.js';
import { estaAberta, foiTransferidaPelaIa } from '../../regras/funil.js';
import { mostrarErro } from '../../tela/avisos.js';
import { abrirGaveta, fecharGaveta } from '../../tela/camadas.js';
import { criar, substituirConteudo } from '../../tela/dom.js';
import { desenharCabecalho } from './atendimento-cabecalho.js';
import {
  criarRascunho, desenharAtendimentoPresencial, desenharCompositor, desenharConversaDeOutroVendedor, desenharMensagens,
} from './atendimento-conversa.js';
import { criarSecaoDeCompras, desenharLateral } from './atendimento-lateral.js';
import { abrirAgendamentoDeRetorno, abrirRegistroDeContato, confirmarGanho, confirmarPerda, escolherFotoDoCatalogo } from './modais.js';

// A contagem da janela de 24 h é atualizada a cada 30 segundos.
const INTERVALO_DO_RELOGIO_MS = 30000;

// Só um atendimento aberto por vez.
let atual = null;

/** Cliente do atendimento aberto agora (para a mesa não avisar do que já está na tela). */
export function idClienteDoAtendimentoAberto() {
  return atual?.idCliente ?? null;
}

/** Qual atendimento mostrar: o pedido, senão o aberto mais recente, senão o mais recente. */
function escolherOportunidade(oportunidades, idOportunidade) {
  return oportunidades.find((o) => o.id === idOportunidade) ?? oportunidades.find(estaAberta) ?? oportunidades[0] ?? null;
}

async function carregar(estado) {
  const oportunidades = await listarOportunidadesDoCliente(estado.idCliente);
  const [cliente, mensagens, vendedores] = await Promise.all([
    buscarCliente(estado.idCliente),
    listarMensagensDoCliente(estado.idCliente),
    listarVendedores(),
  ]);
  const oportunidade = escolherOportunidade(oportunidades, estado.idOportunidade);
  const canal = mensagens.filter((m) => m.autor === 'cliente').pop()?.canal ?? canalDaOrigem(oportunidade?.origem);
  return { cliente, oportunidade, mensagens, vendedores, canal, podeAgir: oportunidade?.idVendedor === estado.idVendedorAtual };
}

// ---------------------------------------------------------------------------
// Ações

/** Toda ação de modal (contato, ganho, perda, retorno) termina redesenhando a mesa e o atendimento. */
async function depoisDe(estado, acao) {
  try {
    if (!(await acao)) return;
    await estado.aoMudar();
    await redesenharTudo(estado);
  } catch (erro) {
    mostrarErro(erro);
  }
}

async function enviar(estado, envio) {
  if (estado.enviando) return;
  estado.enviando = true;
  try {
    await envio();
    await estado.aoMudar(); // a mensagem conta como contato: o card sai do alerta
    await Promise.all([redesenharCabecalho(estado), redesenharLateral(estado)]);
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    estado.enviando = false;
  }
}

function enviarRascunho(estado) {
  return enviar(estado, async () => {
    await enviarMensagem(estado.idOportunidade, estado.rascunho.value);
    estado.rascunho.value = '';
  });
}

// ---------------------------------------------------------------------------
// Desenho

async function redesenharCabecalho(estado) {
  const { cliente, oportunidade, canal, podeAgir } = await carregar(estado);
  estado.partes.cabecalho.replaceWith(
    (estado.partes.cabecalho = desenharCabecalho({
      cliente, oportunidade, canal, podeAgir, agora: new Date(),
      aoFechar: fecharGaveta,
      aoMudarEtapa: async (idEtapa) => {
        await estado.aoMudarEtapa(oportunidade.id, idEtapa);
        await redesenharCabecalho(estado);
      },
      aoRegistrarContato: () => depoisDe(estado, abrirRegistroDeContato(oportunidade)),
      aoGanhar: () => depoisDe(estado, confirmarGanho(oportunidade)),
      aoPerder: () => depoisDe(estado, confirmarPerda(oportunidade)),
    })),
  );
}

async function redesenharConversa(estado) {
  const { oportunidade, cliente, mensagens, vendedores, canal, podeAgir } = await carregar(estado);
  if (atual !== estado) return; // o atendimento foi fechado enquanto carregava
  const { mensagens: areaDasMensagens, compositor } = estado.partes;
  const agora = new Date();

  if (oportunidade && !podeAgir) {
    desenharConversaDeOutroVendedor(areaDasMensagens, vendedores.find((v) => v.id === oportunidade.idVendedor)?.nome ?? 'outro vendedor');
    compositor.replaceChildren();
    return;
  }
  if (!canal) {
    desenharAtendimentoPresencial(areaDasMensagens, {
      aoRegistrarContato: () => oportunidade && depoisDe(estado, abrirRegistroDeContato(oportunidade)),
    });
    compositor.replaceChildren();
    return;
  }

  desenharMensagens(areaDasMensagens, { mensagens, vendedores, agora });
  if (!oportunidade || !estaAberta(oportunidade)) {
    substituirConteudo(compositor, [criar('p', { classe: 'conversa-encerrada', texto: 'Atendimento fechado. Um novo contato do cliente abre um novo atendimento.' })]);
    return;
  }
  const [respostasRapidas, modelos] = await Promise.all([listarRespostasRapidas(), listarModelos()]);
  // Redesenhar tira o campo do lugar e o navegador tira o foco: devolvemos o foco depois.
  const estavaEscrevendo = document.activeElement === estado.rascunho;
  desenharCompositor(compositor, {
    canal, cliente, oportunidade, respostasRapidas, modelos,
    janela: calcularJanela(mensagens, agora),
    rascunho: estado.rascunho,
    aoEnviar: () => enviarRascunho(estado),
    aoEnviarModelo: (idModelo) => enviar(estado, () => enviarModelo(oportunidade.id, idModelo)),
    aoEscolherFoto: async () => depoisDeEnviarFoto(estado, oportunidade),
  });
  if (estavaEscrevendo && estado.rascunho.isConnected) estado.rascunho.focus();
}

async function depoisDeEnviarFoto(estado, oportunidade) {
  const enviou = await escolherFotoDoCatalogo(oportunidade, await listarCatalogo());
  if (!enviou) return;
  await estado.aoMudar();
  await Promise.all([redesenharCabecalho(estado), redesenharLateral(estado)]);
}

async function redesenharLateral(estado) {
  const { cliente, oportunidade } = await carregar(estado);
  const [bicicletas, interacoes, tarefas] = await Promise.all([
    listarBicicletasDoCliente(estado.idCliente),
    listarInteracoesDoCliente(estado.idCliente),
    listarTarefas(),
  ]);
  estado.partes.compras ??= criarSecaoDeCompras(cliente);
  estado.partes.lateral.replaceWith(
    (estado.partes.lateral = desenharLateral({
      oportunidade, bicicletas, interacoes, tarefas, agora: new Date(),
      secaoDeCompras: estado.partes.compras,
      aoAgendar: () => depoisDe(estado, abrirAgendamentoDeRetorno(oportunidade)),
    })),
  );
}

async function redesenharTudo(estado) {
  if (atual !== estado) return;
  estado.partes.cabecalho = criar('header');
  estado.partes.mensagens = criar('div', { classe: 'mensagens', atributos: { 'aria-live': 'polite' } });
  estado.partes.compositor = criar('div', { classe: 'compositor' });
  estado.partes.lateral = criar('div', { classe: 'lateral-do-atendimento' });

  substituirConteudo(estado.raiz, [
    estado.partes.cabecalho,
    criar('div', { classe: 'corpo-do-atendimento' }, [
      criar('div', { classe: 'coluna-da-conversa' }, [estado.partes.mensagens, estado.partes.compositor]),
      estado.partes.lateral,
    ]),
  ]);
  await Promise.all([redesenharCabecalho(estado), redesenharConversa(estado), redesenharLateral(estado)]);
}

// ---------------------------------------------------------------------------
// Abrir e fechar

function encerrar(estado) {
  estado.pararDeAcompanhar();
  clearInterval(estado.relogio);
  if (atual === estado) atual = null;
}

/**
 * Abre o atendimento de um cliente.
 *   aoMudar(): redesenha a mesa (funil, Meu dia) depois de qualquer mudança.
 *   aoMudarEtapa(idOportunidade, idEtapa): o mesmo que arrastar o card no funil.
 */
export async function abrirAtendimento({ idCliente, idOportunidade = null, idVendedorAtual, aoMudar, aoMudarEtapa }) {
  const raiz = criar('div', { classe: 'atendimento' }, [criar('div', { classe: 'carregando', texto: 'Abrindo atendimento…' })]);
  const estado = { idCliente, idOportunidade, idVendedorAtual, aoMudar, aoMudarEtapa, raiz, partes: {}, enviando: false };
  abrirGaveta(raiz, { classe: 'gaveta-larga', aoFechar: () => encerrar(estado) });
  atual = estado;

  estado.rascunho = criarRascunho(() => enviarRascunho(estado));
  estado.pararDeAcompanhar = acompanharConversas(({ mensagem }) => {
    if (mensagem.idCliente === idCliente) redesenharConversa(estado).catch(mostrarErro);
  });
  estado.relogio = setInterval(() => redesenharConversa(estado).catch(mostrarErro), INTERVALO_DO_RELOGIO_MS);

  // Abrir uma transferência da IA tira ela do topo do "Meu dia".
  const oportunidade = escolherOportunidade(await listarOportunidadesDoCliente(idCliente), idOportunidade);
  estado.idOportunidade = oportunidade?.id ?? null;
  if (oportunidade && oportunidade.idVendedor === idVendedorAtual && foiTransferidaPelaIa(oportunidade) && !oportunidade.transferenciaVista) {
    await marcarTransferenciaComoVista(oportunidade.id);
    await aoMudar();
  }
  await redesenharTudo(estado);
  if (estado.rascunho.isConnected) estado.rascunho.focus();
}
