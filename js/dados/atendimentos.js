// Chegada de um contato novo: decide o vendedor e cria (ou reaproveita) a oportunidade.
//
// No sistema real isto roda no servidor, disparado pelo webhook do WhatsApp,
// pela IA ou pelo botão "Novo atendimento". A decisão de QUEM atende está em
// js/regras/distribuicao.js; aqui juntamos os passos e gravamos.

import { decidirResponsavel, explicarMotivo } from '../regras/distribuicao.js';
import { ORIGENS } from '../regras/funil.js';
import { buscarCliente, buscarClientePorTelefone, criarCliente } from './clientes.js';
import { obterConfiguracaoDaDistribuicao, obterFilaDoDia, passarAVez } from './fila.js';
import { registrarInteracao } from './interacoes.js';
import { criarOportunidade, listarOportunidades, registrarNovaTransferenciaDaIa } from './oportunidades.js';
import { criarTarefa } from './tarefas.js';

/** Encontra o cliente pelo id ou telefone; se não existir, cadastra. */
async function obterOuCriarCliente({ idClienteExistente, nome, telefone, bairro }) {
  if (idClienteExistente) return buscarCliente(idClienteExistente);
  return (await buscarClientePorTelefone(telefone)) ?? criarCliente({ nome, telefone, bairro });
}

/**
 * Cliente que já tinha atendimento aberto voltou a chamar: em vez de duplicar
 * a oportunidade, avisamos o vendedor com um retorno para daqui a 15 minutos.
 */
async function avisarSobreAtendimentoAberto(aberta, contato) {
  if (contato.origem === 'ia') {
    await registrarNovaTransferenciaDaIa(aberta.id, { resumoIa: contato.resumoIa, valor: contato.valor });
    return;
  }
  await criarTarefa({
    idOportunidade: aberta.id,
    idCliente: aberta.idCliente,
    idVendedor: aberta.idVendedor,
    descricao: `Responder: ${contato.interesse}`,
    dataHora: new Date(Date.now() + 15 * 60000).toISOString(),
  });
}

/**
 * Recebe um contato e devolve { cliente, oportunidade, decisao }.
 * contato: { origem, interesse, nome?, telefone?, bairro?, idClienteExistente?, valor?, resumoIa? }
 * idVendedorDoBalcao: quem clicou em "Novo atendimento" (cliente na loja).
 */
export async function receberContato(contato, idVendedorDoBalcao = null) {
  const cliente = await obterOuCriarCliente(contato);
  const oportunidades = await listarOportunidades();
  const decisao = decidirResponsavel({
    origem: contato.origem,
    idCliente: cliente.id,
    oportunidades,
    fila: await obterFilaDoDia(),
    configuracao: await obterConfiguracaoDaDistribuicao(),
    idVendedorDoBalcao,
  });

  if (!decisao.idVendedor) return { cliente, oportunidade: null, decisao };

  if (decisao.motivo === 'oportunidade_aberta') {
    const aberta = oportunidades.find((o) => o.idCliente === cliente.id && o.idVendedor === decisao.idVendedor && !['ganho', 'perdido'].includes(o.etapa));
    await avisarSobreAtendimentoAberto(aberta, contato);
    await registrarInteracao({ idCliente: cliente.id, idVendedor: decisao.idVendedor, tipo: 'distribuicao',
      descricao: `Voltou a chamar pelo ${ORIGENS[contato.origem]}: ${contato.interesse}` });
    return { cliente, oportunidade: aberta, decisao };
  }

  const veioDaIa = contato.origem === 'ia';
  const oportunidade = await criarOportunidade({
    idCliente: cliente.id,
    idVendedor: decisao.idVendedor,
    origem: contato.origem,
    interesse: contato.interesse,
    etapa: veioDaIa ? 'negociacao' : 'novo', // a IA só transfere quando o cliente quer negociar
    valor: contato.valor ?? 0,
    resumoIa: contato.resumoIa ?? null,
    transferidaPelaIaEm: veioDaIa ? new Date().toISOString() : null,
    transferenciaVista: !veioDaIa,
  });

  if (decisao.contaComoVez) await passarAVez(decisao.idVendedor);
  await registrarInteracao({ idCliente: cliente.id, idVendedor: decisao.idVendedor, tipo: veioDaIa ? 'ia' : 'distribuicao',
    descricao: `Contato pelo ${ORIGENS[contato.origem]} — ${explicarMotivo(decisao.motivo)}` });

  return { cliente, oportunidade, decisao };
}
