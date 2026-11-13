// Monta a lista "Meu dia": o que o vendedor precisa fazer agora, em ordem.
//
// Arquivo PURO. A ordem é a regra de negócio mais importante daqui:
//   1. Transferências da IA ainda não vistas — o cliente está esperando no WhatsApp.
//   2. Clientes aguardando resposta — mandaram mensagem e ninguém respondeu ainda.
//   3. Retornos atrasados — já passou do horário combinado com o cliente.
//   4. Retornos de hoje — em ordem de horário.
//   5. Aniversariantes — boa hora para um contato, mas sem urgência.

import { fazAniversarioNoDia, idadeQueCompleta } from './datas.js';
import { resumirConversa } from './conversas.js';
import { estaAberta, foiTransferidaPelaIa } from './funil.js';
import { separarRetornos } from './metas.js';

const PRIORIDADE = { ia: 1, aguardando: 2, atrasado: 3, hoje: 4, aniversario: 5 };

function ehTransferenciaNaoVista(oportunidade) {
  return foiTransferidaPelaIa(oportunidade) && !oportunidade.transferenciaVista;
}

function abertasDoVendedor(oportunidades, idVendedor) {
  return oportunidades.filter((o) => o.idVendedor === idVendedor && estaAberta(o));
}

function itensDaIa(oportunidades, idVendedor) {
  return abertasDoVendedor(oportunidades, idVendedor)
    .filter(ehTransferenciaNaoVista)
    .map((oportunidade) => ({
      tipo: 'ia',
      idOportunidade: oportunidade.id,
      idCliente: oportunidade.idCliente,
      texto: oportunidade.interesse,
      momento: oportunidade.transferidaPelaIaEm,
    }));
}

/**
 * Clientes que mandaram mensagem e estão sem resposta. A transferência da IA
 * não vista já aparece no item "ia", então não repete aqui.
 */
function itensAguardandoResposta(oportunidades, mensagensPorCliente, idVendedor) {
  return abertasDoVendedor(oportunidades, idVendedor)
    .filter((oportunidade) => !ehTransferenciaNaoVista(oportunidade))
    .map((oportunidade) => ({ oportunidade, resumo: resumirConversa(mensagensPorCliente[oportunidade.idCliente] ?? []) }))
    .filter(({ resumo }) => resumo.semResposta > 0)
    .map(({ oportunidade, resumo }) => ({
      tipo: 'aguardando',
      idOportunidade: oportunidade.id,
      idCliente: oportunidade.idCliente,
      texto: resumo.ultimaDoCliente.texto || 'Enviou uma foto',
      quantidade: resumo.semResposta,
      momento: resumo.ultimaDoCliente.enviadaEm,
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

/** mensagensPorCliente: { idCliente: [mensagens] }. Opcional: sem ele, não há itens "aguardando". */
export function montarMeuDia({ oportunidades, tarefas, clientes, mensagensPorCliente = {}, idVendedor, agora }) {
  const itens = [
    ...itensDaIa(oportunidades, idVendedor),
    ...itensAguardandoResposta(oportunidades, mensagensPorCliente, idVendedor),
    ...itensDeRetorno(tarefas, idVendedor, agora),
    ...itensDeAniversario(clientes, oportunidades, idVendedor, agora),
  ];
  return itens.sort((a, b) => {
    if (PRIORIDADE[a.tipo] !== PRIORIDADE[b.tipo]) return PRIORIDADE[a.tipo] - PRIORIDADE[b.tipo];
    return new Date(a.momento ?? 0) - new Date(b.momento ?? 0);
  });
}
