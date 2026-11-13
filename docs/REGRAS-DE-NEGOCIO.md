# Regras de negócio — tela do vendedor

Regras combinadas com a loja em 13/11/2026. Cada regra aponta para o arquivo onde está no código.
Itens marcados **(a confirmar)** são premissas provisórias para validar com a equipe.

## Lista da vez (distribuição de contatos)

Arquivo: `js/regras/distribuicao.js`

A loja **não tem carteira** de clientes. Contatos novos são distribuídos por ordem justa.

1. **Quem entra na fila:** contatos do WhatsApp, Instagram e Assistente IA.
2. **Cliente na loja:** fica com quem o recebeu no balcão e **conta como a vez** dele.
   O gerente poderá mudar isso depois (configuração `canaisNaFila` e `balcaoContaComoVez`).
3. **Quem recebe vai para o fim da fila.**
4. **Presença:** a fila vale por um dia. No início do dia todos estão ausentes; quem marca presença
   entra no fim da fila (quem já esperava não perde a vez).
5. **Pausa:** quem está em pausa é pulado, mas mantém a posição ao voltar. **(a confirmar)**
6. **Cliente que volta:** se tem atendimento aberto, vai para o mesmo vendedor, sem gastar a vez dele.
   Não duplica o atendimento: cria um retorno "Responder: ..." para daqui a 15 minutos.
   Se não tem atendimento aberto, entra na fila normalmente.
7. **Transferência da IA:** vai para quem já atendeu o cliente (o mais recente), sem gastar a vez.
   Se o cliente nunca foi atendido, entra na fila.
8. **Todos veem a fila completa**, com a posição de cada um.
9. **Vendedor não recusa nem repassa** contato; só o gerente reatribui. **(a confirmar)**
10. **Ninguém disponível:** o contato fica sem vendedor e aparece um aviso. **(a confirmar: o que fazer nesse caso?)**

## Funil

Arquivo: `js/regras/funil.js`

- Etapas: **Novo → Atendendo → Orçamento → Negociação**, e depois **Ganho** ou **Perdido**.
- A partir de **Orçamento**, o valor é obrigatório (entra no "valor em jogo").
- O CRM registra **só o valor**: a conversa e o orçamento acontecem no WhatsApp.
- O CRM **não controla desconto**: isso é papel do ERP (Sankhya) e do gerente.
- Ganho e Perdido só pelos botões do painel do cliente (não se arrasta para eles).
- **Ganho** exige valor maior que zero, que conta na meta.
- **Perdido** exige motivo: Preço, Sem estoque, Comprou em outra loja, Desistiu, Sem retorno.
- **Alerta:** o card fica vermelho com **3 dias ou mais** sem contato. Os dias contam viradas de
  calendário (contato ontem às 23h, visto hoje às 8h = 1 dia).
- Dentro de cada coluna, quem está há mais tempo sem contato aparece primeiro.
- **Registrar contato** zera o alerta e conclui os retornos pendentes daquele atendimento.

## Meta e indicadores

Arquivo: `js/regras/metas.js`

- Cada vendedor tem **meta mensal em reais**, visível para ele.
- "Vendido no mês" = soma das oportunidades **ganhas** pelo vendedor e fechadas no mês corrente.
- Retorno **atrasado** = o horário combinado já passou, mesmo que seja hoje.
- "Vindos da IA" = atendimentos abertos que a IA transferiu.

## Meu dia

Arquivo: `js/regras/meu-dia.js`

Ordem de prioridade:

1. Transferências da IA ainda não abertas (o cliente está esperando).
2. Retornos atrasados.
3. Retornos de hoje, por horário.
4. Aniversariantes do dia entre os clientes que **este vendedor já atendeu**. **(a confirmar)**

Ao abrir uma transferência da IA, ela sai do topo do "Meu dia".

## Uso

- O CRM é usado **sempre no computador** (tela pensada a partir de 1280 px de largura).
- Tema escuro por padrão, com botão para o claro. A escolha fica salva no navegador.
