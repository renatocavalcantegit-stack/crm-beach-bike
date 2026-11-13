import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  agruparPorEtapa,
  estaParada,
  somarValorEmAberto,
  verificarGanho,
  verificarMudancaDeEtapa,
  verificarPerda,
} from '../js/regras/funil.js';
import { calcularIndicadores, percentualDaMeta, totalVendidoNoMes } from '../js/regras/metas.js';
import { montarMeuDia } from '../js/regras/meu-dia.js';

const agora = new Date(2026, 10, 13, 15, 0);
const iso = (...partes) => new Date(...partes).toISOString();

function oportunidade(campos) {
  return {
    id: 'o1', idCliente: 'c1', idVendedor: 'joao', etapa: 'novo', valor: 0, origem: 'whatsapp',
    criadaEm: iso(2026, 10, 10, 9, 0), ultimoContatoEm: iso(2026, 10, 12, 9, 0), ...campos,
  };
}

test('ir para orçamento sem valor pede o valor antes', () => {
  const resultado = verificarMudancaDeEtapa(oportunidade({ etapa: 'atendendo' }), 'orcamento');
  assert.deepEqual(resultado, { permitido: true, precisaValor: true });
});

test('ir para negociação com valor já informado não pergunta de novo', () => {
  const resultado = verificarMudancaDeEtapa(oportunidade({ etapa: 'orcamento', valor: 4890 }), 'negociacao');
  assert.deepEqual(resultado, { permitido: true, precisaValor: false });
});

test('não se arrasta para ganho ou perdido: só pelos botões', () => {
  assert.equal(verificarMudancaDeEtapa(oportunidade({}), 'ganho').permitido, false);
});

test('oportunidade fechada não muda mais de etapa', () => {
  assert.equal(verificarMudancaDeEtapa(oportunidade({ etapa: 'ganho' }), 'novo').permitido, false);
});

test('ganho exige valor; perdido exige um motivo da lista', () => {
  assert.equal(verificarGanho(oportunidade({}), '').permitido, false);
  assert.deepEqual(verificarGanho(oportunidade({}), '12.990'), { permitido: true, valor: 12990 });
  assert.equal(verificarPerda(oportunidade({}), 'Achei caro').permitido, false);
  assert.equal(verificarPerda(oportunidade({}), 'Preço').permitido, true);
});

test('card entra em alerta com 3 dias sem contato', () => {
  assert.equal(estaParada(oportunidade({ ultimoContatoEm: iso(2026, 10, 11, 18, 0) }), agora), false);
  assert.equal(estaParada(oportunidade({ ultimoContatoEm: iso(2026, 10, 10, 18, 0) }), agora), true);
  assert.equal(estaParada(oportunidade({ etapa: 'ganho', ultimoContatoEm: iso(2026, 9, 1, 9, 0) }), agora), false);
});

test('no quadro, quem está há mais tempo sem contato vem primeiro', () => {
  const colunas = agruparPorEtapa([
    oportunidade({ id: 'recente', ultimoContatoEm: iso(2026, 10, 13, 9, 0) }),
    oportunidade({ id: 'antiga', ultimoContatoEm: iso(2026, 10, 5, 9, 0) }),
    oportunidade({ id: 'fechada', etapa: 'ganho' }),
  ]);
  assert.deepEqual(colunas.novo.map((o) => o.id), ['antiga', 'recente']);
  assert.equal(colunas.orcamento.length, 0);
});

test('valor em jogo soma só o que está aberto', () => {
  const total = somarValorEmAberto([
    oportunidade({ valor: 4890, etapa: 'orcamento' }),
    oportunidade({ valor: 12990, etapa: 'negociacao' }),
    oportunidade({ valor: 9000, etapa: 'ganho' }),
  ]);
  assert.equal(total, 17880);
});

test('meta conta só o que o vendedor ganhou neste mês', () => {
  const lista = [
    oportunidade({ etapa: 'ganho', valor: 10000, fechadaEm: iso(2026, 10, 2, 10, 0) }),
    oportunidade({ etapa: 'ganho', valor: 5000, fechadaEm: iso(2026, 9, 30, 10, 0) }),
    oportunidade({ etapa: 'ganho', valor: 7000, fechadaEm: iso(2026, 10, 5, 10, 0), idVendedor: 'maria' }),
    oportunidade({ etapa: 'perdido', valor: 3000, fechadaEm: iso(2026, 10, 6, 10, 0) }),
  ];
  assert.equal(totalVendidoNoMes(lista, 'joao', agora), 10000);
  assert.equal(percentualDaMeta(10000, 60000), 17);
  assert.equal(percentualDaMeta(10000, 0), 0);
});

test('indicadores separam retornos atrasados dos de hoje', () => {
  const tarefas = [
    { id: 't1', idVendedor: 'joao', concluida: false, dataHora: iso(2026, 10, 13, 10, 0) },
    { id: 't2', idVendedor: 'joao', concluida: false, dataHora: iso(2026, 10, 13, 17, 0) },
    { id: 't3', idVendedor: 'joao', concluida: true, dataHora: iso(2026, 10, 13, 9, 0) },
    { id: 't4', idVendedor: 'joao', concluida: false, dataHora: iso(2026, 10, 14, 9, 0) },
  ];
  const indicadores = calcularIndicadores({
    oportunidades: [oportunidade({ transferidaPelaIaEm: iso(2026, 10, 13, 14, 0), valor: 500, etapa: 'negociacao' })],
    tarefas,
    vendedor: { id: 'joao', metaMensal: 60000 },
    agora,
  });
  assert.equal(indicadores.retornosAtrasados, 1);
  assert.equal(indicadores.retornosHoje, 1);
  assert.equal(indicadores.vindosDaIa, 1);
  assert.equal(indicadores.valorEmAberto, 500);
});

test('meu dia: IA primeiro, depois atrasados, hoje e aniversários', () => {
  const itens = montarMeuDia({
    oportunidades: [
      // Chegou pelo Instagram, mas depois a IA transferiu: conta como transferência.
      oportunidade({ id: 'ia1', origem: 'instagram', etapa: 'negociacao', interesse: 'Quer desconto',
        transferidaPelaIaEm: iso(2026, 10, 13, 14, 50), transferenciaVista: false }),
      oportunidade({ id: 'ia-vista', origem: 'ia', etapa: 'negociacao',
        transferidaPelaIaEm: iso(2026, 10, 13, 11, 0), transferenciaVista: true }),
      oportunidade({ id: 'o2', idCliente: 'aniversariante' }),
    ],
    tarefas: [
      { id: 'hoje', idVendedor: 'joao', concluida: false, dataHora: iso(2026, 10, 13, 17, 0), descricao: 'Ligar' },
      { id: 'atrasado', idVendedor: 'joao', concluida: false, dataHora: iso(2026, 10, 12, 10, 0), descricao: 'Retornar' },
    ],
    clientes: [
      { id: 'aniversariante', dataNascimento: '1992-11-13' },
      { id: 'desconhecido', dataNascimento: '1990-11-13' },
    ],
    idVendedor: 'joao',
    agora,
  });
  assert.deepEqual(itens.map((item) => item.tipo), ['ia', 'atrasado', 'hoje', 'aniversario']);
  assert.equal(itens[3].texto, 'Faz 34 anos hoje');
});
