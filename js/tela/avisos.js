// Avisos rápidos no canto da tela ("Contato novo para você", "Venda registrada").

import { criar, icone } from './dom.js';

const DURACAO_PADRAO = 5500;

/** tipo: 'padrao' (amarelo) | 'tecnologia' (azul: IA, Sankhya) | 'erro' (vermelho) */
export function mostrarAviso({ titulo, texto = '', tipo = 'padrao', nomeIcone = 'bell', duracao = DURACAO_PADRAO }) {
  const area = document.getElementById('area-de-avisos');
  const aviso = criar('div', { classe: `aviso aviso-${tipo}`, atributos: { role: 'status' } }, [
    icone(nomeIcone),
    criar('div', {}, [criar('strong', { texto: titulo }), texto ? criar('p', { texto }) : null]),
  ]);
  area.append(aviso);
  setTimeout(() => aviso.remove(), duracao);
}

export function mostrarErro(erro) {
  mostrarAviso({ titulo: 'Não foi possível concluir', texto: erro.message ?? String(erro), tipo: 'erro', nomeIcone: 'alert-triangle' });
}
