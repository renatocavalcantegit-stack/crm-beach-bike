// Retornos agendados ("ligar para o cliente amanhã às 10h").

import { aguardar, gerarId, gravar, ler } from './armazenamento.js';

export async function listarTarefas() {
  await aguardar();
  return ler('tarefas', []);
}

export async function criarTarefa({ idOportunidade, idCliente, idVendedor, descricao, dataHora }) {
  const tarefa = { id: gerarId('tar'), idOportunidade, idCliente, idVendedor, descricao, dataHora, concluida: false };
  gravar('tarefas', [...ler('tarefas', []), tarefa]);
  return tarefa;
}

export async function concluirTarefa(idTarefa) {
  const tarefas = ler('tarefas', []).map((tarefa) => (tarefa.id === idTarefa ? { ...tarefa, concluida: true } : tarefa));
  gravar('tarefas', tarefas);
}

/** Ao registrar um contato, os retornos pendentes daquela oportunidade são dados como feitos. */
export async function concluirTarefasDaOportunidade(idOportunidade) {
  const tarefas = ler('tarefas', []).map((tarefa) =>
    tarefa.idOportunidade === idOportunidade ? { ...tarefa, concluida: true } : tarefa,
  );
  gravar('tarefas', tarefas);
}
