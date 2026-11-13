import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  converterTextoEmValor,
  descreverTempoDecorrido,
  formatarMoeda,
  formatarTelefone,
  montarLinkWhatsApp,
  nomeCurto,
  obterIniciais,
} from '../js/regras/formatos.js';
import { validarNovoAtendimento, validarRetorno, validarTelefone, validarValor } from '../js/regras/validacoes.js';
import { diasEntre, fazAniversarioNoDia } from '../js/regras/datas.js';

// O Intl usa espaço não separável entre "R$" e o número.
const semEspacoEspecial = (texto) => texto.replace(/ /g, ' ');

test('dinheiro aparece no formato brasileiro', () => {
  assert.equal(semEspacoEspecial(formatarMoeda(12990)), 'R$ 12.990');
  assert.equal(semEspacoEspecial(formatarMoeda(4890.5, { centavos: true })), 'R$ 4.890,50');
});

test('entende o valor do jeito que o vendedor digita', () => {
  assert.equal(converterTextoEmValor('R$ 4.890,50'), 4890.5);
  assert.equal(converterTextoEmValor('4890'), 4890);
  assert.equal(converterTextoEmValor('12.990'), 12990);
  assert.equal(converterTextoEmValor('doze mil'), null);
});

test('telefone de Fortaleza é formatado e vira link do WhatsApp com 55', () => {
  assert.equal(formatarTelefone('85988124410'), '(85) 98812-4410');
  assert.equal(formatarTelefone('8532241010'), '(85) 3224-1010');
  assert.equal(montarLinkWhatsApp('(85) 98812-4410'), 'https://wa.me/5585988124410');
  assert.equal(montarLinkWhatsApp('85988124410', 'Oi Carla'), 'https://wa.me/5585988124410?text=Oi%20Carla');
});

test('iniciais e nome curto para os cards', () => {
  assert.equal(obterIniciais('Carla Menezes Albuquerque'), 'CA');
  assert.equal(obterIniciais('Ana'), 'AN');
  assert.equal(nomeCurto('Carla Menezes'), 'Carla M.');
});

test('tempo decorrido fala a língua da loja', () => {
  const agora = new Date(2026, 10, 13, 15, 0);
  assert.equal(descreverTempoDecorrido(new Date(2026, 10, 13, 14, 48), agora), 'há 12 min');
  assert.equal(descreverTempoDecorrido(new Date(2026, 10, 13, 9, 0), agora), 'há 6 h');
  assert.equal(descreverTempoDecorrido(new Date(2026, 10, 12, 23, 0), agora), 'ontem');
  assert.equal(descreverTempoDecorrido(new Date(2026, 10, 8, 10, 0), agora), 'há 5 dias');
});

test('dias contam viradas de calendário, não blocos de 24 horas', () => {
  assert.equal(diasEntre(new Date(2026, 10, 12, 23, 0), new Date(2026, 10, 13, 8, 0)), 1);
  assert.equal(diasEntre(new Date(2026, 10, 13, 8, 0), new Date(2026, 10, 13, 20, 0)), 0);
});

test('aniversário ignora o ano e não sofre com fuso horário', () => {
  assert.equal(fazAniversarioNoDia('1992-11-13', new Date(2026, 10, 13, 0, 30)), true);
  assert.equal(fazAniversarioNoDia('1992-11-13', new Date(2026, 10, 12, 23, 30)), false);
});

test('valor da oportunidade é obrigatório e maior que zero', () => {
  assert.equal(validarValor('').valido, false);
  assert.equal(validarValor('0').valido, false);
  assert.equal(validarValor('abc').valido, false);
  assert.deepEqual(validarValor('4.890'), { valido: true, valor: 4890 });
});

test('telefone precisa de DDD', () => {
  assert.equal(validarTelefone('98812-4410').valido, false);
  assert.deepEqual(validarTelefone('(85) 98812-4410'), { valido: true, telefone: '85988124410' });
});

test('novo atendimento aponta cada campo faltando', () => {
  const resultado = validarNovoAtendimento({ nome: '', telefone: '123', interesse: '' });
  assert.equal(resultado.valido, false);
  assert.deepEqual(Object.keys(resultado.erros).sort(), ['interesse', 'nome', 'telefone']);
});

test('retorno agendado precisa estar no futuro', () => {
  const agora = new Date(2026, 10, 13, 15, 0);
  assert.equal(validarRetorno({}, agora).valido, true);
  assert.equal(validarRetorno({ dataHora: new Date(2026, 10, 13, 14, 0).toISOString(), descricao: 'Ligar' }, agora).valido, false);
  assert.equal(validarRetorno({ dataHora: new Date(2026, 10, 14, 10, 0).toISOString(), descricao: '' }, agora).valido, false);
  assert.equal(validarRetorno({ dataHora: new Date(2026, 10, 14, 10, 0).toISOString(), descricao: 'Ligar' }, agora).valido, true);
});
