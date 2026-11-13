// Ferramentas só da demonstração: trocar de vendedor, simular contatos, restaurar dados.
// Com login e integrações de verdade, esta caixa deixa de existir.

import { criar, icone, substituirConteudo } from '../../tela/dom.js';
import { campoDeSelecao } from '../../tela/campos.js';

export function desenharFerramentasDemo(elemento, { vendedores, idVendedorAtual, aoTrocarVendedor, aoSimularContato, aoRestaurar }) {
  const seletor = campoDeSelecao({
    nome: 'verComo',
    rotulo: 'Ver como',
    opcoes: vendedores.map((vendedor) => ({ valor: vendedor.id, texto: vendedor.nome })),
    valor: idVendedorAtual,
  });
  seletor.querySelector('select').addEventListener('change', (evento) => aoTrocarVendedor(evento.target.value));

  substituirConteudo(elemento, [
    criar('h2', { classe: 'titulo-secao' }, [icone('flask'), 'Modo demonstração']),
    seletor,
    criar('button', { classe: 'botao', atributos: { type: 'button' }, aoClicar: aoSimularContato }, [icone('message-plus'), 'Simular contato chegando']),
    criar('button', { classe: 'botao botao-pequeno', atributos: { type: 'button' }, aoClicar: aoRestaurar }, [icone('refresh'), 'Restaurar dados']),
  ]);
}
