// Utilitários para montar a tela sem framework.
//
// Regra de segurança: texto vindo dos dados entra SEMPRE como texto
// (textContent), nunca como HTML. Assim um nome de cliente com "<script>"
// aparece escrito na tela em vez de ser executado.

/**
 * Cria um elemento.
 *   criar('button', { classe: 'botao', texto: 'Salvar', aoClicar: salvar })
 *   criar('div', { classe: 'linha' }, [filho1, filho2])
 * "atributos" recebe qualquer atributo HTML (type, title, aria-label...).
 */
export function criar(tag, opcoes = {}, filhos = []) {
  const elemento = document.createElement(tag);
  const { classe, texto, atributos = {}, aoClicar, dados = {} } = opcoes;

  if (classe) elemento.className = classe;
  if (texto !== undefined && texto !== null) elemento.textContent = texto;
  for (const [nome, valor] of Object.entries(atributos)) {
    if (valor === false || valor === null || valor === undefined) continue;
    elemento.setAttribute(nome, valor === true ? '' : valor);
  }
  for (const [nome, valor] of Object.entries(dados)) elemento.dataset[nome] = valor;
  if (aoClicar) elemento.addEventListener('click', aoClicar);

  adicionarFilhos(elemento, filhos);
  return elemento;
}

/** Ícone da biblioteca Tabler (https://tabler.io/icons), ex.: icone('brand-whatsapp'). */
export function icone(nome, classeExtra = '') {
  return criar('i', { classe: `ti ti-${nome} ${classeExtra}`.trim(), atributos: { 'aria-hidden': 'true' } });
}

/** Troca todo o conteúdo de um elemento pelos filhos informados. */
export function substituirConteudo(elemento, filhos) {
  elemento.replaceChildren();
  adicionarFilhos(elemento, filhos);
}

function adicionarFilhos(elemento, filhos) {
  const lista = Array.isArray(filhos) ? filhos : [filhos];
  for (const filho of lista) {
    if (filho === null || filho === undefined || filho === false) continue;
    elemento.append(typeof filho === 'string' ? document.createTextNode(filho) : filho);
  }
}

/** Avatar redondo com as iniciais. */
export function avatar(iniciais, classeExtra = '') {
  return criar('span', { classe: `avatar ${classeExtra}`.trim(), texto: iniciais, atributos: { 'aria-hidden': 'true' } });
}

/** Número em fonte de painel (largura fixa). */
export function numero(texto, classeExtra = '') {
  return criar('span', { classe: `numero ${classeExtra}`.trim(), texto });
}

/** Selo pequeno (badge). tipo: '' | 'tecnologia' | 'alerta' | 'destaque' | 'sucesso' */
export function selo(texto, { tipo = '', nomeIcone = null } = {}) {
  return criar('span', { classe: `selo ${tipo ? 'selo-' + tipo : ''}`.trim() }, [nomeIcone ? icone(nomeIcone) : null, texto]);
}
