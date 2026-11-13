// Tela do vendedor ("Minha mesa").
//
// Este arquivo só COORDENA: busca os dados (js/dados/), passa pelas regras
// (js/regras/) e manda cada parte da tela se desenhar (js/telas/vendedor/).
// Não há cálculo nem acesso ao armazenamento aqui.

import { receberContato } from '../dados/atendimentos.js';
import { listarClientes } from '../dados/clientes.js';
import { acompanharConversas, listarMensagensPorCliente } from '../dados/conversas.js';
import * as fila from '../dados/fila.js';
import { garantirDadosIniciais, restaurarDemonstracao } from '../dados/inicializacao.js';
import { buscarOportunidade, listarOportunidades, moverParaEtapa } from '../dados/oportunidades.js';
import { obterIdVendedorAtual, salvarIdVendedorAtual } from '../dados/preferencias.js';
import { obterUltimaSincronizacao } from '../dados/sankhya-simulado.js';
import { listarTarefas } from '../dados/tarefas.js';
import { listarVendedores } from '../dados/vendedores.js';
import { CONTATOS_SIMULADOS } from '../demo/dados-demo.js';
import { explicarMotivo } from '../regras/distribuicao.js';
import { DIAS_PARA_ALERTA_PADRAO, estaAberta, verificarMudancaDeEtapa } from '../regras/funil.js';
import { previaDaMensagem } from '../regras/conversas.js';
import { nomeCurto } from '../regras/formatos.js';
import { calcularIndicadores } from '../regras/metas.js';
import { montarMeuDia } from '../regras/meu-dia.js';
import { mostrarAviso, mostrarErro } from '../tela/avisos.js';
import { iniciarTema } from '../tela/tema.js';
import { desenharFaixaDaVez } from './vendedor/faixa-da-vez.js';
import { desenharFerramentasDemo } from './vendedor/ferramentas-demo.js';
import { desenharFunil } from './vendedor/funil.js';
import { desenharIndicadores } from './vendedor/indicadores.js';
import { desenharMeuDia } from './vendedor/meu-dia.js';
import { abrirNovoAtendimento, perguntarValorEMover } from './vendedor/modais.js';
import { abrirAtendimento, idClienteDoAtendimentoAberto } from './vendedor/atendimento.js';
import { desenharSaudacao, desenharSincronizacao, desenharUsuario, ligarBusca } from './vendedor/topo.js';

const elementos = {
  saudacao: document.getElementById('saudacao'),
  usuario: document.getElementById('usuario'),
  sincronizacao: document.getElementById('sincronizacao'),
  faixaDaVez: document.getElementById('faixa-da-vez'),
  indicadores: document.getElementById('indicadores'),
  meuDia: document.getElementById('meu-dia'),
  funil: document.getElementById('funil'),
  ferramentasDemo: document.getElementById('ferramentas-demo'),
};

// Próximo contato simulado (circula pela lista de CONTATOS_SIMULADOS).
let indiceDoProximoContato = 0;
// Enquanto um contato simulado chega, o aviso é o da distribuição, não o de "mensagem nova".
let recebendoContato = false;

async function carregarDados() {
  const [vendedores, clientes, oportunidades, tarefas, filaDoDia, ultimaSincronizacao, mensagensPorCliente] = await Promise.all([
    listarVendedores(),
    listarClientes(),
    listarOportunidades(),
    listarTarefas(),
    fila.obterFilaDoDia(),
    obterUltimaSincronizacao(),
    listarMensagensPorCliente(),
  ]);
  const idVendedorAtual = obterIdVendedorAtual();
  const vendedor = vendedores.find((v) => v.id === idVendedorAtual) ?? vendedores[0];
  return { vendedores, clientes, oportunidades, tarefas, filaDoDia, ultimaSincronizacao, mensagensPorCliente, vendedor };
}

/** Redesenha a tela inteira. Simples e previsível: toda ação termina aqui. */
async function atualizarTela() {
  const dados = await carregarDados();
  const { vendedor } = dados;
  const agora = new Date();

  desenharSaudacao(elementos.saudacao, vendedor, agora);
  desenharUsuario(elementos.usuario, vendedor);
  desenharSincronizacao(elementos.sincronizacao, dados.ultimaSincronizacao, agora);

  desenharFaixaDaVez(elementos.faixaDaVez, {
    fila: dados.filaDoDia,
    vendedores: dados.vendedores,
    idVendedorAtual: vendedor.id,
    aoAlterarSituacao: (acao) => alterarMinhaSituacao(vendedor.id, acao),
  });

  desenharIndicadores(elementos.indicadores, calcularIndicadores({ ...dados, vendedor, agora }));

  desenharMeuDia(elementos.meuDia, {
    itens: montarMeuDia({ ...dados, idVendedor: vendedor.id, agora }),
    clientes: dados.clientes,
    agora,
    aoAbrirItem: (item) => abrirCliente(item.idCliente, item.idOportunidade),
  });

  desenharFunil(elementos.funil, {
    oportunidades: dados.oportunidades.filter((o) => o.idVendedor === vendedor.id && estaAberta(o)),
    clientes: dados.clientes,
    mensagensPorCliente: dados.mensagensPorCliente,
    agora,
    diasParaAlerta: DIAS_PARA_ALERTA_PADRAO,
    aoAbrir: (oportunidade) => abrirCliente(oportunidade.idCliente, oportunidade.id),
    aoMover: moverCard,
  });

  desenharFerramentasDemo(elementos.ferramentasDemo, {
    vendedores: dados.vendedores,
    idVendedorAtual: vendedor.id,
    aoTrocarVendedor: async (idVendedor) => {
      salvarIdVendedorAtual(idVendedor);
      await atualizarTela();
    },
    aoSimularContato: simularContato,
    aoRestaurar: restaurar,
  });
}

function abrirCliente(idCliente, idOportunidade = null) {
  return abrirAtendimento({
    idCliente,
    idOportunidade,
    idVendedorAtual: obterIdVendedorAtual(),
    aoMudar: atualizarTela,
    aoMudarEtapa: moverCard,
  }).catch(mostrarErro);
}

/**
 * Cliente mandou mensagem: atualiza a mesa (contador no card, "Meu dia") e,
 * se o atendimento dele não está aberto na tela, avisa o vendedor.
 */
let atualizacaoPendente = null;
function atualizarEmSeguida() {
  clearTimeout(atualizacaoPendente);
  atualizacaoPendente = setTimeout(() => atualizarTela().catch(mostrarErro), 150);
}

async function aoChegarMensagem({ tipo, mensagem }) {
  if (tipo !== 'nova' || mensagem.autor !== 'cliente' || recebendoContato) return;
  atualizarEmSeguida();
  if (idClienteDoAtendimentoAberto() === mensagem.idCliente) return;

  const oportunidades = await listarOportunidades();
  const minha = oportunidades.find((o) => o.idCliente === mensagem.idCliente && estaAberta(o) && o.idVendedor === obterIdVendedorAtual());
  if (!minha) return; // conversa de outro vendedor: só ele é avisado
  const cliente = (await listarClientes()).find((c) => c.id === mensagem.idCliente);
  mostrarAviso({ titulo: `${nomeCurto(cliente?.nome ?? 'Cliente')} respondeu`, texto: previaDaMensagem(mensagem, 80), nomeIcone: 'message-circle' });
}

async function moverCard(idOportunidade, idEtapa) {
  try {
    const oportunidade = await buscarOportunidade(idOportunidade);
    const verificacao = verificarMudancaDeEtapa(oportunidade, idEtapa);
    if (!verificacao.permitido) {
      if (verificacao.erro) mostrarErro(new Error(verificacao.erro));
      return;
    }
    if (verificacao.precisaValor) {
      if (!(await perguntarValorEMover(oportunidade, idEtapa))) return;
    } else {
      await moverParaEtapa(idOportunidade, idEtapa);
    }
    await atualizarTela();
  } catch (erro) {
    mostrarErro(erro);
  }
}

async function alterarMinhaSituacao(idVendedor, acao) {
  const acoes = { presenca: fila.marcarPresenca, pausa: fila.pausar, voltar: fila.voltarDaPausa };
  await acoes[acao](idVendedor);
  await atualizarTela();
}

async function avisarSobreDistribuicao({ cliente, oportunidade, decisao }) {
  const vendedores = await listarVendedores();
  const responsavel = vendedores.find((v) => v.id === decisao.idVendedor);
  const souEu = decisao.idVendedor === obterIdVendedorAtual();

  if (!responsavel) {
    mostrarAviso({ titulo: 'Contato sem vendedor', texto: `${cliente.nome}: ${explicarMotivo(decisao.motivo)}.`, tipo: 'erro', nomeIcone: 'user-off' });
    return;
  }
  mostrarAviso({
    titulo: souEu ? `Novo contato para você: ${nomeCurto(cliente.nome)}` : `${nomeCurto(cliente.nome)} foi para ${responsavel.nome.split(' ')[0]}`,
    texto: `${oportunidade?.interesse ?? ''} — ${explicarMotivo(decisao.motivo)}.`,
    tipo: oportunidade?.transferidaPelaIaEm ? 'tecnologia' : 'padrao',
    nomeIcone: oportunidade?.transferidaPelaIaEm ? 'sparkles' : 'user-plus',
  });
}

async function simularContato() {
  const contato = CONTATOS_SIMULADOS[indiceDoProximoContato % CONTATOS_SIMULADOS.length];
  indiceDoProximoContato += 1;
  recebendoContato = true;
  try {
    const resultado = await receberContato(contato);
    await atualizarTela();
    await avisarSobreDistribuicao(resultado);
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    recebendoContato = false;
  }
}

async function novoAtendimento() {
  const resultado = await abrirNovoAtendimento(obterIdVendedorAtual());
  if (!resultado) return;
  await atualizarTela();
  await avisarSobreDistribuicao(resultado);
}

async function restaurar() {
  if (!window.confirm('Voltar todos os dados para a demonstração original? O que foi feito até agora será apagado.')) return;
  await restaurarDemonstracao();
  indiceDoProximoContato = 0;
  await atualizarTela();
  mostrarAviso({ titulo: 'Demonstração restaurada', nomeIcone: 'refresh' });
}

async function iniciar() {
  iniciarTema(document.getElementById('botao-tema'));
  await garantirDadosIniciais();
  ligarBusca({
    campo: document.getElementById('campo-busca'),
    resultados: document.getElementById('resultados-busca'),
    aoEscolherCliente: (cliente) => abrirCliente(cliente.id),
  });
  document.getElementById('botao-novo-atendimento').addEventListener('click', () => novoAtendimento().catch(mostrarErro));
  acompanharConversas((evento) => aoChegarMensagem(evento).catch(mostrarErro));
  await atualizarTela();
  document.documentElement.classList.remove('iniciando');

  // Atualiza tempos ("há 12 min") e alertas a cada minuto.
  setInterval(() => atualizarTela().catch(mostrarErro), 60000);
}

iniciar().catch((erro) => {
  document.documentElement.classList.remove('iniciando');
  mostrarErro(erro);
});
