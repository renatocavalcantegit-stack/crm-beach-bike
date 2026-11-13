// Modal e gaveta (painel lateral), as duas "camadas" que abrem por cima da tela.

import { criar } from './dom.js';

/** Erro de formulário com mensagens por campo: { nome: 'Informe o nome' }. */
export class ErroDeFormulario extends Error {
  constructor(erros) {
    super('Confira os campos destacados');
    this.erros = erros;
  }
}

/**
 * Abre um modal com formulário.
 *   campos: elementos do formulário (use campoDeTexto, campoDeSelecao...)
 *   aoConfirmar(dados): recebe os valores do formulário. Se lançar erro, o modal
 *   continua aberto mostrando a mensagem; se terminar bem, o modal fecha.
 * Devolve uma Promise: true se confirmou, false se cancelou.
 */
export function abrirModal({ titulo, subtitulo = '', campos = [], textoConfirmar = 'Salvar', classeConfirmar = 'botao-principal', aoConfirmar }) {
  return new Promise((resolver) => {
    const erroGeral = criar('p', { classe: 'erro-geral', atributos: { role: 'alert' } });
    const botaoConfirmar = criar('button', { classe: `botao ${classeConfirmar}`, texto: textoConfirmar, atributos: { type: 'submit' } });
    const formulario = criar('form', { atributos: { novalidate: true } }, [
      ...campos,
      erroGeral,
      criar('div', { classe: 'acoes-do-modal' }, [
        criar('button', { classe: 'botao botao-fantasma', texto: 'Cancelar', atributos: { type: 'button' }, aoClicar: () => fechar(false) }),
        botaoConfirmar,
      ]),
    ]);
    const modal = criar('div', { classe: 'modal', atributos: { role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo } }, [
      criar('h2', { texto: titulo }),
      subtitulo ? criar('p', { classe: 'subtitulo', texto: subtitulo }) : null,
      formulario,
    ]);
    const veu = criar('div', { classe: 'veu veu-do-modal', aoClicar: () => fechar(false) });

    function aoTeclar(evento) {
      if (evento.key === 'Escape') fechar(false);
    }

    function fechar(confirmou) {
      document.removeEventListener('keydown', aoTeclar);
      veu.remove();
      modal.remove();
      resolver(confirmou);
    }

    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      limparErros(formulario, erroGeral);
      botaoConfirmar.disabled = true;
      try {
        await aoConfirmar(Object.fromEntries(new FormData(formulario)));
        fechar(true);
      } catch (erro) {
        mostrarErros(formulario, erroGeral, erro);
        botaoConfirmar.disabled = false;
      }
    });

    document.addEventListener('keydown', aoTeclar);
    document.body.append(veu, modal);
    formulario.querySelector('input, select, textarea')?.focus();
  });
}

function limparErros(formulario, erroGeral) {
  erroGeral.textContent = '';
  formulario.querySelectorAll('.campo').forEach((campo) => {
    campo.classList.remove('com-erro');
    const mensagem = campo.querySelector('.erro-do-campo');
    if (mensagem) mensagem.textContent = '';
  });
}

function mostrarErros(formulario, erroGeral, erro) {
  if (!(erro instanceof ErroDeFormulario)) {
    erroGeral.textContent = erro.message;
    return;
  }
  for (const [nome, mensagem] of Object.entries(erro.erros)) {
    const campo = formulario.querySelector(`[name="${nome}"]`)?.closest('.campo');
    if (!campo) continue;
    campo.classList.add('com-erro');
    campo.querySelector('.erro-do-campo').textContent = mensagem;
  }
}

let gavetaAberta = null;

/** Abre o painel lateral (só um por vez). Devolve a função que fecha. */
export function abrirGaveta(conteudo, { aoFechar } = {}) {
  fecharGaveta();
  const veu = criar('div', { classe: 'veu', aoClicar: () => fecharGaveta() });
  const gaveta = criar('aside', { classe: 'gaveta', atributos: { role: 'dialog', 'aria-modal': 'true' } }, [conteudo]);

  function aoTeclar(evento) {
    // Com um modal aberto por cima, o Esc fecha só o modal.
    if (evento.key === 'Escape' && !document.querySelector('.modal')) fecharGaveta();
  }

  document.addEventListener('keydown', aoTeclar);
  document.body.append(veu, gaveta);
  gavetaAberta = { veu, gaveta, aoTeclar, aoFechar };
  return fecharGaveta;
}

export function fecharGaveta() {
  if (!gavetaAberta) return;
  const { veu, gaveta, aoTeclar, aoFechar } = gavetaAberta;
  gavetaAberta = null;
  document.removeEventListener('keydown', aoTeclar);
  veu.remove();
  gaveta.remove();
  aoFechar?.();
}

/** Troca o conteúdo da gaveta aberta (ao atualizar o painel sem fechar). */
export function trocarConteudoDaGaveta(conteudo) {
  if (gavetaAberta) gavetaAberta.gaveta.replaceChildren(conteudo);
}
