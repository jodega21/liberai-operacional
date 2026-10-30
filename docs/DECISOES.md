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

**Decidido em:** 30/10/2026 · **Status:** codigo pronto, nao commitado nem validado no browser.

- Paginacao (opcao A, Daniel 30/10): lerPaginado (src/lib/leitura/paginar.ts), mesmo padrao do liberai-financeiro - pagina de 1.000
  com ordem total terminando em id. Descartadas: limitar por periodo (unidade sem cobranca ha muito tempo sumiria da conta) e
  mover para funcoes SQL (migration a mais sem ganho hoje). Paginadas em carregar.ts: ciclos (lista e condominio), saidas, ultimas
  leituras, cobrancas cobradas, medidores, leituras anteriores e historico de cobrancas. A ordem dos medidores passou a
  instalado_em, criado_em, id (igual a _base_cobranca).
- Trava do medidor: as funcoes sao do liberai-cadastros (DECISOES LEI3 de la); o teste fica aqui no bloco F de supabase/testes,
  que agora aplica a secao 1 de 20261028140000 e a 20261030130000 do cadastros.
- Teste: PGlite 147 verificacoes (19 novas), 0 falhas. App: 64 testes (5 novos de paginacao), typecheck, lint e build OK.
