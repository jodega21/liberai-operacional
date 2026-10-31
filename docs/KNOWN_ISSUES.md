# Known issues — LiberAi Operacional

## [LIMITE] API devolve no maximo 1.000 linhas por consulta (LEI2, 29/10)

**Status:** resolvido (LEI3, 30/10) - consultas que crescem paginadas (lib/leitura/paginar.ts) · **Severidade:** media (cresce com o tempo)
- Conferido no banco em 30/10 (so leitura): sem paginar, leituras e cobrancas devolviam 1.000 de 1.688; paginado, 1.688 sem repetir.
  Ficaram sem paginar as consultas limitadas pelo numero de unidades (unidades, ocupantes, leituras e cobrancas de UM ciclo).
- O PostgREST do Supabase corta em 1.000 linhas sem avisar. As consultas de lib/leitura/carregar.ts buscam por condominio/unidades
  sem paginar: hoje a maior (La Citta, ~410 cobrancas) cabe; a La Citta gera ~500 por ano. Caminho: limitar por periodo (ultima
  cobrada para frente) ou paginar.

## [LIMPEZA] Fotos de teste no bucket leitura-fotos (LEI2, 29/10)

**Status:** aberto · **Severidade:** baixa
- Pastas do teste de 29/10 (ciclos ja apagados) ficaram no bucket. Correcao de leitura com foto nova tambem deixa a foto antiga
  (registro de auditoria, nao apagada de proposito). Apagar as de teste pela API quando Daniel autorizar.

## [DADO] Avisos da carga do historico (LEI2, 29/10)

**Status:** aceito como a planilha · **Severidade:** baixa
- Mahe 103 (abr/2026): planilha cobrou 0,545 m3, a cadeia de leituras da 2,333 m3 (FEV anterior pulou de 590,232 para 591,468);
  Mahe 101 idem com 0,01 m3. Soul Garden 504 abr/2026 sem leitura (linha zerada). Moratta 501: morador do cadastro mantido
  (diferente do ultimo cod BS da planilha). Detalhes na aba Avisos da conferencia.

## [NOTA] Carga em partes com ids fixos (LEI2, 29/10)

**Status:** informativo
- 20261029190000 foi gerada por script com UUIDs fixos e aplicada em 10 partes (o SQL Editor recusa 1,1 MB). As partes sao
  idempotentes (ON CONFLICT DO NOTHING). Nao regenerar: os ids mudariam.

## [PROCESSO] Version de migration unica nos 3 repos (LEI2, 29/10)

**Status:** regra adotada
- A tabela de versions e a mesma do financeiro e do cadastros: 20261029170000 colidiu com o financeiro e foi renumerada para
  20261029171000. Conferir as versions do dia nos 3 repos antes de criar.

## [DADO] La Citta 208: planilha faturou de novo o consumo de agosto (LEI4b, 30/10)

**Status:** aberto (fora do sistema) · **Severidade:** media
- A planilha de out/2026 cobrou o 208 de 38,177 a 41,941 (3,764 m3, R$ 90,41), mas agosto ja tinha sido cobrado de 38,177 a 41,078 (2,901 m3, R$ 69,68). No sistema o 208 acumula 0,863 m3 em outubro. Se o boleto de R$ 90,41 foi emitido: cancelar e reemitir ou gerar credito (Daniel decide).

## [DADO] Historico de 2026 com o relogio repetido nos meses acumulados (LEI4, 30/10)

**Status:** aceito como a planilha · **Severidade:** baixa
- A planilha repetia o numero do relogio nos meses que acumulavam: o grafico do demonstrativo mostra 0 m3 nesses meses e o consumo inteiro no mes cobrado. Corrige sozinho com as leituras reais do app (a partir de novembro). Precos variam por unidade na planilha (Monte Castelo 402 set/2026 a 38,18/m3; os demais 22,35) - conferir com a operacao.
