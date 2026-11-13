// Indicadores do vendedor: meta do mês, oportunidades e retornos.
//
// Arquivo PURO. Calcula os números do topo da tela a partir das listas
// recebidas; não sabe de onde os dados vieram.

import { mesmoDia, mesmoMes } from './datas.js';
import { estaAberta, foiTransferidaPelaIa, somarValorEmAberto } from './funil.js';

/**
 * Total vendido no mês: soma das oportunidades ganhas pelo vendedor,
 * fechadas no mesmo mês de "agora". É o número que conta para a meta.
 */
export function totalVendidoNoMes(oportunidades, idVendedor, agora) {
  return oportunidades
    .filter((oportunidade) => oportunidade.idVendedor === idVendedor)
    .filter((oportunidade) => oportunidade.etapa === 'ganho' && mesmoMes(oportunidade.fechadaEm, agora))
    .reduce((total, oportunidade) => total + (Number(oportunidade.valor) || 0), 0);
}

/** Percentual da meta, arredondado. Sem meta cadastrada, mostra 0%. */
export function percentualDaMeta(vendido, meta) {
  if (!(meta > 0)) return 0;
  return Math.round((vendido / meta) * 100);
}

/** Retornos pendentes do vendedor, separados em atrasados e de hoje. */
export function separarRetornos(tarefas, idVendedor, agora) {
  const pendentes = tarefas.filter((tarefa) => tarefa.idVendedor === idVendedor && !tarefa.concluida);
  const momento = new Date(agora);
  return {
    // Atrasado: o horário combinado já passou, mesmo que seja hoje.
    atrasados: pendentes.filter((tarefa) => new Date(tarefa.dataHora) < momento),
    hoje: pendentes.filter((tarefa) => new Date(tarefa.dataHora) >= momento && mesmoDia(tarefa.dataHora, agora)),
  };
}

/** Todos os números do topo da tela do vendedor. */
export function calcularIndicadores({ oportunidades, tarefas, vendedor, agora }) {
  const minhas = oportunidades.filter((oportunidade) => oportunidade.idVendedor === vendedor.id);
  const abertas = minhas.filter(estaAberta);
  const vendido = totalVendidoNoMes(oportunidades, vendedor.id, agora);
  const retornos = separarRetornos(tarefas, vendedor.id, agora);

  return {
    vendidoNoMes: vendido,
    meta: vendedor.metaMensal,
    percentualMeta: percentualDaMeta(vendido, vendedor.metaMensal),
    quantidadeAbertas: abertas.length,
    valorEmAberto: somarValorEmAberto(abertas),
    retornosHoje: retornos.hoje.length,
    retornosAtrasados: retornos.atrasados.length,
    vindosDaIa: abertas.filter(foiTransferidaPelaIa).length,
  };
}
