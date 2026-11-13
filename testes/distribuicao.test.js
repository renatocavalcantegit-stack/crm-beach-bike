import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CONFIGURACAO_PADRAO,
  decidirResponsavel,
  marcarPresenca,
  passarAVez,
  pausar,
  posicaoNaVez,
  prepararFilaDoDia,
  proximoDaVez,
  voltarDaPausa,
} from '../js/regras/distribuicao.js';

const hoje = new Date(2026, 10, 13, 9, 0);

function filaComTodos() {
  return {
    data: '2026-11-13',
    ordem: ['joao', 'maria', 'pedro'],
    situacao: { joao: 'disponivel', maria: 'disponivel', pedro: 'disponivel' },
  };
}

test('a fila vale por um dia: no dia seguinte todos começam ausentes', () => {
  const ontem = { ...filaComTodos(), data: '2026-11-12' };
  const fila = prepararFilaDoDia(ontem, hoje);
  assert.equal(fila.data, '2026-11-13');
  assert.deepEqual(Object.values(fila.situacao), ['ausente', 'ausente', 'ausente']);
  assert.deepEqual(fila.ordem, ['joao', 'maria', 'pedro']);
});

test('fila do mesmo dia não é reiniciada', () => {
  const fila = filaComTodos();
  assert.equal(prepararFilaDoDia(fila, hoje), fila);
});

test('quem recebe um contato vai para o fim da fila', () => {
  const fila = passarAVez(filaComTodos(), 'joao');
  assert.deepEqual(fila.ordem, ['maria', 'pedro', 'joao']);
});

test('quem marca presença entra no fim: quem já esperava não perde a vez', () => {
  let fila = { data: '2026-11-13', ordem: ['joao', 'maria'], situacao: { joao: 'ausente', maria: 'disponivel' } };
  fila = marcarPresenca(fila, 'joao');
  assert.deepEqual(fila.ordem, ['maria', 'joao']);
  assert.equal(proximoDaVez(fila), 'maria');
});

test('em pausa é pulado, mas mantém a posição ao voltar', () => {
  let fila = pausar(filaComTodos(), 'joao');
  assert.equal(proximoDaVez(fila), 'maria');
  assert.equal(posicaoNaVez(fila, 'joao'), null);
  fila = voltarDaPausa(fila, 'joao');
  assert.equal(proximoDaVez(fila), 'joao');
  assert.equal(posicaoNaVez(fila, 'pedro'), 3);
});

test('as funções nunca alteram a fila recebida', () => {
  const original = filaComTodos();
  passarAVez(original, 'joao');
  pausar(original, 'maria');
  assert.deepEqual(original, filaComTodos());
});

test('contato novo pelo WhatsApp vai para o próximo da vez e conta como vez', () => {
  const decisao = decidirResponsavel({ origem: 'whatsapp', idCliente: null, oportunidades: [], fila: pausar(filaComTodos(), 'joao') });
  assert.deepEqual(decisao, { idVendedor: 'maria', motivo: 'fila', contaComoVez: true });
});

test('cliente com atendimento aberto volta para o mesmo vendedor sem gastar a vez', () => {
  const oportunidades = [{ idCliente: 'c1', idVendedor: 'pedro', etapa: 'orcamento', criadaEm: '2026-11-10T10:00:00Z' }];
  const decisao = decidirResponsavel({ origem: 'instagram', idCliente: 'c1', oportunidades, fila: filaComTodos() });
  assert.deepEqual(decisao, { idVendedor: 'pedro', motivo: 'oportunidade_aberta', contaComoVez: false });
});

test('cliente que já comprou e volta pelo WhatsApp entra na fila normalmente', () => {
  const oportunidades = [{ idCliente: 'c1', idVendedor: 'pedro', etapa: 'ganho', criadaEm: '2026-09-10T10:00:00Z' }];
  const decisao = decidirResponsavel({ origem: 'whatsapp', idCliente: 'c1', oportunidades, fila: filaComTodos() });
  assert.equal(decisao.idVendedor, 'joao');
  assert.equal(decisao.motivo, 'fila');
});

test('transferência da IA vai para o último vendedor que atendeu o cliente', () => {
  const oportunidades = [
    { idCliente: 'c1', idVendedor: 'pedro', etapa: 'perdido', criadaEm: '2026-05-10T10:00:00Z' },
    { idCliente: 'c1', idVendedor: 'maria', etapa: 'ganho', criadaEm: '2026-09-10T10:00:00Z' },
  ];
  const decisao = decidirResponsavel({ origem: 'ia', idCliente: 'c1', oportunidades, fila: filaComTodos() });
  assert.deepEqual(decisao, { idVendedor: 'maria', motivo: 'ja_atendeu', contaComoVez: false });
});

test('cliente da loja fica com quem atendeu no balcão e conta como a vez dele', () => {
  const decisao = decidirResponsavel({
    origem: 'loja', idCliente: null, oportunidades: [], fila: filaComTodos(), idVendedorDoBalcao: 'pedro',
  });
  assert.deepEqual(decisao, { idVendedor: 'pedro', motivo: 'balcao', contaComoVez: true });
});

test('gerente pode colocar a loja na fila pela configuração', () => {
  const configuracao = { ...CONFIGURACAO_PADRAO, canaisNaFila: [...CONFIGURACAO_PADRAO.canaisNaFila, 'loja'] };
  const decisao = decidirResponsavel({
    origem: 'loja', idCliente: null, oportunidades: [], fila: filaComTodos(), configuracao, idVendedorDoBalcao: 'pedro',
  });
  assert.equal(decisao.idVendedor, 'joao');
});

test('sem ninguém disponível, o contato fica sem vendedor', () => {
  const fila = { data: '2026-11-13', ordem: ['joao'], situacao: { joao: 'pausa' } };
  const decisao = decidirResponsavel({ origem: 'whatsapp', idCliente: null, oportunidades: [], fila });
  assert.equal(decisao.idVendedor, null);
  assert.equal(decisao.motivo, 'ninguem_disponivel');
});
