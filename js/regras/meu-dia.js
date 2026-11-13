// Monta a lista "Meu dia": o que o vendedor precisa fazer agora, em ordem.
//
// Arquivo PURO. A ordem é a regra de negócio mais importante daqui:
//   1. Transferências da IA ainda não vistas — o cliente está esperando no WhatsApp.
//   2. Retornos atrasados — já passou do horário combinado com o cliente.
//   3. Retornos de hoje — em ordem de horário.
//   4. Aniversariantes — boa hora para um contato, mas sem urgência.

import { fazAniversarioNoDia, idadeQueCompleta } from './datas.js';
import { estaAberta, foiTransferidaPelaIa } from './funil.js';
import { separarRetornos } from './metas.js';

const PRIORIDADE = { ia: 1, atrasado: 2, hoje: 3, aniversario: 4 };

function itensDaIa(oportunidades, idVendedor) {
  return oportunidades
    .filter((oportunidade) => oportunidade.idVendedor === idVendedor)
    .filter((oportunidade) => estaAberta(oportunidade))
    .filter((oportunidade) => foiTransferidaPelaIa(oportunidade) && !oportunidade.transferenciaVista)
    .map((oportunidade) => ({
      tipo: 'ia',
      idOportunidade: oportunidade.id,
      idCliente: oportunidade.idCliente,
      texto: oportunidade.interesse,
      momento: oportunidade.transferidaPelaIaEm,
    }));
}

function itensDeRetorno(tarefas, idVendedor, agora) {
  const { atrasados, hoje } = separarRetornos(tarefas, idVendedor, agora);
  const paraItem = (tipo) => (tarefa) => ({
    tipo,
    idTarefa: tarefa.id,
    idOportunidade: tarefa.idOportunidade,
    idCliente: tarefa.idCliente,
    texto: tarefa.descricao,
    momento: tarefa.dataHora,
  });
  return [...atrasados.map(paraItem('atrasado')), ...hoje.map(paraItem('hoje'))];
}

/**
 * Aniversariantes: só clientes que este vendedor já atendeu. Sem carteira fixa,
 * é o vínculo mais justo — quem atendeu é quem o cliente reconhece.
 */
function itensDeAniversario(clientes, oportunidades, idVendedor, agora) {
  const clientesAtendidos = new Set(
    oportunidades.filter((oportunidade) => oportunidade.idVendedor === idVendedor).map((o) => o.idCliente),
  );
  return clientes
    .filter((cliente) => clientesAtendidos.has(cliente.id))
    .filter((cliente) => fazAniversarioNoDia(cliente.dataNascimento, agora))
    .map((cliente) => ({
      tipo: 'aniversario',
      idCliente: cliente.id,
      texto: `Faz ${idadeQueCompleta(cliente.dataNascimento, agora)} anos hoje`,
      momento: null,
    }));
}

export function montarMeuDia({ oportunidades, tarefas, clientes, idVendedor, agora }) {
  const itens = [
    ...itensDaIa(oportunidades, idVendedor),
    ...itensDeRetorno(tarefas, idVendedor, agora),
    ...itensDeAniversario(clientes, oportunidades, idVendedor, agora),
  ];
  return itens.sort((a, b) => {
    if (PRIORIDADE[a.tipo] !== PRIORIDADE[b.tipo]) return PRIORIDADE[a.tipo] - PRIORIDADE[b.tipo];
    return new Date(a.momento ?? 0) - new Date(b.momento ?? 0);
  });
}
