// Preferências de quem está usando a tela: tema (escuro/claro) e, só na
// demonstração, qual vendedor está sendo visto ("ver como").
// Com login de verdade, o vendedor virá do usuário logado.

import { gravar, ler } from './armazenamento.js';

const PADRAO = { tema: 'escuro', idVendedorAtual: 'joao' };

function lerPreferencias() {
  return { ...PADRAO, ...ler('preferencias', {}) };
}

export function obterTema() {
  return lerPreferencias().tema;
}

export function salvarTema(tema) {
  gravar('preferencias', { ...lerPreferencias(), tema });
}

export function obterIdVendedorAtual() {
  return lerPreferencias().idVendedorAtual;
}

export function salvarIdVendedorAtual(idVendedor) {
  gravar('preferencias', { ...lerPreferencias(), idVendedorAtual: idVendedor });
}
