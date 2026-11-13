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
   Não duplica o atendimento: a mensagem nova aparece na conversa e no "Meu dia" (sem resposta).
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
- O CRM registra **só o valor** da oportunidade (o orçamento não é itemizado).
- O CRM **não controla desconto**: isso é papel do ERP (Sankhya) e do gerente.
- Ganho e Perdido só pelos botões da tela de atendimento (não se arrasta para eles).
- A etapa também pode ser trocada no seletor do atendimento, com a mesma regra de arrastar o card.
- **Ganho** exige valor maior que zero, que conta na meta.
- **Perdido** exige motivo: Preço, Sem estoque, Comprou em outra loja, Desistiu, Sem retorno.
- **Alerta:** o card fica vermelho com **3 dias ou mais** sem contato. Os dias contam viradas de
  calendário (contato ontem às 23h, visto hoje às 8h = 1 dia).
- Dentro de cada coluna, quem está há mais tempo sem contato aparece primeiro.
- **Registrar contato** (ligação ou conversa na loja) zera o alerta e conclui os retornos pendentes
  daquele atendimento.
- **Mandar mensagem pelo chat também conta como contato**: zera o alerta, tira a transferência da IA
  do topo e conclui os retornos marcados **até o fim de hoje**. Retornos de outros dias continuam.
- O card mostra quantas mensagens do cliente estão **sem resposta** e a prévia da última mensagem.

## Atendimento e conversas

Arquivos: `js/regras/conversas.js` (regras), `js/dados/conversas.js` (envio e recebimento),
`js/telas/vendedor/atendimento.js` (tela).

**Todo o atendimento acontece dentro do CRM.** O vendedor não sai para o WhatsApp: lê e responde na
tela de atendimento. O cliente continua no WhatsApp (ou Instagram) dele; no sistema real, a ligação
é feita pela WhatsApp Business API (e pela API do Instagram) no servidor.

1. **WhatsApp e Instagram na mesma caixa.** O canal da conversa segue a última mensagem do cliente;
   sem mensagem ainda, vem da origem do atendimento (a IA atende pelo WhatsApp).
2. **Janela de 24 h** (regra da Meta): a loja só manda mensagem livre até 24 h depois da **última
   mensagem do cliente**. A loja mandar mensagem não reabre a janela. A tela mostra quanto falta.
3. **Fora da janela, só modelos aprovados:** Retomar interesse, Lembrete de retorno, Produto chegou.
   O modelo usa o primeiro nome do cliente e o interesse da oportunidade. Quando o cliente responde,
   a janela abre de novo.
4. **Respostas rápidas:** Horário, Endereço, Pagamento, Test ride, Revisão. O clique coloca o texto
   no campo (não envia direto), para o vendedor ajustar.
5. **Fotos do catálogo:** o vendedor envia fotos de produto com legenda (catálogo simulado).
6. **Mensagem sem resposta** = mensagem do cliente que chegou depois da última resposta da loja
   (vendedor ou IA). Avisos internos do sistema não contam como resposta.
7. **Cada vendedor vê só as conversas dele**; o gerente verá todas (quando existir a tela do gerente).
   Abrindo pela busca um cliente de outro vendedor, a conversa aparece bloqueada.
8. **Atendimento de balcão não abre conversa** por enquanto: a tela mostra "Atendimento presencial"
   e o botão Registrar contato.
9. **Transferência da IA:** a conversa da IA com o cliente fica na tela, com o aviso
   "Assistente IA transferiu o atendimento para ...". O resumo da IA aparece na coluna da direita.
10. Mensagem de texto tem limite de 4.096 caracteres e não pode ir vazia.
11. Quando o cliente responde e o atendimento dele não está aberto na tela, aparece um aviso
    "Fulano respondeu" (só para o vendedor do atendimento).

Status das mensagens da loja: **enviada** (✓), **entregue** (✓✓) e **lida** (✓✓ verde).

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
2. Clientes **aguardando resposta** (mandaram mensagem e ninguém respondeu), do mais antigo para o
   mais recente. A transferência da IA não vista não se repete aqui.
3. Retornos atrasados.
4. Retornos de hoje, por horário.
5. Aniversariantes do dia entre os clientes que **este vendedor já atendeu**. **(a confirmar)**

Ao abrir uma transferência da IA, ela sai do topo do "Meu dia".

## Uso

- O CRM é usado **sempre no computador** (tela pensada a partir de 1280 px de largura).
- Tema escuro por padrão, com botão para o claro. A escolha fica salva no navegador.
