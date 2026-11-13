// Conversa do atendimento: balões das mensagens e a caixa de escrever.
//
// Só desenha. Quem envia e grava é o coordenador (atendimento.js), que passa
// as funções aoEnviar, aoEnviarModelo e aoEscolherFoto.

import { agruparPorDia, CANAIS, preencherModelo } from '../../regras/conversas.js';
import { descreverDiaDaConversa, descreverTempoRestante, formatarHora } from '../../regras/formatos.js';
import { criar, icone, selo, substituirConteudo } from '../../tela/dom.js';

const ICONE_DO_STATUS = { enviada: 'check', entregue: 'checks', lida: 'checks' };
const NOME_DO_STATUS = { enviada: 'Enviada', entregue: 'Entregue', lida: 'Lida' };

function autorDaMensagem(mensagem, vendedores) {
  if (mensagem.autor === 'ia') return 'Assistente IA';
  if (mensagem.autor === 'vendedor') return vendedores.find((v) => v.id === mensagem.idVendedor)?.nome.split(' ')[0] ?? 'Loja';
  return null;
}

function conteudoDoBalao(mensagem) {
  if (!mensagem.foto) return [criar('p', { classe: 'texto-do-balao', texto: mensagem.texto })];
  return [
    criar('img', { classe: 'foto-do-balao', atributos: { src: mensagem.foto.imagem, alt: mensagem.foto.legenda ?? 'Foto' } }),
    mensagem.foto.legenda ? criar('p', { classe: 'texto-do-balao', texto: mensagem.foto.legenda }) : null,
  ];
}

function rodapeDoBalao(mensagem) {
  const status = mensagem.status
    ? criar('span', { classe: `status-da-mensagem ${mensagem.status}`, atributos: { title: NOME_DO_STATUS[mensagem.status] } }, [icone(ICONE_DO_STATUS[mensagem.status])])
    : null;
  return criar('div', { classe: 'rodape-do-balao' }, [
    mensagem.idModelo ? criar('span', { texto: 'Modelo aprovado ·' }) : null,
    criar('span', { texto: formatarHora(mensagem.enviadaEm) }),
    status,
  ]);
}

function desenharMensagem(mensagem, vendedores) {
  if (mensagem.autor === 'sistema') {
    return criar('div', { classe: 'aviso-da-conversa' }, [icone('sparkles'), mensagem.texto]);
  }
  const autor = autorDaMensagem(mensagem, vendedores);
  return criar('div', { classe: `balao balao-${mensagem.autor}` }, [
    autor ? criar('span', { classe: 'autor-do-balao' }, [mensagem.autor === 'ia' ? icone('sparkles') : null, autor]) : null,
    ...conteudoDoBalao(mensagem),
    rodapeDoBalao(mensagem),
  ]);
}

/** Desenha todas as mensagens, separadas por dia, e rola até a última. */
export function desenharMensagens(elemento, { mensagens, vendedores, agora }) {
  if (mensagens.length === 0) {
    substituirConteudo(elemento, [criar('div', { classe: 'conversa-vazia', texto: 'Nenhuma mensagem ainda.' })]);
    return;
  }
  const blocos = agruparPorDia(mensagens).flatMap((grupo) => [
    criar('div', { classe: 'separador-de-dia' }, [criar('span', { texto: descreverDiaDaConversa(grupo.dia, agora) })]),
    ...grupo.mensagens.map((mensagem) => desenharMensagem(mensagem, vendedores)),
  ]);
  substituirConteudo(elemento, blocos);
  const rolarAteOFim = () => {
    elemento.scrollTop = elemento.scrollHeight;
  };
  rolarAteOFim();
  // Fotos podem terminar de carregar depois: rola de novo para a última mensagem continuar visível.
  elemento.querySelectorAll('img').forEach((imagem) => imagem.addEventListener('load', rolarAteOFim, { once: true }));
}

/** Faixa com o canal e o tempo que falta para a janela de 24 h fechar. */
function faixaDaJanela(canal, janela) {
  const dadosDoCanal = CANAIS[canal];
  return criar('div', { classe: `faixa-da-janela ${janela.aberta ? '' : 'fechada'}`.trim() }, [
    criar('span', {}, [icone(dadosDoCanal.icone), dadosDoCanal.nome]),
    janela.aberta
      ? criar('span', { texto: `Janela de 24 h aberta · fecha em ${descreverTempoRestante(janela.restanteMs)}` })
      : criar('span', {}, [icone('lock'), 'Janela de 24 h fechada: só modelos aprovados']),
  ]);
}

/** Janela fechada: o vendedor escolhe um modelo aprovado (já preenchido com o nome do cliente). */
function listaDeModelos({ modelos, cliente, oportunidade, aoEnviarModelo }) {
  return criar('div', { classe: 'lista-de-modelos' }, [
    criar('p', { classe: 'texto-fraco', texto: 'O cliente não fala com a loja há mais de 24 h. Quando ele responder, a conversa livre volta.' }),
    ...modelos.map((modelo) =>
      criar('div', { classe: 'modelo' }, [
        criar('div', {}, [
          criar('strong', { texto: modelo.nome }),
          criar('p', { texto: preencherModelo(modelo.texto, { nomeCliente: cliente.nome, interesse: oportunidade.interesse }) }),
        ]),
        criar('button', { classe: 'botao botao-pequeno', atributos: { type: 'button' }, aoClicar: () => aoEnviarModelo(modelo.id) }, [icone('send'), 'Enviar']),
      ]),
    ),
  ]);
}

/**
 * Janela aberta: respostas rápidas, campo de texto, foto e enviar.
 * O campo (rascunho) vem pronto do coordenador e é sempre o mesmo elemento:
 * redesenhar a conversa não apaga o que o vendedor estava escrevendo.
 */
function caixaDeEscrever({ rascunho, respostasRapidas, aoEnviar, aoEscolherFoto }) {
  const rapidas = criar(
    'div',
    { classe: 'respostas-rapidas' },
    respostasRapidas.map((resposta) =>
      criar('button', {
        classe: 'chip', texto: resposta.titulo,
        atributos: { type: 'button', title: resposta.texto },
        // Coloca o texto no campo (não envia direto): o vendedor pode ajustar antes.
        aoClicar: () => {
          rascunho.value = rascunho.value.trim() ? `${rascunho.value.trim()} ${resposta.texto}` : resposta.texto;
          rascunho.focus();
        },
      }),
    ),
  );
  return criar('div', { classe: 'caixa-de-escrever' }, [
    rapidas,
    criar('div', { classe: 'linha-de-escrever' }, [
      criar('button', { classe: 'botao botao-fantasma botao-icone', atributos: { type: 'button', title: 'Enviar foto do catálogo', 'aria-label': 'Enviar foto do catálogo' }, aoClicar: aoEscolherFoto }, [icone('photo')]),
      rascunho,
      criar('button', { classe: 'botao botao-principal', atributos: { type: 'button' }, aoClicar: aoEnviar }, [icone('send'), 'Enviar']),
    ]),
  ]);
}

/** Cria o campo de texto da conversa (uma vez por atendimento aberto). */
export function criarRascunho(aoEnviar) {
  const campo = criar('textarea', { classe: 'campo-da-mensagem', atributos: { rows: '2', placeholder: 'Escreva a mensagem · Enter envia, Shift+Enter pula linha', 'aria-label': 'Mensagem' } });
  campo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault();
      aoEnviar();
    }
  });
  return campo;
}

export function desenharCompositor(elemento, opcoes) {
  const { canal, janela } = opcoes;
  substituirConteudo(elemento, [
    faixaDaJanela(canal, janela),
    janela.aberta ? caixaDeEscrever(opcoes) : listaDeModelos(opcoes),
  ]);
}

/** Atendimento de balcão: não tem conversa (por enquanto). */
export function desenharAtendimentoPresencial(elemento, { aoRegistrarContato }) {
  substituirConteudo(elemento, [
    criar('div', { classe: 'conversa-presencial' }, [
      icone('building-store'),
      criar('strong', { texto: 'Atendimento presencial' }),
      criar('p', { texto: 'Este cliente foi atendido no balcão e não tem conversa de WhatsApp ou Instagram. Registre aqui o que foi conversado na loja ou por telefone.' }),
      criar('button', { classe: 'botao', atributos: { type: 'button' }, aoClicar: aoRegistrarContato }, [icone('message-check'), 'Registrar contato']),
    ]),
  ]);
}

/** Conversa de outro vendedor: só ele e o gerente veem. */
export function desenharConversaDeOutroVendedor(elemento, nomeDoVendedor) {
  substituirConteudo(elemento, [
    criar('div', { classe: 'conversa-presencial' }, [
      icone('lock'),
      criar('strong', { texto: `Atendimento de ${nomeDoVendedor}` }),
      criar('p', { texto: 'A conversa fica visível só para quem atende e para o gerente.' }),
      selo('Reatribuição só pelo gerente', { nomeIcone: 'user-shield' }),
    ]),
  ]);
}
