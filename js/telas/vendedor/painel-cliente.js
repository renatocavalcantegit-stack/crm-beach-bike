// Painel do cliente (abre pela direita ao clicar num card, num item do dia ou na busca).
// Reúne: dados do cliente, atendimento atual, resumo da IA, bicicletas,
// compras no Sankhya e linha do tempo.

import { buscarCliente, listarBicicletasDoCliente } from '../../dados/clientes.js';
import { listarInteracoesDoCliente } from '../../dados/interacoes.js';
import { listarOportunidadesDoCliente, marcarTransferenciaComoVista } from '../../dados/oportunidades.js';
import { buscarHistoricoDeCompras } from '../../dados/sankhya-simulado.js';
import { buscarEtapa, diasSemContato, estaAberta, foiTransferidaPelaIa, ORIGENS } from '../../regras/funil.js';
import {
  descreverDias, formatarData, formatarHora, formatarMoeda, formatarTelefone, montarLinkWhatsApp, obterIniciais,
} from '../../regras/formatos.js';
import { abrirGaveta, fecharGaveta, trocarConteudoDaGaveta } from '../../tela/camadas.js';
import { avatar, criar, icone, numero, selo } from '../../tela/dom.js';
import { abrirRegistroDeContato, confirmarGanho, confirmarPerda } from './modais.js';

/** Qual atendimento mostrar: o pedido, senão o aberto mais recente, senão o mais recente. */
function escolherOportunidade(oportunidades, idOportunidade) {
  return (
    oportunidades.find((o) => o.id === idOportunidade) ?? oportunidades.find(estaAberta) ?? oportunidades[0] ?? null
  );
}

function cabecalho(cliente) {
  const dados = [
    criar('span', {}, [icone('phone'), ' ', formatarTelefone(cliente.telefone)]),
    cliente.bairro ? criar('span', {}, [icone('map-pin'), ' ', cliente.bairro]) : null,
    criar('span', { texto: cliente.clienteDesde ? `Cliente desde ${new Date(cliente.clienteDesde).getFullYear()}` : 'Primeiro atendimento' }),
  ];
  return criar('header', { classe: 'painel-cabecalho' }, [
    avatar(obterIniciais(cliente.nome), 'avatar-grande avatar-destaque'),
    criar('div', {}, [
      criar('h2', { texto: cliente.nome }),
      criar('div', { classe: 'dados-basicos' }, dados),
      cliente.codigoParceiroSankhya
        ? criar('div', { classe: 'dados-basicos' }, [selo(`Sankhya · parceiro ${cliente.codigoParceiroSankhya}`, { tipo: 'tecnologia', nomeIcone: 'database' })])
        : null,
    ]),
    criar('button', { classe: 'botao botao-fantasma botao-icone fechar', atributos: { type: 'button', 'aria-label': 'Fechar painel' }, aoClicar: fecharGaveta }, [icone('x')]),
  ]);
}

function secaoOportunidade(oportunidade, cliente, { agora, aoAgir }) {
  if (!oportunidade) {
    return criar('section', { classe: 'painel-secao' }, [
      criar('h3', { classe: 'titulo-secao', texto: 'Atendimento' }),
      criar('p', { classe: 'texto-secundario', texto: 'Este cliente não tem atendimento registrado.' }),
    ]);
  }

  const aberta = estaAberta(oportunidade);
  const etapa = aberta ? buscarEtapa(oportunidade.etapa).nome : oportunidade.etapa === 'ganho' ? 'Ganha' : 'Perdida';
  const mensagem = `Olá, ${cliente.nome.split(' ')[0]}! Aqui é da Beach Bike Store.`;

  const resumo = criar('div', { classe: 'oportunidade-atual' }, [
    criar('div', { classe: 'dado' }, [criar('small', { texto: 'Etapa' }), criar('strong', { texto: etapa })]),
    criar('div', { classe: 'dado' }, [criar('small', { texto: 'Valor' }), numero(oportunidade.valor > 0 ? formatarMoeda(oportunidade.valor) : '—')]),
    criar('div', { classe: 'dado' }, [criar('small', { texto: 'Origem' }), criar('strong', { texto: ORIGENS[oportunidade.origem] })]),
  ]);

  const acoes = aberta
    ? criar('div', { classe: 'acoes-do-painel' }, [
        criar('a', { classe: 'botao botao-principal', atributos: { href: montarLinkWhatsApp(cliente.telefone, mensagem), target: '_blank', rel: 'noopener' } }, [
          icone('brand-whatsapp'), 'Conversar',
        ]),
        criar('button', { classe: 'botao', atributos: { type: 'button' }, aoClicar: () => aoAgir(abrirRegistroDeContato(oportunidade)) }, [
          icone('message-check'), 'Registrar contato',
        ]),
        criar('button', { classe: 'botao botao-sucesso', atributos: { type: 'button' }, aoClicar: () => aoAgir(confirmarGanho(oportunidade)) }, [
          icone('trophy'), 'Ganho',
        ]),
        criar('button', { classe: 'botao botao-alerta', atributos: { type: 'button' }, aoClicar: () => aoAgir(confirmarPerda(oportunidade)) }, [
          icone('x'), 'Perdido',
        ]),
      ])
    : criar('div', { classe: 'oportunidade-fechada', texto:
        oportunidade.etapa === 'ganho'
          ? `Venda fechada em ${formatarData(oportunidade.fechadaEm)}.`
          : `Perdida em ${formatarData(oportunidade.fechadaEm)} · motivo: ${oportunidade.motivoPerda}.` });

  const dias = diasSemContato(oportunidade, agora);
  return criar('section', { classe: 'painel-secao' }, [
    criar('h3', { classe: 'titulo-secao' }, [
      'Atendimento atual',
      aberta ? criar('span', { classe: 'texto-fraco', texto: `· último contato ${dias === 0 ? 'hoje' : 'há ' + descreverDias(dias)}` }) : null,
    ]),
    criar('strong', { texto: oportunidade.interesse }),
    resumo,
    acoes,
  ]);
}

function secaoResumoIa(oportunidade) {
  if (!oportunidade?.resumoIa) return null;
  return criar('section', { classe: 'painel-secao' }, [
    criar('div', { classe: 'resumo-ia' }, [
      criar('h3', { classe: 'titulo-secao' }, [icone('sparkles'), 'Resumo do assistente IA']),
      criar('p', { texto: oportunidade.resumoIa }),
    ]),
  ]);
}

function secaoBicicletas(bicicletas) {
  const linhas = bicicletas.length
    ? bicicletas.map((bike) =>
        criar('div', { classe: 'linha-simples' }, [
          criar('span', {}, [`${bike.marca} ${bike.modelo} ${bike.ano}`, criar('small', { texto: `Aro ${bike.aro} · quadro ${bike.quadro} · ${bike.cor}` })]),
          criar('span', { classe: 'numero texto-fraco', texto: bike.numeroSerie }),
        ]),
      )
    : [criar('p', { classe: 'texto-fraco', texto: 'Nenhuma bicicleta cadastrada.' })];
  return criar('section', { classe: 'painel-secao' }, [criar('h3', { classe: 'titulo-secao' }, [icone('bike'), 'Bicicletas']), criar('div', { classe: 'lista-simples' }, linhas)]);
}

/** Compras vêm do Sankhya (simulado), que responde mais devagar: mostra "carregando". */
function secaoCompras(cliente) {
  const lista = criar('div', { classe: 'lista-simples' }, [criar('div', { classe: 'carregando', texto: 'Consultando o Sankhya…' })]);

  if (!cliente.codigoParceiroSankhya) {
    lista.replaceChildren(criar('p', { classe: 'texto-fraco', texto: 'Ainda não é parceiro no Sankhya (nenhuma compra).' }));
  } else {
    buscarHistoricoDeCompras(cliente.codigoParceiroSankhya).then((compras) => {
      lista.replaceChildren(
        ...(compras.length
          ? compras.map((compra) =>
              criar('div', { classe: 'linha-simples' }, [
                criar('span', {}, [compra.descricao, criar('small', { texto: `${formatarData(compra.data)} · ${compra.nota}` })]),
                numero(formatarMoeda(compra.valor)),
              ]),
            )
          : [criar('p', { classe: 'texto-fraco', texto: 'Nenhuma compra encontrada.' })]),
      );
    });
  }

  return criar('section', { classe: 'painel-secao' }, [
    criar('h3', { classe: 'titulo-secao' }, [icone('receipt'), 'Compras', selo('Sankhya', { tipo: 'tecnologia' })]),
    lista,
  ]);
}

function secaoLinhaDoTempo(interacoes) {
  const eventos = interacoes.map((interacao) =>
    criar('div', { classe: `evento ${interacao.tipo}` }, [interacao.descricao, criar('small', { texto: `${formatarData(interacao.em)} · ${formatarHora(interacao.em)}` })]),
  );
  return criar('section', { classe: 'painel-secao' }, [
    criar('h3', { classe: 'titulo-secao' }, [icone('timeline'), 'Linha do tempo']),
    eventos.length ? criar('div', { classe: 'linha-do-tempo' }, eventos) : criar('p', { classe: 'texto-fraco', texto: 'Sem registros ainda.' }),
  ]);
}

async function montarConteudo({ idCliente, idOportunidade, aoMudar }) {
  const [cliente, oportunidades, bicicletas, interacoes] = await Promise.all([
    buscarCliente(idCliente),
    listarOportunidadesDoCliente(idCliente),
    listarBicicletasDoCliente(idCliente),
    listarInteracoesDoCliente(idCliente),
  ]);
  const oportunidade = escolherOportunidade(oportunidades, idOportunidade);

  // Depois de cada ação (contato, ganho, perda), redesenha o painel e a tela.
  async function aoAgir(acao) {
    if (!(await acao)) return;
    await aoMudar();
    trocarConteudoDaGaveta(await montarConteudo({ idCliente, idOportunidade: oportunidade.id, aoMudar }));
  }

  return criar('div', { classe: 'painel-cliente' }, [
    cabecalho(cliente),
    secaoOportunidade(oportunidade, cliente, { agora: new Date(), aoAgir }),
    secaoResumoIa(oportunidade),
    secaoBicicletas(bicicletas),
    secaoCompras(cliente),
    secaoLinhaDoTempo(interacoes),
  ]);
}

/** Abre o painel. Se for uma transferência da IA ainda não vista, marca como vista. */
export async function abrirPainelDoCliente({ idCliente, idOportunidade = null, aoMudar }) {
  abrirGaveta(criar('div', { classe: 'painel-secao' }, [criar('div', { classe: 'carregando', texto: 'Carregando cliente…' })]));

  const oportunidades = await listarOportunidadesDoCliente(idCliente);
  const oportunidade = escolherOportunidade(oportunidades, idOportunidade);
  if (oportunidade && foiTransferidaPelaIa(oportunidade) && !oportunidade.transferenciaVista) {
    await marcarTransferenciaComoVista(oportunidade.id);
    await aoMudar();
  }
  trocarConteudoDaGaveta(await montarConteudo({ idCliente, idOportunidade: oportunidade?.id, aoMudar }));
}
