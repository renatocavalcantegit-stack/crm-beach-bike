// Dados de demonstração: vendedores, clientes, bicicletas e atendimentos FICTÍCIOS.
//
// Nomes, telefones e números de série foram inventados. As datas são calculadas
// a partir de "agora", para a demonstração parecer sempre atual (o retorno
// "atrasado" está sempre atrasado, o aniversariante faz aniversário hoje etc.).
//
// Quando o back-end existir, este arquivo deixa de ser usado pela tela e pode
// virar a carga inicial de um banco de testes.

import { chaveDoDia } from '../regras/datas.js';

const HORA = 60 * 60 * 1000;

/** Monta funções de data relativas a "agora". */
function criarRelogio(agora) {
  const base = new Date(agora);
  return {
    // Hoje, numa hora fixa (ex.: hojeAs(10) = hoje às 10h).
    hojeAs: (hora, minuto = 0) => new Date(base.getFullYear(), base.getMonth(), base.getDate(), hora, minuto).toISOString(),
    // N dias atrás, numa hora fixa.
    diasAtras: (dias, hora = 10) =>
      new Date(base.getFullYear(), base.getMonth(), base.getDate() - dias, hora, 0).toISOString(),
    // Daqui a N horas a partir de agora.
    emHoras: (horas) => new Date(base.getTime() + horas * HORA).toISOString(),
    // N horas atrás (aceita fração: 1.5 = uma hora e meia). Usado nas conversas,
    // para a janela de 24 h do WhatsApp ficar sempre igual, a qualquer hora do dia.
    horasAtras: (horas) => new Date(base.getTime() - horas * HORA).toISOString(),
    // N minutos atrás.
    minutosAtras: (minutos) => new Date(base.getTime() - minutos * 60000).toISOString(),
    // Aniversário que cai hoje para alguém que nasceu no ano informado.
    nascidoHojeEm: (ano) =>
      `${ano}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`,
    // Dia do mês atual (para ganhos que contam na meta). Se o dia ainda não chegou, usa hoje.
    diaDoMes: (dia, hora = 11) => {
      const diaSeguro = Math.min(dia, base.getDate());
      return new Date(base.getFullYear(), base.getMonth(), diaSeguro, hora, 0).toISOString();
    },
  };
}

const VENDEDORES = [
  { id: 'joao', nome: 'João Batista', metaMensal: 60000 },
  { id: 'maria', nome: 'Maria Clara Souza', metaMensal: 55000 },
  { id: 'pedro', nome: 'Pedro Henrique Lima', metaMensal: 50000 },
];

function criarClientes(r) {
  return [
    { id: 'c01', nome: 'Carla Menezes', telefone: '85988124410', bairro: 'Aldeota', dataNascimento: '1989-04-12', clienteDesde: '2023-02-10', codigoParceiroSankhya: 10421 },
    { id: 'c02', nome: 'Pedro Arruda', telefone: '85997310288', bairro: 'Meireles', dataNascimento: '1985-08-30', clienteDesde: '2024-06-01', codigoParceiroSankhya: 10588 },
    { id: 'c03', nome: 'Lucas Ferreira', telefone: '85981447720', bairro: 'Cocó', dataNascimento: '1994-01-19', clienteDesde: '2025-03-15', codigoParceiroSankhya: 10933 },
    { id: 'c04', nome: 'Ana Rocha', telefone: '85999021133', bairro: 'Papicu', dataNascimento: r.nascidoHojeEm(1992), clienteDesde: '2022-11-20', codigoParceiroSankhya: 10102 },
    { id: 'c05', nome: 'Marcos Tavares', telefone: '85986650417', bairro: 'Praia de Iracema', dataNascimento: '1990-07-07', clienteDesde: null, codigoParceiroSankhya: null },
    { id: 'c06', nome: 'Júlia Pinheiro', telefone: '85991238846', bairro: 'Messejana', dataNascimento: '1987-03-03', clienteDesde: null, codigoParceiroSankhya: null },
    { id: 'c07', nome: 'Rafael Holanda', telefone: '85994470031', bairro: 'Varjota', dataNascimento: '1979-12-01', clienteDesde: '2021-08-08', codigoParceiroSankhya: 9877 },
    { id: 'c08', nome: 'Beatriz Sampaio', telefone: '85987706654', bairro: 'Dionísio Torres', dataNascimento: '1998-05-25', clienteDesde: null, codigoParceiroSankhya: null },
    { id: 'c09', nome: 'Thiago Bezerra', telefone: '85998812290', bairro: 'Cambeba', dataNascimento: '1983-10-14', clienteDesde: '2024-01-09', codigoParceiroSankhya: 10512 },
    { id: 'c10', nome: 'Fernanda Castelo', telefone: '85985563318', bairro: 'Fátima', dataNascimento: '1991-02-17', clienteDesde: '2025-09-02', codigoParceiroSankhya: 11020 },
    { id: 'c11', nome: 'Diego Albuquerque', telefone: '85996604471', bairro: 'Parquelândia', dataNascimento: '1996-09-09', clienteDesde: null, codigoParceiroSankhya: null },
    { id: 'c12', nome: 'Renata Façanha', telefone: '85993357702', bairro: 'Benfica', dataNascimento: '1975-06-21', clienteDesde: '2020-04-30', codigoParceiroSankhya: 9450 },
    { id: 'c13', nome: 'Gustavo Moreira', telefone: '85982219965', bairro: 'Guararapes', dataNascimento: '1988-11-02', clienteDesde: '2025-12-12', codigoParceiroSankhya: 11205 },
    { id: 'c14', nome: 'Larissa Teixeira', telefone: '85990014587', bairro: 'Edson Queiroz', dataNascimento: '2001-01-28', clienteDesde: null, codigoParceiroSankhya: null },
  ];
}

const BICICLETAS = [
  { id: 'b01', idCliente: 'c01', marca: 'Sense', modelo: 'Impact Pro', ano: 2021, aro: '29', quadro: 'M', cor: 'Preta e verde', numeroSerie: 'WTU2148K' },
  { id: 'b02', idCliente: 'c02', marca: 'Caloi', modelo: 'Explorer Comp', ano: 2022, aro: '29', quadro: 'L', cor: 'Cinza', numeroSerie: 'CL22E0931' },
  { id: 'b03', idCliente: 'c04', marca: 'Oggi', modelo: 'Big Wheel 7.0', ano: 2023, aro: '29', quadro: 'S', cor: 'Azul', numeroSerie: 'OG7H55102' },
  { id: 'b04', idCliente: 'c04', marca: 'Caloi', modelo: 'Ceci', ano: 2024, aro: '20', quadro: 'Infantil', cor: 'Rosa', numeroSerie: 'CL24C1180' },
  { id: 'b05', idCliente: 'c07', marca: 'Specialized', modelo: 'Allez', ano: 2020, aro: '700', quadro: '54', cor: 'Vermelha', numeroSerie: 'WSBC604412' },
  { id: 'b06', idCliente: 'c09', marca: 'Trek', modelo: 'Marlin 5', ano: 2024, aro: '29', quadro: 'M', cor: 'Laranja', numeroSerie: 'WTU8873M' },
  { id: 'b07', idCliente: 'c12', marca: 'Groove', modelo: 'Ska 30', ano: 2019, aro: '29', quadro: 'M', cor: 'Branca', numeroSerie: 'GR19S3307' },
  { id: 'b08', idCliente: 'c13', marca: 'Sense', modelo: 'Activ', ano: 2025, aro: '700', quadro: 'M', cor: 'Grafite', numeroSerie: 'SN25A2290' },
];

function criarOportunidades(r) {
  const op = (campos) => ({
    valor: 0, resumoIa: null, transferidaPelaIaEm: null, transferenciaVista: true, fechadaEm: null, motivoPerda: null, ...campos,
  });
  return [
    // João — abertas
    op({ id: 'o01', idCliente: 'c01', idVendedor: 'joao', etapa: 'negociacao', origem: 'ia', valor: 12990,
      interesse: 'Caloi Elite Carbon aro 29', criadaEm: r.minutosAtras(12), ultimoContatoEm: r.minutosAtras(12),
      transferidaPelaIaEm: r.minutosAtras(12), transferenciaVista: false,
      resumoIa: 'Quer a Caloi Elite Carbon (R$ 12.990, 2 em estoque). Pediu 10% de desconto à vista no Pix. Já tem uma Sense Impact Pro 2021 e perguntou se pode deixar como parte do pagamento.' }),
    op({ id: 'o02', idCliente: 'c05', idVendedor: 'joao', etapa: 'novo', origem: 'whatsapp',
      interesse: 'Speed até R$ 6 mil', criadaEm: r.horasAtras(20), ultimoContatoEm: r.horasAtras(20) }),
    op({ id: 'o03', idCliente: 'c06', idVendedor: 'joao', etapa: 'novo', origem: 'loja',
      interesse: 'Infantil aro 20 para a filha', criadaEm: r.hojeAs(9, 20), ultimoContatoEm: r.hojeAs(9, 20) }),
    op({ id: 'o04', idCliente: 'c02', idVendedor: 'joao', etapa: 'atendendo', origem: 'instagram',
      interesse: 'MTB aro 29 com suspensão a ar', criadaEm: r.diasAtras(8), ultimoContatoEm: r.diasAtras(5) }),
    op({ id: 'o05', idCliente: 'c08', idVendedor: 'joao', etapa: 'atendendo', origem: 'whatsapp',
      interesse: 'Elétrica urbana para ir ao trabalho', criadaEm: r.diasAtras(3), ultimoContatoEm: r.horasAtras(21) }),
    op({ id: 'o06', idCliente: 'c03', idVendedor: 'joao', etapa: 'orcamento', origem: 'whatsapp', valor: 4890,
      interesse: 'Sense Impact Pro 2026', criadaEm: r.diasAtras(6), ultimoContatoEm: r.diasAtras(2) }),
    op({ id: 'o07', idCliente: 'c11', idVendedor: 'joao', etapa: 'orcamento', origem: 'instagram', valor: 2350,
      interesse: 'Kit transmissão Shimano Deore', criadaEm: r.diasAtras(10), ultimoContatoEm: r.diasAtras(4) }),
    // João — fechadas (contam na meta do mês)
    op({ id: 'o08', idCliente: 'c07', idVendedor: 'joao', etapa: 'ganho', origem: 'loja', valor: 18900,
      interesse: 'Specialized Tarmac SL7', criadaEm: r.diaDoMes(1), ultimoContatoEm: r.diaDoMes(3), fechadaEm: r.diaDoMes(3) }),
    op({ id: 'o09', idCliente: 'c04', idVendedor: 'joao', etapa: 'ganho', origem: 'whatsapp', valor: 6990,
      interesse: 'Oggi Big Wheel 7.2', criadaEm: r.diaDoMes(4), ultimoContatoEm: r.diaDoMes(6), fechadaEm: r.diaDoMes(6) }),
    op({ id: 'o10', idCliente: 'c09', idVendedor: 'joao', etapa: 'ganho', origem: 'instagram', valor: 12510,
      interesse: 'Trek Marlin 7 + capacete e luvas', criadaEm: r.diaDoMes(5), ultimoContatoEm: r.diaDoMes(9), fechadaEm: r.diaDoMes(9) }),
    op({ id: 'o11', idCliente: 'c14', idVendedor: 'joao', etapa: 'perdido', origem: 'whatsapp', valor: 3200,
      interesse: 'Caloi 10 aro 700', criadaEm: r.diasAtras(20), ultimoContatoEm: r.diasAtras(12), fechadaEm: r.diasAtras(12), motivoPerda: 'Preço' }),

    // Maria
    op({ id: 'o12', idCliente: 'c10', idVendedor: 'maria', etapa: 'atendendo', origem: 'whatsapp',
      interesse: 'Revisão + troca de pneus', criadaEm: r.diasAtras(2), ultimoContatoEm: r.diasAtras(1) }),
    op({ id: 'o13', idCliente: 'c12', idVendedor: 'maria', etapa: 'negociacao', origem: 'loja', valor: 8490,
      interesse: 'Trocar a Groove por uma Scott Scale', criadaEm: r.diasAtras(7), ultimoContatoEm: r.diasAtras(4) }),
    op({ id: 'o14', idCliente: 'c13', idVendedor: 'maria', etapa: 'ganho', origem: 'instagram', valor: 21400,
      interesse: 'Sense Activ + rolo de treino', criadaEm: r.diaDoMes(2), ultimoContatoEm: r.diaDoMes(8), fechadaEm: r.diaDoMes(8) }),

    // Pedro
    op({ id: 'o15', idCliente: 'c02', idVendedor: 'pedro', etapa: 'ganho', origem: 'whatsapp', valor: 7800,
      interesse: 'Caloi Explorer Comp', criadaEm: '2026-05-20T13:00:00.000Z', ultimoContatoEm: '2026-05-28T13:00:00.000Z', fechadaEm: '2026-05-28T13:00:00.000Z' }),
    op({ id: 'o16', idCliente: 'c09', idVendedor: 'pedro', etapa: 'orcamento', origem: 'whatsapp', valor: 1290,
      interesse: 'Garmin Edge 540', criadaEm: r.diasAtras(1), ultimoContatoEm: r.diasAtras(1) }),
  ];
}

function criarTarefas(r) {
  return [
    { id: 't01', idOportunidade: 'o04', idCliente: 'c02', idVendedor: 'joao', descricao: 'Retornar sobre a MTB aro 29', dataHora: r.diasAtras(1, 16), concluida: false },
    { id: 't02', idOportunidade: 'o06', idCliente: 'c03', idVendedor: 'joao', descricao: 'Ver se Lucas decidiu o orçamento', dataHora: r.emHoras(2), concluida: false },
    { id: 't03', idOportunidade: 'o05', idCliente: 'c08', idVendedor: 'joao', descricao: 'Enviar opções de elétricas', dataHora: r.emHoras(4), concluida: false },
    { id: 't04', idOportunidade: 'o13', idCliente: 'c12', idVendedor: 'maria', descricao: 'Avaliar a Groove na loja', dataHora: r.emHoras(3), concluida: false },
  ];
}

function criarInteracoes(r) {
  return [
    { id: 'i01', idCliente: 'c01', idVendedor: null, tipo: 'ia', descricao: 'Assistente IA transferiu: cliente quer negociar', em: r.minutosAtras(12) },
    { id: 'i02', idCliente: 'c01', idVendedor: null, tipo: 'oficina', descricao: 'Revisão completa na oficina', em: r.diasAtras(72) },
    { id: 'i03', idCliente: 'c02', idVendedor: 'joao', tipo: 'contato', descricao: 'Mandou fotos da Explorer e pediu avaliação na troca', em: r.diasAtras(5) },
    { id: 'i04', idCliente: 'c03', idVendedor: 'joao', tipo: 'etapa', descricao: 'Orçamento de R$ 4.890 enviado pelo WhatsApp', em: r.diasAtras(2) },
    { id: 'i05', idCliente: 'c08', idVendedor: 'joao', tipo: 'contato', descricao: 'Perguntou autonomia e se cabe no elevador', em: r.horasAtras(21) },
    { id: 'i06', idCliente: 'c11', idVendedor: 'joao', tipo: 'etapa', descricao: 'Orçamento de R$ 2.350 enviado', em: r.diasAtras(4) },
  ];
}

/** Histórico de compras que o Sankhya simulado devolve, por código de parceiro. */
function criarComprasSankhya(r) {
  return {
    10421: [
      { data: r.diasAtras(3), descricao: 'Câmara de ar 29 + óleo de corrente', valor: 89, nota: 'NFC-e 48213' },
      { data: r.diasAtras(72), descricao: 'Revisão completa', valor: 260, nota: 'NFC-e 46102' },
      { data: '2023-02-10T14:00:00.000Z', descricao: 'Sense Impact Pro 2021', valor: 5990, nota: 'NFC-e 30511' },
    ],
    10588: [{ data: '2026-05-28T13:00:00.000Z', descricao: 'Caloi Explorer Comp', valor: 7800, nota: 'NFC-e 44930' }],
    10933: [{ data: '2025-03-15T15:00:00.000Z', descricao: 'Capacete Abus + luvas', valor: 640, nota: 'NFC-e 39977' }],
    10102: [
      { data: r.diaDoMes(6), descricao: 'Oggi Big Wheel 7.2', valor: 6990, nota: 'NFC-e 48120' },
      { data: '2024-12-15T12:00:00.000Z', descricao: 'Caloi Ceci aro 20', valor: 1190, nota: 'NFC-e 41007' },
    ],
    9877: [{ data: r.diaDoMes(3), descricao: 'Specialized Tarmac SL7', valor: 18900, nota: 'NFC-e 48077' }],
    10512: [{ data: r.diaDoMes(9), descricao: 'Trek Marlin 7 + capacete e luvas', valor: 12510, nota: 'NFC-e 48190' }],
    11020: [{ data: '2025-09-02T10:00:00.000Z', descricao: 'Bomba de pé + kit reparo', valor: 210, nota: 'NFC-e 42550' }],
    9450: [{ data: '2020-04-30T10:00:00.000Z', descricao: 'Groove Ska 30', valor: 2890, nota: 'NFC-e 12044' }],
    11205: [{ data: r.diaDoMes(8), descricao: 'Sense Activ + rolo de treino', valor: 21400, nota: 'NFC-e 48160' }],
  };
}

/**
 * Conversas de WhatsApp e Instagram de cada atendimento aberto.
 * Atendimento de balcão (o03, o13) não tem conversa.
 * Cada cenário mostra uma situação da tela de atendimento: transferência da
 * IA, cliente sem resposta, janela de 24 h fechada, card parado etc.
 */
function criarMensagens(r) {
  let contador = 0;
  const msg = (idCliente, canal, autor, horasAtras, texto, campos = {}) => ({
    id: `m${String(++contador).padStart(3, '0')}`,
    idCliente, canal, autor, texto, foto: null, idModelo: null,
    idVendedor: autor === 'vendedor' ? 'joao' : null,
    enviadaEm: r.horasAtras(horasAtras),
    status: autor === 'vendedor' || autor === 'ia' ? 'lida' : null,
    ...campos,
  });
  const minutos = (quantidade) => quantidade / 60;

  return [
    // o01 Carla: a IA conversou e transferiu para o João há 12 minutos.
    msg('c01', 'whatsapp', 'cliente', minutos(17), 'Oi! Vocês têm a Caloi Elite Carbon aro 29?'),
    msg('c01', 'whatsapp', 'ia', minutos(16), 'Olá, Carla! Temos sim: 2 unidades da Caloi Elite Carbon aro 29, por R$ 12.990. Quer saber mais algum detalhe?'),
    msg('c01', 'whatsapp', 'cliente', minutos(14), 'Consigo 10% de desconto no Pix? E dá para deixar minha Sense Impact Pro 2021 como parte do pagamento?'),
    msg('c01', 'whatsapp', 'ia', minutos(13), 'Desconto e avaliação de bike usada são com o nosso time de vendas. Vou te passar para um vendedor agora, tudo bem?'),
    msg('c01', 'whatsapp', 'cliente', minutos(12.5), 'Pode sim, obrigada!'),
    msg('c01', 'whatsapp', 'sistema', minutos(12), 'Assistente IA transferiu o atendimento para João Batista'),

    // o02 Marcos: chegou há 20 horas e ninguém respondeu ainda.
    msg('c05', 'whatsapp', 'cliente', 20, 'Boa noite! Procuro uma speed até uns 6 mil. O que vocês têm?'),

    // o04 Pedro Arruda: janela de 24 h fechada, só dá para mandar modelo aprovado.
    msg('c02', 'instagram', 'cliente', 122, 'Oi, vi no Instagram a MTB aro 29 com suspensão a ar. Ainda tem?'),
    msg('c02', 'instagram', 'vendedor', 121, 'Oi, Pedro! Temos sim. Me manda umas fotos da sua Explorer que eu vejo quanto ela vale na troca.'),
    msg('c02', 'instagram', 'cliente', 120.5, 'Mandei as fotos agora há pouco no direct.'),
    msg('c02', 'instagram', 'vendedor', 120, 'Recebi! Vou ver com a oficina e te retorno.'),

    // o05 Beatriz: respondida ontem; hoje voltou com outra pergunta.
    msg('c08', 'whatsapp', 'cliente', 22, 'Qual a autonomia da elétrica urbana? E ela cabe no elevador?'),
    msg('c08', 'whatsapp', 'vendedor', 21, 'Oi, Beatriz! Faz até 60 km por carga e cabe em pé no elevador. Posso te mandar umas opções?'),
    msg('c08', 'whatsapp', 'cliente', 3, 'Pode mandar! E vocês fazem test ride?'),

    // o06 Lucas: orçamento enviado há dois dias, o cliente ficou de pensar.
    msg('c03', 'whatsapp', 'cliente', 52, 'Fala! Quanto fica a Sense Impact Pro 2026?'),
    msg('c03', 'whatsapp', 'vendedor', 50, 'Lucas, a Sense Impact Pro 2026 fica R$ 4.890. Já sai revisada e com garantia da loja.'),
    msg('c03', 'whatsapp', 'cliente', 49.5, 'Vou ver com a minha esposa e te falo.'),

    // o07 Diego: orçamento sem resposta há 4 dias (card em alerta).
    msg('c11', 'instagram', 'cliente', 98, 'Quanto fica o kit Shimano Deore 12v instalado?'),
    msg('c11', 'instagram', 'vendedor', 97, 'Diego, fica R$ 2.350 com a instalação na nossa oficina.'),

    // o12 (Maria): cliente quer marcar a revisão.
    msg('c10', 'whatsapp', 'cliente', 26, 'Oi! Queria fazer a revisão e trocar os dois pneus.'),
    msg('c10', 'whatsapp', 'vendedor', 25, 'Oi, Fernanda! Fazemos sim. Qual dia fica bom para você trazer a bike?', { idVendedor: 'maria' }),
    msg('c10', 'whatsapp', 'cliente', 1, 'Pode ser sábado de manhã?'),

    // o16 (Pedro): orçamento do Garmin.
    msg('c09', 'whatsapp', 'cliente', 25, 'Vocês têm o Garmin Edge 540?'),
    msg('c09', 'whatsapp', 'vendedor', 24.5, 'Temos sim, Thiago! Sai por R$ 1.290.', { idVendedor: 'pedro' }),
  ];
}

/** Respostas rápidas: textos que o vendedor manda com um clique. */
const RESPOSTAS_RAPIDAS = [
  { id: 'horario', titulo: 'Horário', texto: 'Nosso horário é de segunda a sexta, das 8h às 18h, e sábado, das 8h às 13h.' },
  // Endereço FICTÍCIO da demonstração: trocar pelo da loja quando o CRM for usado de verdade.
  { id: 'endereco', titulo: 'Endereço', texto: 'Estamos na Av. da Praia, 1000, Meireles, Fortaleza. Tem estacionamento em frente.' },
  { id: 'pagamento', titulo: 'Pagamento', texto: 'Aceitamos Pix, dinheiro e cartão de débito ou crédito, com parcelamento no cartão.' },
  { id: 'test-ride', titulo: 'Test ride', texto: 'Pode vir fazer o test ride, sim! É só trazer um documento com foto. Quer que eu reserve um horário?' },
  { id: 'revisao', titulo: 'Revisão', texto: 'Fazemos revisão na nossa oficina. A revisão completa leva em média 2 dias úteis. Quer agendar?' },
];

/**
 * Modelos aprovados pela Meta: os únicos que podem ser enviados com a janela
 * de 24 h fechada. {nome} vira o primeiro nome do cliente; {interesse}, o
 * interesse da oportunidade.
 */
const MODELOS = [
  { id: 'retomar', nome: 'Retomar interesse', texto: 'Olá, {nome}! Aqui é da Beach Bike Store. Você ainda tem interesse em: {interesse}? Posso ajudar com alguma dúvida?' },
  { id: 'lembrete', nome: 'Lembrete de retorno', texto: 'Olá, {nome}! Passando para lembrar do nosso retorno sobre: {interesse}. Podemos conversar?' },
  { id: 'chegou', nome: 'Produto chegou', texto: 'Olá, {nome}! Boa notícia: chegou na loja o que você procurava ({interesse}). Quer que a gente reserve para você?' },
];

/** Catálogo simulado: fotos de produto que o vendedor pode enviar no chat. */
const CATALOGO = [
  { id: 'p01', nome: 'Caloi Elite Carbon aro 29', legenda: 'Caloi Elite Carbon aro 29 · R$ 12.990', imagem: 'assets/catalogo/caloi-elite-carbon.svg' },
  { id: 'p02', nome: 'Sense Impact Pro 2026', legenda: 'Sense Impact Pro 2026 · R$ 4.890', imagem: 'assets/catalogo/sense-impact-pro.svg' },
  { id: 'p03', nome: 'Oggi Big Wheel 7.2', legenda: 'Oggi Big Wheel 7.2 · R$ 6.990', imagem: 'assets/catalogo/oggi-big-wheel.svg' },
  { id: 'p04', nome: 'Trek Domane AL 2', legenda: 'Trek Domane AL 2 · R$ 8.990', imagem: 'assets/catalogo/trek-domane.svg' },
  { id: 'p05', nome: 'Elétrica urbana', legenda: 'Elétrica urbana · até 60 km por carga', imagem: 'assets/catalogo/eletrica-urbana.svg' },
  { id: 'p06', nome: 'Infantil aro 20', legenda: 'Infantil aro 20 · R$ 1.190', imagem: 'assets/catalogo/infantil-aro-20.svg' },
];

/** O que o "cliente" simulado responde quando o vendedor manda mensagem (em sequência). */
export const RESPOSTAS_SIMULADAS_DO_CLIENTE = [
  'Show! Vou dar uma olhada e te falo 👍',
  'E qual o prazo para entrega?',
  'Consigo passar aí amanhã à tarde?',
  'Perfeito, obrigado!',
  'Tem em outra cor?',
  'Ótimo, pode reservar para mim?',
];

/**
 * Contatos que chegam ao clicar em "Simular contato chegando".
 * Alguns são clientes novos; outros já existem, para mostrar as regras da
 * lista da vez (volta para o mesmo vendedor, IA vai para quem já atendeu).
 */
export const CONTATOS_SIMULADOS = [
  { origem: 'whatsapp', nome: 'Vinícius Rolim', telefone: '85984410273', bairro: 'Montese', interesse: 'Bike para começar a pedalar na Beira-Mar',
    conversa: [{ autor: 'cliente', texto: 'Oi! Quero começar a pedalar na Beira-Mar. Qual bike vocês indicam para iniciante?' }] },
  { origem: 'instagram', nome: 'Camila Nogueira', telefone: '85992218840', bairro: 'Meireles', interesse: 'Viu o reels da Oggi Agile e quer saber o preço',
    conversa: [{ autor: 'cliente', texto: 'Vi o reels da Oggi Agile! Qual o preço? 😍' }] },
  { origem: 'ia', nome: 'Henrique Pontes', telefone: '85987735519', bairro: 'Cocó', interesse: 'Trek Domane AL 2', valor: 8990,
    resumoIa: 'Quer a Trek Domane AL 2 (R$ 8.990, 1 em estoque, tamanho 56). Pediu parcelamento em 12x sem juros e desconto.',
    conversa: [
      { autor: 'cliente', texto: 'Boa noite, tem a Trek Domane AL 2 tamanho 56?' },
      { autor: 'ia', texto: 'Olá, Henrique! Temos 1 unidade da Trek Domane AL 2 no tamanho 56, por R$ 8.990.' },
      { autor: 'cliente', texto: 'Dá para fazer em 12x sem juros? Tem algum desconto?' },
      { autor: 'ia', texto: 'Parcelamento e desconto são com o nosso time de vendas. Vou te transferir agora, um momento!' },
    ] },
  { origem: 'whatsapp', idClienteExistente: 'c03', interesse: 'Voltou a perguntar sobre o orçamento da Sense',
    conversa: [{ autor: 'cliente', texto: 'Oi! Conversei com a minha esposa. Aquele valor da Sense ainda está de pé?' }] },
  { origem: 'ia', idClienteExistente: 'c07', interesse: 'Upgrade para Shimano 105 Di2', valor: 6800,
    resumoIa: 'Cliente já comprou a Specialized Tarmac. Quer trocar o grupo para Shimano 105 Di2 (R$ 6.800 com instalação) e perguntou se dá para parcelar sem juros.',
    conversa: [
      { autor: 'cliente', texto: 'Quero colocar Shimano 105 Di2 na minha Tarmac. Quanto fica?' },
      { autor: 'ia', texto: 'Olá, Rafael! O grupo Shimano 105 Di2 com instalação na oficina fica R$ 6.800.' },
      { autor: 'cliente', texto: 'Parcela sem juros?' },
      { autor: 'ia', texto: 'Quem fecha as condições é o time de vendas. Vou chamar quem já te atendeu!' },
    ] },
  { origem: 'instagram', nome: 'Bruna Leitão', telefone: '85995527704', bairro: 'Aldeota', interesse: 'Cadeirinha infantil para bike',
    conversa: [{ autor: 'cliente', texto: 'Olá! Vocês vendem cadeirinha infantil para bike?' }] },
];

/** Monta o conjunto completo de dados de demonstração para "agora". */
export function criarDadosDeDemonstracao(agora = new Date()) {
  const relogio = criarRelogio(agora);
  return {
    vendedores: VENDEDORES,
    clientes: criarClientes(relogio),
    bicicletas: BICICLETAS,
    oportunidades: criarOportunidades(relogio),
    tarefas: criarTarefas(relogio),
    interacoes: criarInteracoes(relogio),
    comprasSankhya: criarComprasSankhya(relogio),
    mensagens: criarMensagens(relogio),
    respostasRapidas: RESPOSTAS_RAPIDAS,
    modelos: MODELOS,
    catalogo: CATALOGO,
    // Maria chegou primeiro; Pedro está em pausa. João é o 2º da vez.
    fila: {
      data: chaveDoDia(agora),
      ordem: ['maria', 'joao', 'pedro'],
      situacao: { maria: 'disponivel', joao: 'disponivel', pedro: 'pausa' },
    },
    sincronizacaoSankhya: new Date(new Date(agora).getTime() - 2 * 60000).toISOString(),
  };
}
