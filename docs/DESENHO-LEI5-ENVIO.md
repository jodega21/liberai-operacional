# Desenho LEI5 — Envio do demonstrativo e canal de correspondencia

Status (01/11/2026): E1-E9 decididos por Daniel em 31/10 (todas as recomendacoes); fatia 1 feita (CAD33 do liberai-cadastros). Historico: DESENHO (30/10/2026); Daniel fechou as decisoes E1-E9 e
a implementacao segue por fatias. Pedido de Daniel (30/10, apos a conversa com a operacao): botao "Enviar" no
ciclo depois de lancar os boletos; cada cliente recebe pelo seu canal (e-mail, carta, WhatsApp, outros); o
WhatsApp tem que existir ("o mais promissor hoje"); automatizar o envio e mandar junto NF e boleto ficam para
depois.

## Fatos (recon de 30/10, so leitura)

Cadastro (public.clientes, 156 moradores atuais da leitura):
- email preenchido em 146; 13 deles com e-mail generico da Libergas (libergas@, adm@, adm1@ - La Citta 11,
  Moscato 1, Solar das Rosas 1) - Daniel confirma se sao "sem e-mail".
- telefone_principal em 137; telefone_whatsapp existe e esta VAZIO em todos; 8 sem nenhum contato.
- Nao existe campo de canal de correspondencia. leitura.condominios.emails_demonstrativo existe (Moscato e
  Cadiz preenchidos).
- O app de cadastros ainda nao edita contato da pessoa ("Edicao de cliente e cliente novo" segue no ROADMAP
  do cadastros). Os contatos vieram das cargas do NFe/Tele (BS).

Operacao hoje (Daniel, 30/10):
- O BS emite NF e boleto e manda por e-mail de nfe@libergas.com.br; a NF cai numa pasta do servidor, o
  boleto numa pasta do PC que emitiu. Por ora o demonstrativo vai separado; "tudo junto" quando a NF for
  emitida no LiberAI.
- (54) 3227-2263 e WhatsApp Business. Hoje o atendimento usa o SmBot para varios atendentes ao mesmo tempo no
  mesmo numero - conexao NAO oficial (Daniel, 30/10).
- E-mail de @libergas.com.br: mesma hospedagem do site - cPanel compartilhado (servidor h230us.hmservers.net,
  pacote Empresarial50, IP compartilhado 107.161.183.174; print do cPanel de Daniel, 30/10). Daniel tem acesso
  ao cPanel e ao Meta Business.
- Os 13 e-mails genericos (libergas@, adm@, adm1@) sao "sem e-mail" (Daniel, 30/10) - limpar na fatia 1.

WhatsApp (documentacao da Meta, consultada 30/10):
- Coexistencia: o numero do app WhatsApp Business pode ser ligado a Cloud API e continuar no app, com o
  historico 1:1 sincronizado (ultimos 6 meses). A entrada e pelo Embedded Signup de um Solution Partner /
  Tech Provider (provedor), nao direto.
- O que muda no app depois: listas de transmissao desativadas (as existentes ficam so leitura); mensagens
  temporarias desligadas nas conversas 1:1; visualizacao unica e localizacao em tempo real desligadas;
  aparelhos conectados sao desligados e precisam ser religados - WhatsApp for Windows NAO e suportado. Grupos
  nao vao para a API. Vazao fixa de 20 mensagens/s.
- Preco: por mensagem entregue desde 01/07/2025, por categoria e pais. Utility (aviso de conta/cobranca) para
  o Brasil: cerca de US$ 0,0068 por mensagem na tabela comparativa da Meta (tabela oficial em USD; BRL para
  contas elegiveis). Desde 01/10/2026 utility dentro da janela de atendimento tambem e cobrada. Mensagem
  enviada pelo app continua gratis. O provedor cobra a parte dele.
- Mensagem iniciada pela empresa fora da janela de 24 h precisa de modelo (template) aprovado pela Meta.

## Arquitetura proposta

Cadastros (pessoa) -> canal + contatos  |  Operacional (ciclo fechado com documento) -> botao Enviar ->
registro de envio (um por destinatario/canal) -> e-mail (servico de envio) | WhatsApp (provedor) | carta
(impressao so desses) -> status de cada envio na tela do ciclo.

## Fatias (ordem sugerida)

1. Contatos e canal no Cadastros: editar e-mail, WhatsApp e canal de correspondencia na ficha (chave nova);
   limpar os 13 e-mails genericos conforme Daniel.
2. Registro de envio + botao Enviar no ciclo (e-mail): envia o demonstrativo de cada unidade com documento
   lancado; mostra enviado/falhou por unidade; reenvio manual.
3. Carta: a impressao do ciclo separa quem recebe por carta.
4. PDF no servidor (pre-requisito do WhatsApp; opcional no e-mail).
5. WhatsApp: modelo aprovado + envio pelo provedor; respostas do morador chegam no app (coexistencia).
Em paralelo, desde ja (prazo da Meta): verificacao do negocio no Meta Business e escolha do provedor.

## Decisoes para Daniel (cada uma com recomendacao)

E1 - Onde fica o canal da pessoa
- A) colunas em public.clientes: canal_correspondencia (email | whatsapp | carta | sindico | outro) + os
  campos que ja existem (email, telefone_whatsapp). RECOMENDADO para a fatia 1 (simples, um canal por pessoa).
- B) tabela de contatos por pessoa (varios e-mails/telefones, cada um com finalidade: cobranca, pedidos...).
  Mais flexivel para pedidos e atendente IA; mais trabalho agora.

E2 - Quem manda nos contatos (LiberAI x BS)
- A) LiberAI passa a ser a fonte de canal e contatos de correspondencia; a sincronizacao futura com o BS nao
  sobrescreve esses campos. RECOMENDADO.
- B) continuar editando no BS e trazer por carga (o LiberAI so le).

E3 - Servico de e-mail
- A) servico de envio por API (ex.: Resend ou Amazon SES) com remetente do dominio (ex.: leitura@libergas.com.br),
  autenticado por SPF/DKIM no DNS. RECOMENDADO (entregabilidade, status por envio). Planos e precos a
  confirmar na hora de contratar.
- B) SMTP do provedor que ja hospeda @libergas.com.br (o mesmo do nfe@). Sem contrato novo; limites e
  entregabilidade do provedor; status mais pobre.
- Hospedagem: cPanel compartilhado (acima). B e viavel ja (SMTP do cPanel), com o risco do IP compartilhado
  (reputacao de outros sites do servidor afeta a entrega). Para A, os registros SPF/DKIM entram no DNS - se os
  nameservers do dominio apontam para essa hospedagem, pelo "Zone Editor" do cPanel (conferir na fatia 2).

E4 - Formato do e-mail
- A) demonstrativo em HTML no corpo do e-mail (sem PDF). RECOMENDADO para comecar (nao depende da fatia 4).
- B) PDF anexo (depende da fatia 4).

E5 - Como gerar o PDF no servidor (fatia 4)
- A) navegador headless na Vercel renderizando a mesma pagina de impressao (mesmo layout, uma manutencao so);
  a validar em prototipo (tamanho da funcao, tempo para um ciclo inteiro). RECOMENDADO.
- B) biblioteca de PDF em JS (refaz o layout; leve e previsivel, duas versoes do desenho para manter).
- C) sem PDF: link seguro (token, com validade) para a pagina do demonstrativo. Mais simples; o morador abre
  no navegador.

E6 - Provedor do WhatsApp
- A) provedor oficial (BSP) que ofereca caixa multiatendente + API, SUBSTITUINDO o SmBot, com o numero
  (54) 3227-2263 migrado para ele (por coexistencia ou migracao). RECOMENDADO: resolve o envio, troca a
  conexao nao oficial (risco de bloqueio do numero) e ja e a base do atendente IA. Atencao: a coexistencia
  desliga os aparelhos conectados - se o SmBot conecta como aparelho conectado (WhatsApp Web), ele cai.
- A2) BSP so para envio (API) com coexistencia, mantendo SmBot + app. Depende de o SmBot sobreviver a
  coexistencia (provavelmente nao, pelo ponto acima) - testar antes de assumir.
- B) numero novo so para a API (o atual fica intocado no app). Sem perdas no app, mas o cliente ve dois
  numeros da Libergas.
- Daniel tem acesso ao Meta Business. Proximo: verificacao do negocio no Meta Business e cotacao de 2-3 BSPs
  com caixa multiatendente (preco por atendente + repasse da Meta por mensagem).

E7 - Registro de envio
- A) schema generico de comunicacao (envio: canal, destinatario, documento de origem, status, id no provedor,
  erro, quem enviou, quando) para servir depois a pedidos, NF e atendimento. RECOMENDADO.
- B) tabela so da leitura (leitura.envios).

E8 - Carta
- A) impressao separa quem recebe por carta; a entrega e pela portaria/sindico do condominio. RECOMENDADO
  (definir com a operacao quem entrega).
- B) carta pelos Correios (etiqueta com endereco; custo de postagem).

E9 - Comunicado do primeiro mes
- A) vai junto no primeiro envio de cada pessoa (texto acima do demonstrativo no e-mail; folha junto na
  carta; mensagem no WhatsApp). RECOMENDADO, se os envolvidos aprovarem o texto (modelo entregue 30/10).
- B) separado, so impresso.

## Riscos

- Envio errado nao tem volta: comecar com botao Enviar e resumo antes de confirmar; automatico so depois.
- LGPD: demonstrativo tem nome, consumo e valor do morador; e-mail/WhatsApp so para o contato do proprio
  morador; registro do envio guarda o destinatario usado.
- Contatos das cargas antigas podem estar errados ou ser de outra pessoa (os 13 genericos sao um exemplo):
  conferir antes do primeiro envio em massa.
- WhatsApp: a coexistencia muda o uso do app no dia a dia (ver acima); combinar com quem atende.

## Fora desta frente (registrado no ROADMAP)

- Envio automatico quando conferido e com boleto lancado.
- NF e boleto junto com o demonstrativo (quando a NF for emitida no LiberAI).
- Atendente IA no WhatsApp e no telefone para pedidos.
