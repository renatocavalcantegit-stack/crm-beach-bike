// Regras das conversas (WhatsApp e Instagram) dentro do CRM.
//
// Arquivo PURO. Recebe a lista de mensagens de um cliente e responde perguntas
// como "a janela de 24 h está aberta?" e "quantas mensagens estão sem resposta?".
//
// Formato de uma mensagem:
//   { id, idCliente, canal: 'whatsapp' | 'instagram', autor: 'cliente' | 'ia' | 'vendedor' | 'sistema',
//     idVendedor, texto, foto: { imagem, legenda } | null, idModelo, enviadaEm, status }

/**
 * Regra da Meta (WhatsApp Business e Instagram): a loja só pode mandar mensagem
 * livre até 24 h depois da ÚLTIMA mensagem do cliente. Depois disso, só modelos
 * aprovados. Quando o cliente responde, a janela abre de novo.
 */
export const HORAS_DA_JANELA = 24;
const MILISSEGUNDOS_DA_JANELA = HORAS_DA_JANELA * 60 * 60 * 1000;

/** Limite de tamanho de mensagem de texto do WhatsApp. */
export const TAMANHO_MAXIMO_DA_MENSAGEM = 4096;

export const CANAIS = {
  whatsapp: { nome: 'WhatsApp', icone: 'brand-whatsapp' },
  instagram: { nome: 'Instagram', icone: 'brand-instagram' },
};

/** Canal da conversa a partir da origem do atendimento. A IA atende pelo WhatsApp. */
export function canalDaOrigem(origem) {
  if (origem === 'whatsapp' || origem === 'ia') return 'whatsapp';
  if (origem === 'instagram') return 'instagram';
  return null; // loja: atendimento presencial, sem conversa
}

export function ordenarMensagens(mensagens) {
  return [...mensagens].sort((a, b) => new Date(a.enviadaEm) - new Date(b.enviadaEm));
}

/** Mensagens que "falam" com o cliente (avisos internos do sistema não contam). */
function ehMensagemDaLoja(mensagem) {
  return mensagem.autor === 'vendedor' || mensagem.autor === 'ia';
}

export function ultimaMensagemDoCliente(mensagens) {
  return ordenarMensagens(mensagens).filter((m) => m.autor === 'cliente').pop() ?? null;
}

/**
 * Situação da janela de 24 h.
 * Sem nenhuma mensagem do cliente, a janela está fechada: a loja precisa
 * começar com um modelo aprovado.
 */
export function calcularJanela(mensagens, agora) {
  const ultima = ultimaMensagemDoCliente(mensagens);
  if (!ultima) return { aberta: false, restanteMs: 0, fechaEm: null };

  const fechaEm = new Date(new Date(ultima.enviadaEm).getTime() + MILISSEGUNDOS_DA_JANELA);
  const restanteMs = fechaEm - new Date(agora);
  return { aberta: restanteMs > 0, restanteMs: Math.max(restanteMs, 0), fechaEm: fechaEm.toISOString() };
}

/**
 * Mensagens do cliente sem resposta: as que chegaram depois da última
 * mensagem da loja (vendedor ou IA).
 */
export function contarSemResposta(mensagens) {
  const ordenadas = ordenarMensagens(mensagens);
  let contador = 0;
  for (const mensagem of ordenadas) {
    if (mensagem.autor === 'cliente') contador += 1;
    else if (ehMensagemDaLoja(mensagem)) contador = 0;
  }
  return contador;
}

/** Resumo usado nos cards do funil: quantas sem resposta e a última mensagem. */
export function resumirConversa(mensagens) {
  const visiveis = ordenarMensagens(mensagens).filter((m) => m.autor !== 'sistema');
  return {
    semResposta: contarSemResposta(mensagens),
    ultima: visiveis[visiveis.length - 1] ?? null,
    ultimaDoCliente: ultimaMensagemDoCliente(mensagens),
  };
}

/** Texto curto da mensagem para pré-visualização ("📷 Foto" vira "Foto: legenda"). */
export function previaDaMensagem(mensagem, tamanho = 60) {
  if (!mensagem) return '';
  const texto = mensagem.foto ? `Foto${mensagem.foto.legenda ? ': ' + mensagem.foto.legenda : ''}` : mensagem.texto;
  return texto.length > tamanho ? texto.slice(0, tamanho - 1).trimEnd() + '…' : texto;
}

export function validarMensagem(texto) {
  const limpo = String(texto ?? '').trim();
  if (!limpo) return { valido: false, erro: 'Escreva a mensagem' };
  if (limpo.length > TAMANHO_MAXIMO_DA_MENSAGEM) {
    return { valido: false, erro: `A mensagem passou de ${TAMANHO_MAXIMO_DA_MENSAGEM} caracteres` };
  }
  return { valido: true, texto: limpo };
}

/**
 * Pode mandar mensagem livre? Só com a janela aberta.
 * Fora da janela, a tela oferece os modelos aprovados.
 */
export function verificarEnvioLivre(mensagens, agora) {
  if (calcularJanela(mensagens, agora).aberta) return { permitido: true };
  return { permitido: false, erro: 'A janela de 24 h está fechada. Use um modelo aprovado.' };
}

/**
 * Preenche um modelo aprovado: "Oi {nome}, a {interesse} chegou!".
 * O nome usa só o primeiro nome do cliente, como se fala na loja.
 */
export function preencherModelo(textoDoModelo, { nomeCliente = '', interesse = '' }) {
  const primeiroNome = String(nomeCliente).trim().split(/\s+/)[0] ?? '';
  return textoDoModelo.replaceAll('{nome}', primeiroNome).replaceAll('{interesse}', interesse);
}

/** Separa as mensagens por dia, para mostrar "Hoje", "Ontem", "10/11" na conversa. */
export function agruparPorDia(mensagens) {
  const grupos = [];
  for (const mensagem of ordenarMensagens(mensagens)) {
    const data = new Date(mensagem.enviadaEm);
    const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
    const ultimoGrupo = grupos[grupos.length - 1];
    if (ultimoGrupo?.chave === chave) ultimoGrupo.mensagens.push(mensagem);
    else grupos.push({ chave, dia: mensagem.enviadaEm, mensagens: [mensagem] });
  }
  return grupos;
}
