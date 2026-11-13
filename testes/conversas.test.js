import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  agruparPorDia,
  calcularJanela,
  canalDaOrigem,
  contarSemResposta,
  preencherModelo,
  previaDaMensagem,
  resumirConversa,
  validarMensagem,
  verificarEnvioLivre,
} from '../js/regras/conversas.js';
import { montarMeuDia } from '../js/regras/meu-dia.js';
import { descreverDiaDaConversa, descreverTempoRestante } from '../js/regras/formatos.js';

const agora = new Date(2026, 10, 13, 15, 0);
const iso = (...partes) => new Date(...partes).toISOString();
const mensagem = (autor, enviadaEm, campos = {}) => ({ id: `${autor}-${enviadaEm}`, autor, texto: 'oi', foto: null, enviadaEm, ...campos });

test('a IA atende pelo WhatsApp; balcão não abre conversa', () => {
  assert.equal(canalDaOrigem('ia'), 'whatsapp');
  assert.equal(canalDaOrigem('instagram'), 'instagram');
  assert.equal(canalDaOrigem('loja'), null);
});

test('janela de 24 h conta a partir da última mensagem do cliente', () => {
  const mensagens = [
    mensagem('cliente', iso(2026, 10, 12, 17, 0)),
    mensagem('vendedor', iso(2026, 10, 13, 9, 0)), // a loja falar não reabre a janela
  ];
  const janela = calcularJanela(mensagens, agora);
  assert.equal(janela.aberta, true);
  assert.equal(janela.restanteMs, 2 * 60 * 60 * 1000);
});

test('tempo restante da janela em horas e minutos', () => {
  assert.equal(descreverTempoRestante((3 * 60 + 12) * 60000), '3 h 12 min');
  assert.equal(descreverTempoRestante(2 * 60 * 60000), '2 h');
  assert.equal(descreverTempoRestante(45 * 60000), '45 min');
  assert.equal(descreverTempoRestante(20000), 'menos de 1 min');
});

test('janela fecha depois de 24 h e sem mensagem do cliente nunca abre', () => {
  assert.equal(calcularJanela([mensagem('cliente', iso(2026, 10, 12, 14, 59))], agora).aberta, false);
  assert.equal(calcularJanela([mensagem('vendedor', iso(2026, 10, 13, 14, 0))], agora).aberta, false);
  assert.equal(verificarEnvioLivre([], agora).permitido, false);
});

test('sem resposta conta só o que o cliente mandou depois da última resposta da loja', () => {
  const mensagens = [
    mensagem('cliente', iso(2026, 10, 13, 9, 0)),
    mensagem('ia', iso(2026, 10, 13, 9, 1)),
    mensagem('sistema', iso(2026, 10, 13, 9, 2)), // aviso interno não responde ninguém
    mensagem('cliente', iso(2026, 10, 13, 9, 3)),
    mensagem('cliente', iso(2026, 10, 13, 9, 4)),
  ];
  assert.equal(contarSemResposta(mensagens), 2);
  assert.equal(contarSemResposta([...mensagens, mensagem('vendedor', iso(2026, 10, 13, 9, 5))]), 0);
});

test('resumo ignora avisos do sistema na última mensagem', () => {
  const resumo = resumirConversa([
    mensagem('cliente', iso(2026, 10, 13, 9, 0), { texto: 'Tem aro 29?' }),
    mensagem('sistema', iso(2026, 10, 13, 9, 1), { texto: 'Transferido' }),
  ]);
  assert.equal(resumo.ultima.texto, 'Tem aro 29?');
  assert.equal(resumo.semResposta, 1);
});

test('prévia corta texto longo e descreve fotos', () => {
  assert.equal(previaDaMensagem({ texto: 'abcdefghij', foto: null }, 6), 'abcde…');
  assert.equal(previaDaMensagem({ texto: '', foto: { imagem: 'x.svg', legenda: 'Caloi Elite' } }), 'Foto: Caloi Elite');
});

test('mensagem vazia não é enviada', () => {
  assert.equal(validarMensagem('   ').valido, false);
  assert.equal(validarMensagem('x'.repeat(5000)).valido, false);
  assert.deepEqual(validarMensagem('  Bom dia! '), { valido: true, texto: 'Bom dia!' });
});

test('modelo aprovado usa o primeiro nome e o interesse', () => {
  const texto = preencherModelo('Oi {nome}, a {interesse} chegou!', { nomeCliente: 'Carla Menezes', interesse: 'Oggi Big Wheel' });
  assert.equal(texto, 'Oi Carla, a Oggi Big Wheel chegou!');
});

test('mensagens são separadas por dia, em ordem', () => {
  const grupos = agruparPorDia([
    mensagem('cliente', iso(2026, 10, 13, 9, 0)),
    mensagem('cliente', iso(2026, 10, 12, 18, 0)),
    mensagem('vendedor', iso(2026, 10, 13, 10, 0)),
  ]);
  assert.equal(grupos.length, 2);
  assert.equal(grupos[1].mensagens.length, 2);
  assert.equal(descreverDiaDaConversa(grupos[0].dia, agora), 'Ontem');
  assert.equal(descreverDiaDaConversa(grupos[1].dia, agora), 'Hoje');
  assert.equal(descreverDiaDaConversa(iso(2026, 10, 10, 9, 0), agora), '10/11');
});

test('meu dia: cliente aguardando resposta vem logo depois da IA', () => {
  const oportunidades = [
    { id: 'o1', idCliente: 'c1', idVendedor: 'joao', etapa: 'atendendo', criadaEm: iso(2026, 10, 10, 9, 0) },
    { id: 'o2', idCliente: 'c2', idVendedor: 'joao', etapa: 'negociacao', criadaEm: iso(2026, 10, 10, 9, 0),
      transferidaPelaIaEm: iso(2026, 10, 13, 14, 0), transferenciaVista: false },
    { id: 'o3', idCliente: 'c3', idVendedor: 'maria', etapa: 'atendendo', criadaEm: iso(2026, 10, 10, 9, 0) },
  ];
  const itens = montarMeuDia({
    oportunidades,
    tarefas: [{ id: 't', idVendedor: 'joao', concluida: false, dataHora: iso(2026, 10, 12, 10, 0), descricao: 'Ligar' }],
    clientes: [],
    mensagensPorCliente: {
      c1: [mensagem('cliente', iso(2026, 10, 13, 14, 30), { texto: 'Ainda tem?' })],
      c2: [mensagem('cliente', iso(2026, 10, 13, 13, 59))], // já está no item da IA
      c3: [mensagem('cliente', iso(2026, 10, 13, 14, 0))], // é da Maria
    },
    idVendedor: 'joao',
    agora,
  });
  assert.deepEqual(itens.map((item) => `${item.tipo}:${item.idCliente ?? ''}`), ['ia:c2', 'aguardando:c1', 'atrasado:']);
  assert.equal(itens[1].texto, 'Ainda tem?');
});
