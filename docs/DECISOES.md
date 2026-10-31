# Decisoes — LiberAi Operacional

Sistema operacional novo da Libergas (G1-B, Daniel 25/10/2026): vendas, estoque e, no futuro, vale-gas e residual, no padrao do
financeiro e do cadastros (Next.js, escrita pelo servidor, RBAC acesso, apontamentos). Primeiro modulo: leitura de medidores
(Daniel, 28/10). Banco Supabase compartilhado com o liberai-financeiro e o liberai-cadastros.

### LEI2 — Leitura de medidores: lancamento mensal, historico 2026 e faturamento

**Decidido em:** 28-30/10/2026 · **Status:** em producao. Migrations 20261029130000, 20261029150000, 20261029160000,
20261029171000, 20261029180000, 20261029190000 (carga em 10 partes) e 20261030120000 aplicadas via Studio em 29/10 e registradas
(conferido no banco 30/10). Validado por Daniel no browser (lancamento, saida, ciclo completo de faturamento desfeito, historico).
Commits f6afabe (base), bf82331 e 8ba8b24 (db), 2a8e535 (codigo), e55e5d5 (teste); push e projeto na Vercel por Daniel em 30/10.

**Base e layout**
- App novo a partir do liberai-cadastros (login, RBAC, botao de ajuda). Cada app com layout proprio (Daniel 29/10): aqui menu na
  LATERAL DIREITA (no celular abre da direita), laranja da marca #e1a064 (manual da marca, pag. 21), titulos em Maven Pro.
  Texto sobre o laranja escuro (#2b1a0b); texto laranja = #9a5a1e (contraste).
- Chaves: operacional.leitura.lancar (Administrador e Operador; inclui abrir o ciclo) e operacional.leitura.fechar (so
  Administrador: fechar, reabrir, excluir ciclo vazio, documento de cobranca). Apontamentos: este app so aponta (area leitura);
  a caixa fica no cadastros.

**Lancamento**
- IA nao le a foto (Daniel 28/10, depois do teste nas 80 fotos do Monte Castelo: gpt-5.4-mini acertou 34 + 22 acumulados de 72,
  5 erros grandes barrados pelas checagens; custo ~R$ 0,01/foto). O operador digita; a foto fica como registro.
- F1-A tela no celular, foto da camera ou da galeria, reduzida no navegador (~300 KB); bucket privado leitura-fotos, URL
  assinada de 1 h. F7-A foto obrigatoria quando quem le e a Libergas, opcional para o sindico (leituras chegam por e-mail).
- F3-A ciclo mensal por condominio; no fechamento o preco do m3 (leitura.preco_m3_em) e o minimo ficam congelados.
- F6-A leitura real sempre; a cobranca parte da ULTIMA LEITURA COBRADA. Valor abaixo do minimo (R$ 65; Cadiz 0) = "acumula".
- R1-A leitura menor que a anterior e recusada. R2 consumo acima de max(10 m3, 3x o esperado pela media diaria dos ~6 meses)
  ou, sem historico, acima de 30 m3 pede "conferi" (limite fixo apos o 136000 digitado sem virgula no teste de 29/10).
- R3-B fecha com unidade sem leitura se confirmado. R4-A saida do morador: leitura avulsa no dia, cobrada na hora mesmo abaixo do
  minimo; recusa se a unidade tiver leitura em ciclo aberto. Ciclo fechado nao muda; so o ultimo reabre; ciclo aberto vazio pode
  ser excluido (mes errado).
- Tela: leitura salva fica travada (botao Corrigir); previa do consumo e do valor enquanto digita; resumo no topo (a cobrar,
  acumulam, em aberto, leituras); saida de morador escondida atras de botao vermelho (Daniel lancou nela por engano em 29/10).

**Historico 2026 (opcao A, Daniel 29/10)**
- Ciclos jan-out fechados com as leituras (origem 'planilha', sem foto) e as cobrancas COM O VALOR DA PLANILHA (nao recalculadas).
  Fonte: planilhas "Leituras/3 Leituras/*/2026", conferencia em "Leituras/Historico 2026 - conferencia.xlsx".
- Mahe: troca de todos os medidores em abril (ABR (2) = 1a leitura do novo; a cobranca de abril soma as duas abas). Belle Ville:
  troca entre FEV e MAR. Lauro: aba JAN incorreta (parte de fevereiro) - fora. Prolar Cadiz: minimo 0, cobrado do condominio;
  A201 = 258,000 da planilha (o 257 da carga de 28/10 era teste). Moradores por cod BS de cada mes (historico de ocupantes).
- Consumo em aberto (Daniel 29/10): consumo que ficou para tras (acumula e a planilha recomecou do numero seguinte sem cobrar)
  vira cobrancas.consumo_em_aberto e entra na proxima cobranca (quitada_por), aparecendo no faturamento. Casos: Lauro mar/2026
  (7 aptos) e La Citta mai/2026 (305, 409).
- Conferido no banco: 127 ciclos, 1.688 leituras, 1.688 cobrancas (789 cobrar), R$ 95.096,61 cobrados, 31 medidores antigos.

**Faturamento (no padrao do vale-gas)**
- Impressao pelo navegador (A4 paisagem): uma linha por unidade a cobrar com a composicao (acumulados e em aberto) e a coluna do
  boleto. D1-A documento por cobranca; quando quem paga e o condominio (pacote intermediario/basico), um so no ciclo, no resumo.
  D2-B boleto/NF-e/recibo, sugerido pelo pagamento padrao da pessoa (vazio hoje -> boleto). D4 historico = "Faturado (planilha)".
  D5 ciclo com documento nao reabre.
- Teste: supabase/testes (PGlite) - 128 verificacoes, inclusive o replay do Monte Castelo 2026 (80/80 com a planilha). App: 59
  testes, typecheck, lint e build OK.

### LEI3 — Paginacao das consultas da leitura e teste da trava do medidor

**Decidido em:** 30/10/2026 · **Status:** em producao - commits ea00e5b, da895ff, c70b361 e eacdeae, push 30/10 (a migration da trava e do cadastros, aplicada 30/10).

- Paginacao (opcao A, Daniel 30/10): lerPaginado (src/lib/leitura/paginar.ts), mesmo padrao do liberai-financeiro - pagina de 1.000
  com ordem total terminando em id. Descartadas: limitar por periodo (unidade sem cobranca ha muito tempo sumiria da conta) e
  mover para funcoes SQL (migration a mais sem ganho hoje). Paginadas em carregar.ts: ciclos (lista e condominio), saidas, ultimas
  leituras, cobrancas cobradas, medidores, leituras anteriores e historico de cobrancas. A ordem dos medidores passou a
  instalado_em, criado_em, id (igual a _base_cobranca).
- Trava do medidor: as funcoes sao do liberai-cadastros (DECISOES LEI3 de la); o teste fica aqui no bloco F de supabase/testes,
  que agora aplica a secao 1 de 20261028140000 e a 20261030130000 do cadastros.
- Teste: PGlite 147 verificacoes (19 novas), 0 falhas. App: 64 testes (5 novos de paginacao), typecheck, lint e build OK.

### LEI4 — Demonstrativo do morador e resumo do condominio (impressos)

**Decidido em:** 30/10/2026 · **Status:** validado por Daniel no browser local (30/10, depois dos ajustes); commits dfd2232 e e6efc16; push pendente no fechamento de 30/10. Sem migration.

- Esboco aprovado por Daniel (30/10) com os dados reais do Monte Castelo out/2026; recomendacoes aceitas: D1-A meia folha A4, dois por folha com linha de corte; D2-A todas as unidades com leitura no ciclo fechado, inclusive as que acumulam ("Sem cobranca neste mes"); D3-A historico do ano em barras; D5-A no ciclo fechado, botoes "Demonstrativos" e "Resumo do condominio" e link "Demonstrativo" por unidade (?unidade=).
- Marca: logo da Libergas com o selo Nacional Gas (arquivo do Project "Marca Principal nacionalgas CMYK", convertido para public/marca-libergas.jpg, 1400 px). Cores da marca fixas no papel (azul #557dbe, laranja #e1a064).
- Contato (Daniel): WhatsApp (54) 3227-2263 com QR code para conversa direta (https://wa.me/555432272263, public/whatsapp-qr.svg gerado uma vez; conferido lendo o QR da pagina impressa). Icone generico de mensagem ao lado do numero (o simbolo oficial do WhatsApp e marca registrada; se quiser o oficial, usar o arquivo do kit de marca da Meta).
- Conteudo do morador: leitura anterior (base da cobranca, com a data) e atual, consumo em m3 e kg (fator da central), preco do m3, dias, valor e vencimento; acumulados/em aberto em "Inclui"; condominio que paga (intermediario/basico) mostra "Valor do consumo, rateado pelo condominio", sem vencimento. "Documento informativo, sem valor fiscal" em todas as folhas (risco ANP ja assumido na transicao, KNOWN_ISSUES do cadastros).
- Resumo do condominio: consumo da central no mes (soma do consumo mensal das unidades) em m3, kg e P45 equivalentes; uma linha por unidade; total cobrado; documento do condominio quando ele paga.
- Historico do ano = diferenca entre leituras MENSAIS seguidas da unidade, somando medidores trocados (mesma conta do leitura._consumo). Antes de out/2026 reflete a planilha, que repetia o numero do relogio nos meses que acumulavam (barras zeradas e um pico no mes cobrado, ex.: Monte Castelo 101 e 402).
- Codigo: src/lib/leitura/demonstrativo.ts (puro), carregarDemonstrativos em carregar.ts (paginado), rotas /leitura/ciclo/[id]/demonstrativos e /resumo, A4 retrato so nelas (o faturamento segue em paisagem).
- Ajustes depois da conversa de Daniel com a operacao (30/10): (1-A) cada barra mostra m3 e o valor do consumo do mes (m3 x preco do m3 da propria cobranca da unidade; sem preco - acumuladas da planilha - o preco mais comum do ciclo, porque na planilha o preco varia por unidade: Monte Castelo set/2026 22,35 e 38,18, Mahe seis precos); mes acumulado com "+" (soma com o seguinte); mes cobrado por valor diferente do proprio consumo com "= total cobrado"; legenda embaixo. Numero do boleto (ou NF-e/recibo) lancado no faturamento aparece abaixo do valor; "Faturado (planilha)" nao aparece.
- Comunicado aos moradores (primeiro demonstrativo): modelo em PDF (comunicado + demonstrativo de exemplo numa A4) entregue a Daniel para mostrar aos envolvidos; entrar no sistema (opcao A, caixa "Incluir comunicado") fica para depois dessa conversa.
- Teste: 19 novos (83 no total), typecheck, lint e build OK. Render com dados reais (so leitura) em PDF A4: 8 demonstrativos em 4 folhas, resumo em 1.

### LEI4b — La Citta out/2026 lancado por planilha (antes do sistema)

**Decidido em:** 30/10/2026 · **Status:** aplicado via Studio por Daniel em 30/10 (script supabase/dados/20261030150000_la_citta_leitura_out2026.sql, fora do git); ciclo fechado por Daniel no app.

- Leitura de 20/10/2026 da planilha (anterior ao sistema): 41 leituras com origem 'planilha', sem foto (Daniel, 4-B; a regra da foto vale a partir de novembro). Cada uma passou por leitura._validar_leitura antes do INSERT; ciclo aberto por leitura.abrir_ciclo. Testado em PGlite antes.
- Conferencia com o banco antes de gravar: 105 = 34,533 (planilha dizia 34,333, menor que a anterior) e 208 com anterior 41,078 (planilha dizia 38,177) - confirmados por Daniel. Preco: depende da CAD32 do cadastros (vigencia dos especiais), aplicada antes.
- Previa: cobrar 10 unidades, 45,681 m3, R$ 1.097,27; acumula 31 (com o em aberto de maio do 305 e do 409). A planilha faturou R$ 1.187,67 - a diferenca e o 208 (ver KNOWN_ISSUES).

### LEI5 — Envio do demonstrativo (DESENHO)

**Decidido em:** 30/10/2026 (so desenho) · **Status:** decisoes E1-E9 em aberto, em docs/DESENHO-LEI5-ENVIO.md. A proxima sessao comeca por ele.
