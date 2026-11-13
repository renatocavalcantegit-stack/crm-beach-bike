// Oportunidades (cada cliente interessado em comprar algo).
//
// Toda mudança passa antes por uma regra de js/regras/funil.js. Se a regra não
// permitir, a função lança um erro com a mensagem pronta para mostrar na tela.

import { buscarEtapa, verificarGanho, verificarMudancaDeEtapa, verificarPerda } from '../regras/funil.js';
import { formatarMoeda } from '../regras/formatos.js';
import { validarRetorno, validarValor } from '../regras/validacoes.js';
import { aguardar, gerarId, gravar, ler } from './armazenamento.js';
import { registrarInteracao } from './interacoes.js';
import { concluirTarefasDaOportunidade, criarTarefa } from './tarefas.js';

export async function listarOportunidades() {
  await aguardar();
  return ler('oportunidades', []);
}

export async function buscarOportunidade(idOportunidade) {
  const oportunidades = await listarOportunidades();
  return oportunidades.find((oportunidade) => oportunidade.id === idOportunidade) ?? null;
}

export async function listarOportunidadesDoCliente(idCliente) {
  const oportunidades = await listarOportunidades();
  return oportunidades
    .filter((oportunidade) => oportunidade.idCliente === idCliente)
    .sort((a, b) => new Date(b.criadaEm) - new Date(a.criadaEm));
}

function atualizar(idOportunidade, alteracoes) {
  const oportunidades = ler('oportunidades', []);
  const atualizadas = oportunidades.map((oportunidade) =>
    oportunidade.id === idOportunidade ? { ...oportunidade, ...alteracoes } : oportunidade,
  );
  gravar('oportunidades', atualizadas);
  return atualizadas.find((oportunidade) => oportunidade.id === idOportunidade);
}

export async function criarOportunidade(dados) {
  const agora = new Date().toISOString();
  const oportunidade = {
    id: gerarId('op'),
    etapa: 'novo',
    valor: 0,
    resumoIa: null,
    transferidaPelaIaEm: null,
    transferenciaVista: true,
    fechadaEm: null,
    motivoPerda: null,
    criadaEm: agora,
    ultimoContatoEm: agora,
    ...dados,
  };
  gravar('oportunidades', [...ler('oportunidades', []), oportunidade]);
  return oportunidade;
}

/** Arrastar o card para outra coluna. "valorTexto" só é exigido quando a regra pede. */
export async function moverParaEtapa(idOportunidade, idEtapaDestino, valorTexto = null) {
  const oportunidade = await buscarOportunidade(idOportunidade);
  const verificacao = verificarMudancaDeEtapa(oportunidade, idEtapaDestino);
  if (!verificacao.permitido) throw new Error(verificacao.erro ?? 'Mudança não permitida');

  const alteracoes = { etapa: idEtapaDestino };
  if (verificacao.precisaValor) {
    const resultado = validarValor(valorTexto);
    if (!resultado.valido) throw new Error(resultado.erro);
    alteracoes.valor = resultado.valor;
  }

  const atualizada = atualizar(idOportunidade, alteracoes);
  const textoValor = atualizada.valor > 0 ? ` (${formatarMoeda(atualizada.valor)})` : '';
  await registrarInteracao({
    idCliente: atualizada.idCliente,
    idVendedor: atualizada.idVendedor,
    tipo: 'etapa',
    descricao: `Movido para ${buscarEtapa(idEtapaDestino).nome}${textoValor}`,
  });
  return atualizada;
}

export async function alterarValor(idOportunidade, valorTexto) {
  const resultado = validarValor(valorTexto);
  if (!resultado.valido) throw new Error(resultado.erro);
  return atualizar(idOportunidade, { valor: resultado.valor });
}

export async function marcarComoGanha(idOportunidade, valorTexto) {
  const oportunidade = await buscarOportunidade(idOportunidade);
  const verificacao = verificarGanho(oportunidade, valorTexto);
  if (!verificacao.permitido) throw new Error(verificacao.erro);

  const agora = new Date().toISOString();
  const atualizada = atualizar(idOportunidade, { etapa: 'ganho', valor: verificacao.valor, fechadaEm: agora, ultimoContatoEm: agora });
  await concluirTarefasDaOportunidade(idOportunidade);
  await registrarInteracao({
    idCliente: atualizada.idCliente,
    idVendedor: atualizada.idVendedor,
    tipo: 'fechamento',
    descricao: `Venda ganha: ${atualizada.interesse} (${formatarMoeda(atualizada.valor)})`,
  });
  return atualizada;
}

export async function marcarComoPerdida(idOportunidade, motivo) {
  const oportunidade = await buscarOportunidade(idOportunidade);
  const verificacao = verificarPerda(oportunidade, motivo);
  if (!verificacao.permitido) throw new Error(verificacao.erro);

  const atualizada = atualizar(idOportunidade, { etapa: 'perdido', motivoPerda: motivo, fechadaEm: new Date().toISOString() });
  await concluirTarefasDaOportunidade(idOportunidade);
  await registrarInteracao({
    idCliente: atualizada.idCliente,
    idVendedor: atualizada.idVendedor,
    tipo: 'fechamento',
    descricao: `Perdida: ${atualizada.interesse} — motivo: ${motivo}`,
  });
  return atualizada;
}

/**
 * O vendedor falou com o cliente. Isso zera o alerta de "dias sem contato",
 * conclui os retornos pendentes e, se ele quiser, agenda o próximo retorno.
 */
export async function registrarContato(idOportunidade, { anotacao, retorno }) {
  const validacao = validarRetorno(retorno ?? {}, new Date());
  if (!validacao.valido) throw new Error(validacao.erro);

  const atualizada = atualizar(idOportunidade, { ultimoContatoEm: new Date().toISOString(), transferenciaVista: true });
  await concluirTarefasDaOportunidade(idOportunidade);
  await registrarInteracao({
    idCliente: atualizada.idCliente,
    idVendedor: atualizada.idVendedor,
    tipo: 'contato',
    descricao: anotacao?.trim() || 'Contato com o cliente',
  });
  if (retorno?.dataHora) {
    await criarTarefa({
      idOportunidade,
      idCliente: atualizada.idCliente,
      idVendedor: atualizada.idVendedor,
      descricao: retorno.descricao.trim(),
      dataHora: new Date(retorno.dataHora).toISOString(),
    });
  }
  return atualizada;
}

/** O vendedor abriu a transferência da IA: sai do topo do "Meu dia". */
export async function marcarTransferenciaComoVista(idOportunidade) {
  return atualizar(idOportunidade, { transferenciaVista: true });
}

/** A IA transferiu de novo um atendimento que já estava aberto. */
export async function registrarNovaTransferenciaDaIa(idOportunidade, { resumoIa, valor }) {
  const alteracoes = { resumoIa, transferidaPelaIaEm: new Date().toISOString(), transferenciaVista: false, etapa: 'negociacao' };
  if (valor > 0) alteracoes.valor = valor;
  return atualizar(idOportunidade, alteracoes);
}
