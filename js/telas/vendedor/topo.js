// Topo da tela: saudação, busca de cliente, status do Sankhya e usuário.

import { pesquisarClientes } from '../../dados/clientes.js';
import { descreverTempoDecorrido, formatarTelefone, obterIniciais } from '../../regras/formatos.js';
import { avatar, criar, substituirConteudo } from '../../tela/dom.js';

const DIAS_DA_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function cumprimento(agora) {
  const hora = agora.getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function desenharSaudacao(elemento, vendedor, agora) {
  const primeiroNome = vendedor.nome.split(' ')[0];
  const data = `${DIAS_DA_SEMANA[agora.getDay()]}, ${agora.getDate()} de ${MESES[agora.getMonth()]}`;
  substituirConteudo(elemento, [criar('h1', { texto: `${cumprimento(agora)}, ${primeiroNome}` }), criar('p', { texto: data })]);
}

export function desenharUsuario(elemento, vendedor) {
  substituirConteudo(elemento, [
    avatar(obterIniciais(vendedor.nome), 'avatar-destaque'),
    criar('div', {}, [criar('strong', { texto: vendedor.nome.split(' ')[0] }), criar('div', { classe: 'texto-fraco', texto: 'Vendedor' })]),
  ]);
}

/** Selo azul "Sankhya sincronizado há 2 min": mostra que os dados do ERP estão em dia. */
export function desenharSincronizacao(elemento, ultimaSincronizacao, agora) {
  const quando = ultimaSincronizacao ? descreverTempoDecorrido(ultimaSincronizacao, agora) : 'aguardando';
  substituirConteudo(elemento, [criar('span', { classe: 'ponto-ao-vivo' }), `Sankhya · sincronizado ${quando}`]);
  elemento.title = 'Integração simulada no protótipo';
}

/**
 * Busca enquanto digita. Espera o vendedor parar de digitar por 200 ms antes
 * de pesquisar, para não buscar a cada letra.
 */
export function ligarBusca({ campo, resultados, aoEscolherCliente }) {
  let espera = null;

  campo.addEventListener('input', () => {
    clearTimeout(espera);
    espera = setTimeout(async () => {
      const encontrados = await pesquisarClientes(campo.value);
      desenharResultados(resultados, encontrados, campo.value, (cliente) => {
        campo.value = '';
        resultados.hidden = true;
        aoEscolherCliente(cliente);
      });
    }, 200);
  });

  campo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') resultados.hidden = true;
  });
  document.addEventListener('click', (evento) => {
    if (!evento.target.closest('.busca')) resultados.hidden = true;
  });
}

function desenharResultados(elemento, clientes, termo, aoEscolher) {
  if (termo.trim().length < 2) {
    elemento.hidden = true;
    return;
  }
  const itens = clientes.length
    ? clientes.map((cliente) =>
        criar('button', { classe: 'resultado-busca', atributos: { type: 'button' }, aoClicar: () => aoEscolher(cliente) }, [
          avatar(obterIniciais(cliente.nome)),
          criar('span', {}, [cliente.nome, criar('small', { texto: `${formatarTelefone(cliente.telefone)} · ${cliente.bairro || 'sem bairro'}` })]),
        ]),
      )
    : [criar('p', { classe: 'dia-vazio', texto: 'Nenhum cliente encontrado' })];
  substituirConteudo(elemento, itens);
  elemento.hidden = false;
}
