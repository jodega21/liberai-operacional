-- 20261029190000_carga_historico_leitura_2026
-- STATUS: NAO APLICADA. Gerada por script a partir de "Leituras/Historico 2026 - conferencia.xlsx" e das decisoes
-- de Daniel (29/10/2026). Testada no PGlite com o cadastro real. Depende de 20261029180000.
-- EM PARTES (o SQL Editor do Studio recusa o arquivo inteiro): rodar parte_01 ... na ordem, cada uma num comando.
-- Cada parte pode ser rodada de novo (ON CONFLICT DO NOTHING); a ultima confere as contagens e registra a version.
-- O QUE FAZ: apaga o teste de 29/10; medidores voltam para a 1a leitura de 2026 (Mahe e Belle Ville: antigo + novo);
-- ciclos jan-out fechados com leituras (origem planilha) e cobrancas com o valor da planilha; consumo em aberto
-- (Lauro mar, La Citta mai 305/409); historico de moradores pelo cod BS; minimo do Prolar Cadiz = 0.
-- PARTE 01 de 10

-- limpeza do teste de 29/10, minimo do Cadiz e medidores
DO $$ BEGIN
  IF (SELECT count(*) FROM leitura.leituras WHERE origem = 'app') > 2 THEN
    RAISE EXCEPTION 'Ha leituras lancadas pelo app alem do teste de 29/10: carga cancelada';
  END IF;
END $$;
DELETE FROM leitura.cobrancas WHERE leitura_id IN (SELECT id FROM leitura.leituras WHERE origem = 'app');
DELETE FROM leitura.leituras WHERE origem = 'app';
DELETE FROM leitura.ciclos WHERE id = 'fc806768-0a7e-4dd3-853e-630dec1e8eef';
UPDATE leitura.condominios SET minimo_cobranca = 0, atualizado_por = 'ae4e28c1-14b3-4076-8697-3a3f82567f7f' WHERE id = 'ccaf8584-1c3c-4457-8c1e-b1b00257e179';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 751.847 WHERE id = '78a8398b-85fa-46f1-802e-0438d626c755';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 247.308 WHERE id = '2dd98c49-b308-42b2-8cfb-d1184fac6228';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 43.492 WHERE id = '4bc55d28-4aef-4243-a2c5-e36d1f2158d0';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 102.074 WHERE id = 'eb5de056-8e0d-4e2d-aff8-b0e029010ae9';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 925.362 WHERE id = '70428489-0dda-49d1-b0e0-310b4ca49320';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 74.441 WHERE id = 'eb0b7313-efb1-4b14-a3a8-7e19e10a7e11';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 93.322 WHERE id = '4095c45b-cf79-42f6-b241-18d37797f3ca';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 750.38 WHERE id = '7ce6262a-9735-4717-83f3-225c3f90e84b';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 304.539 WHERE id = 'ed7e7e0f-9454-46ac-b682-1f54a485511a';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 208.812 WHERE id = '88046b1f-437f-4702-b5a4-34bf15473f36';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 298.487 WHERE id = 'f56ed615-5e59-4791-8ba6-65db63d335bd';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 80.959 WHERE id = 'd23a1784-80bb-4efa-9e1b-54652997f2be';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = '6fe45e82-f410-47ae-9560-34336aa27e78';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = 'c575ca96-e178-4b34-8eca-d4896fca801e';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = 'e367fcd7-4103-43e6-87c0-4fa15f6da7ba';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = '89e7092f-919e-4210-a3c3-5af36d188ade';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = '5d4b4eb9-67d6-4a9f-a0fd-e7b2326676ec';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = '588a19d2-fc12-42e1-a1fc-e8e814caf27a';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = 'f3369aea-7f94-435c-a7b1-82f4d500c3f3';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = '832325f7-93b5-403e-8ac2-e05be0d47899';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = 'b5e5e03c-38b9-4714-943a-25c9a3bf8944';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = 'cac5b92a-4788-463f-9f20-e5a8cb1f11aa';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = 'c62defcd-7f7f-473d-ab22-85706bc3717d';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = 'db2f7376-ba2c-4fde-974d-0fff6506aab6';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = '2fcaed1d-74c0-4b2b-804a-b54b6b9a7896';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = '5d781f1f-fe76-4e81-a243-85b1f5435d54';
UPDATE leitura.medidores SET instalado_em = '2026-02-10', leitura_inicial = 0.0 WHERE id = '92660a78-c878-409d-bc78-127d3fac5ba2';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 16.835 WHERE id = '94eddbdc-753a-4a65-b92a-44275f7095c4';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 153.425 WHERE id = '1857f214-0a41-4f93-a632-b23c87d354b7';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 27.524 WHERE id = 'c3d12839-7fe0-497d-be8f-b9c4e1135093';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 5.586 WHERE id = '798171f8-49d7-4e7f-b4d7-77461d320a3b';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 46.158 WHERE id = '1aaeb336-10e2-4c01-9601-867ac6ad9a35';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 365.187 WHERE id = 'aca5a4f2-b0cc-4890-b5a4-38955e921762';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 207.158 WHERE id = '1cce05d0-a20c-4d0b-a072-9db870bbc470';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 12.841 WHERE id = '8a643b7e-a550-4382-99aa-38bd5d82c3cf';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 108.012 WHERE id = 'b7226af6-c337-455b-af6c-9656cb094405';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 203.612 WHERE id = '46f0a938-da77-4302-a473-4c8faa74e2a6';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 58.044 WHERE id = '43de241d-1c26-4161-9052-8807b0ca9b53';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 44.717 WHERE id = '71746dde-119c-4461-ab49-d8085b8ec233';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 35.038 WHERE id = '14f74707-383b-49be-bf64-5af3bca24fe2';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 163.98 WHERE id = 'd9c601b9-caa6-4f13-bd1e-d5d1f9ed22eb';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 0.0 WHERE id = 'd23a7321-080a-4633-a9b2-96594334fb7f';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 105.719 WHERE id = 'a38d1029-c0bd-465b-b6d6-5463555fb844';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 90.116 WHERE id = '786b34d5-ad5c-4a8e-9022-d2137c2c9844';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 19.069 WHERE id = '9ee86082-724b-4dc1-948c-526d4aebe664';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 24.125 WHERE id = '98dd1c6e-3a4f-4b60-b942-9d17dc694f43';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 54.876 WHERE id = 'd535c747-6882-4983-b5f2-7ce0887f7ff6';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 177.036 WHERE id = '5d334d25-45ef-4b37-8886-1346e4840369';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 58.47 WHERE id = 'cef83798-f484-4525-a4d3-89f0e2c85190';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 68.386 WHERE id = '23cb2d3d-f488-4d4e-900d-3a66a2eab1d1';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 362.817 WHERE id = 'cd004aff-d638-4286-887f-500111ca5ffa';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 73.942 WHERE id = 'cd87c295-4cea-4c85-b5ff-d8e9f9c8f238';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 30.968 WHERE id = '285c5305-dfba-45d8-a665-20770d045cc2';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 192.257 WHERE id = '3b782421-d891-4af3-8386-a3318a4f93b2';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 248.711 WHERE id = '7f766334-5068-489d-a920-1224e837b52a';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 99.009 WHERE id = '18096c2b-32d3-473c-b36e-7a36df913e1e';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 26.133 WHERE id = 'a830b6bd-4b9b-4aa8-866f-b4c28dddf77c';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 10.589 WHERE id = '0d2c625c-86ad-42a7-827b-36f464d879cd';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 135.891 WHERE id = '238ded67-cea0-4fcf-af1e-e272c9acc08e';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 61.742 WHERE id = 'f9014697-b0e2-47f1-9ba3-3557b174cabd';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 68.698 WHERE id = 'd32ec444-4689-46d1-b811-7f4931f798a5';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 89.737 WHERE id = 'b2037c96-11d7-443f-acb6-ee42672806bc';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 44.175 WHERE id = '0f4f2a25-f12c-4001-a200-bb2f1b089c2e';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 144.299 WHERE id = 'd7380bd8-908c-4889-a872-6055e5f167bd';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 20.946 WHERE id = '86681b97-1be1-444f-98d5-5582751e420c';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 0.0 WHERE id = 'a3e03c53-4e7e-431b-b7d3-ac99d234a101';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 24.36 WHERE id = '0646f2c9-9d9c-4797-8fb5-c989060f6102';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 78.575 WHERE id = '609e22c2-9ba2-488d-a5cb-93a4944d2028';
UPDATE leitura.medidores SET instalado_em = '2026-03-25', leitura_inicial = 0.0 WHERE id = '7c8a9134-a1f2-4d09-b135-267f75cab1f8';
UPDATE leitura.medidores SET instalado_em = '2026-02-26', leitura_inicial = 0.0 WHERE id = 'a97e273d-a47a-4a17-a150-954f7e340ffe';
UPDATE leitura.medidores SET instalado_em = '2026-01-28', leitura_inicial = 0.0 WHERE id = 'dc17a378-25dc-44b1-8bec-69e5b1b0d99d';
UPDATE leitura.medidores SET instalado_em = '2026-02-26', leitura_inicial = 0.0 WHERE id = '1cdd8642-c85c-46fa-bd52-8b8dbec3d56c';
UPDATE leitura.medidores SET instalado_em = '2026-03-25', leitura_inicial = 0.0 WHERE id = '5d9c978b-94ce-4c68-8169-fc549cf1956f';
UPDATE leitura.medidores SET instalado_em = '2026-02-26', leitura_inicial = 0.0 WHERE id = '17a02d15-ded3-4ea0-9bf0-5a4f9b977f14';
UPDATE leitura.medidores SET instalado_em = '2026-02-26', leitura_inicial = 0.0 WHERE id = 'f30d1756-5b31-4ad4-b567-3501e3211f6d';
UPDATE leitura.medidores SET instalado_em = '2026-02-26', leitura_inicial = 0.0 WHERE id = 'bfa46498-c0e9-4bb0-a78f-38dde7204665';
UPDATE leitura.medidores SET instalado_em = '2026-02-26', leitura_inicial = 0.0 WHERE id = '57e9f960-a4e7-4fb7-923a-1d75beb85e1c';
UPDATE leitura.medidores SET instalado_em = '2026-03-25', leitura_inicial = 0.0 WHERE id = '2832f5e2-d940-4b0b-b247-89ce9c132a62';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 5003.559 WHERE id = '02326492-6a4b-4dfa-acdd-0233ae6678f9';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 1584.648 WHERE id = 'b6d92ede-f1bf-48ac-9cf3-05855ebf6c8f';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 341.248 WHERE id = '630f68bc-1622-4d7e-8386-5ecdae8a8a11';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 2940.826 WHERE id = '76016b00-4c64-47dd-aa57-4cff48fb5ab5';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 1792.425 WHERE id = 'b4494dda-5fe4-4305-8a22-ea1c774bc559';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 7924.296 WHERE id = '152141de-4f69-4674-b45c-1d795ee40c48';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 1954.582 WHERE id = 'a7b0943e-b533-4aa7-9f5c-917077b913a2';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 2971.108 WHERE id = '5c44dc14-961d-4fbd-bd60-99a1f948278c';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 250.002 WHERE id = 'fead21c7-dc5c-4787-8be2-a2822fd8fe44';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 51.208 WHERE id = '2249edee-09b1-4b93-86ec-4cd14022d656';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 672.369 WHERE id = '4cfb1124-318a-4af4-beca-eff1da00375b';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 85.104 WHERE id = 'd46e4a0f-974a-467a-ac28-dc8514c61f04';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 240.367 WHERE id = '97b8ad88-d18c-4573-9c03-f80a3ca604ef';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 304.693 WHERE id = '056d0259-81e1-4c8a-b5cf-4f8a388e8d54';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 60.088 WHERE id = '360fd279-98ca-41f4-9459-5e4473b31a4c';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 147.331 WHERE id = '5ced5199-49b5-4137-b31d-dde56111e71b';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 291.511 WHERE id = '98afb732-ae7a-4015-8765-daadfe8726d6';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 116.203 WHERE id = '6fa1aaf1-4b42-4f8c-b683-7ac3fcc8e0a7';
UPDATE leitura.medidores SET instalado_em = '2026-01-07', leitura_inicial = 1570.0 WHERE id = 'f480b496-8cd1-44e1-a0db-f2cfff0b8552';
UPDATE leitura.medidores SET instalado_em = '2026-01-07', leitura_inicial = 2153.0 WHERE id = 'b6144dc4-61a3-467b-a1e7-cc6494f75313';
UPDATE leitura.medidores SET instalado_em = '2026-01-07', leitura_inicial = 1113.0 WHERE id = '592e598b-0fee-429e-be4e-7808a152d828';
UPDATE leitura.medidores SET instalado_em = '2026-01-07', leitura_inicial = 2550.0 WHERE id = '1e900c9e-b9f4-40b8-999e-b2e1a30ba8e7';
UPDATE leitura.medidores SET instalado_em = '2026-01-07', leitura_inicial = 1535.0 WHERE id = 'ddc5f2c7-5ee3-4025-a6ea-36184926b30c';
UPDATE leitura.medidores SET instalado_em = '2026-01-07', leitura_inicial = 1923.0 WHERE id = 'e95646ce-89aa-4ee3-af79-2bb261459345';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 170.0 WHERE id = '8d75787a-5c08-431d-a55b-4180cc25acfc';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 110.0 WHERE id = 'd27c6aad-417d-4947-944d-3db815c3ba9d';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 171.0 WHERE id = '648707aa-8f24-4dc2-97d1-5008a5a3b26b';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 240.0 WHERE id = '08fa8cff-632f-48e6-8965-69369812f86c';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 154.0 WHERE id = 'afef15c5-9c9c-4643-a843-0663b752d0a8';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 167.0 WHERE id = 'adf14bdc-b63b-44a6-b037-7f5558573453';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 126.0 WHERE id = 'ee07398a-bf4a-492b-ba79-638387278873';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 359.0 WHERE id = '4e2e865f-1686-48aa-9ed3-4d49fcad2c49';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 59.0 WHERE id = '92d389e5-995f-4b1e-8292-3b612b882ee1';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 98.0 WHERE id = '22093f6d-1f34-4197-9151-3d9360c565fa';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 246.0 WHERE id = 'a4503afe-8ec5-496c-b1f5-78ed575cf767';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 345.0 WHERE id = '1ec0597a-12bd-434b-a966-c19b8f292da7';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 385.662 WHERE id = 'a08f980f-3d8a-4a79-9558-53dc03432e1c';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 45.698 WHERE id = '9a95df17-725b-4f5a-8fbc-16acaa5e8bb0';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 124.541 WHERE id = 'ce7631e6-894d-40e1-969a-aceb6c6fdf58';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 113.425 WHERE id = '8f28ccb5-299f-41da-aaa8-1fee34254ec1';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 37.485 WHERE id = '5b005a6f-79cb-47e7-af96-3f5091dfeab4';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 235.92 WHERE id = 'a04cc582-f349-4717-8a32-7677d761123a';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 162.933 WHERE id = '1b6f0870-3322-48d6-aeca-d355a4b83488';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 72.968 WHERE id = '7eac567e-66bc-40aa-8fe1-f66773cbf586';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 137.23 WHERE id = '815c05e4-2785-483e-9755-f335b858f02f';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 33.48 WHERE id = 'cae57d42-d9f7-4514-b73e-d7f6d5e7c67c';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 3.264 WHERE id = '2c205d4f-a7e1-45eb-8779-13a2e8b6e09c';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 150.729 WHERE id = '925d1dad-6f96-4114-9394-56a34b9db76c';
UPDATE leitura.medidores SET instalado_em = '2025-12-17', leitura_inicial = 98.764 WHERE id = '62b276dd-c113-4312-a86d-e005a1aaca13';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 33.101 WHERE id = 'e6541be0-4042-42e2-bf64-b18defe40ec2';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 36.897 WHERE id = 'a51ca4e2-a1d0-47e0-b29d-3fd5a4437a53';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 19.791 WHERE id = 'a1d968c1-18e7-40b3-ae6d-3de81eb5035c';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 32.344 WHERE id = '8295e470-6999-4cdc-8a11-73b85e13ea62';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 2.897 WHERE id = 'da58f953-0834-4e6b-962c-2059b6f1d688';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 25.763 WHERE id = '0aa1c02f-2ed8-49b3-a89c-848d5887d8f0';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 19.216 WHERE id = 'ab1f63ee-0c66-4e58-985b-e6f24563e36d';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 18.132 WHERE id = 'ee6d470c-d38e-416b-a302-fd8a317640fd';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = '89a11199-64d8-4824-9917-3dd7fbea6408';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = 'f8fe515a-422d-4836-bd7f-45821746920c';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = '6c79939f-ce60-46cf-b468-cbb077a627ba';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = '889e227a-564f-4db8-afd0-c613a21f3cd0';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = '4ce67090-b8ad-4de8-b265-29ccc2545c8c';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = '5af31b4e-4504-4413-bc6c-88cfec9504d6';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = 'f0ac9192-57fd-42a0-a721-d71b02ceb1bb';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = '5d32ee67-b9a8-4fda-849a-02db92f0c655';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = '9beed96a-cfeb-44d1-a3c8-68fd998ce8f1';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = '8fe9ed58-db0a-44a9-9a74-5c75dce3c6a0';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = 'f7af9a99-207e-49e8-86b7-b272e283445d';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = '6278f408-7872-456c-87eb-40b6d61499a9';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = '8521324b-2aea-441e-89a2-576aff86e2f8';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = '394bfcac-8595-42df-b646-9fa5f1b24ac9';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = 'd47489ad-2c7c-44ac-be47-fff16f53ac5a';
UPDATE leitura.medidores SET instalado_em = '2026-04-25', leitura_inicial = 0.0 WHERE id = '3cf0fc78-ce93-4a11-b34c-3531cffdcaed';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 118.893 WHERE id = '7b92c797-715f-4ecf-bfad-edb0ca14633f';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 173.926 WHERE id = '9655ee84-e885-470a-9a8d-f34170f3f921';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 500.637 WHERE id = 'd67a8b66-f62d-4866-8889-3b9631bdd5ef';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 118.216 WHERE id = '8f329d64-3dbb-42c4-ad31-9627affd9e02';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 28.425 WHERE id = '1072fdd8-684c-45af-b204-f4427e2ebc7a';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 166.961 WHERE id = 'a12cf166-18f8-40f5-b537-65f4c483eaa9';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 64.415 WHERE id = 'b1f5c0aa-4501-4590-b93c-783465d4d5f3';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 19.545 WHERE id = '3657ad77-6414-4bde-a43f-e89940bcab6b';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 101.828 WHERE id = '76d25e6a-816d-47c2-b2b8-78ef869dd9c0';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 147.418 WHERE id = '9bea3063-b01f-4fd6-bca1-034c5a162e7b';
UPDATE leitura.medidores SET instalado_em = '2026-01-06', leitura_inicial = 404.164 WHERE id = '33880c2e-a75b-4696-a763-54a7992e69b1';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 32.78 WHERE id = '78304c54-56e5-425a-9ce5-b8ac503a464c';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 10.177 WHERE id = '49bcef8e-bf9f-49f0-9ed6-0ffd4d4a9663';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 7.229 WHERE id = '1f30e2d1-e24c-4fdd-a816-07c3ad37c895';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 6.913 WHERE id = '32d07ebb-69ff-4955-9ac1-fbe8846353d4';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 41.621 WHERE id = '82d74a39-5df4-487c-8a22-0ab90eb7651f';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 0.382 WHERE id = 'de5f8164-bc71-48ca-b12f-841889a85c57';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 42.15 WHERE id = '6a422f76-f00c-4114-baa5-509ae545e645';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 35.259 WHERE id = '35d9479a-aea0-4e17-81f0-fdd5eff89bbd';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 77.51 WHERE id = '47b76d3b-cade-432e-8701-8139cca30041';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 40.199 WHERE id = 'bb3ab9d8-e306-4997-9fdc-b542e738ded1';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 0.702 WHERE id = '99b83657-73fe-46f0-9973-fda5cc95ae1f';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 28.051 WHERE id = '771552e2-6291-4c91-887c-e01eb7ce09b9';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 15.743 WHERE id = 'cd090395-b240-47ed-b0cf-93e806b68cf5';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 58.434 WHERE id = '98190a54-4e2c-49a8-b48c-b658bcb1d9e1';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 11.84 WHERE id = '56dcff06-9534-4008-87d8-e510a014ba75';
UPDATE leitura.medidores SET instalado_em = '2025-12-20', leitura_inicial = 35.984 WHERE id = '6e734d38-582a-4db0-8dd0-afd8c1e07c50';
INSERT INTO leitura.medidores (id, tenant_id, unidade_id, instalado_em, leitura_inicial, retirado_em, leitura_final, criado_por, retirado_por) VALUES
('3844fc57-bd95-4ad2-922e-e67bfac81232', 'a8286840-79af-4754-9b26-66300785c77f', '24bf42b6-24a3-4b4d-8ac1-4c3704a0374c', '2025-12-17', 27.35, '2026-02-10', 29.188, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('5a59f069-8bc2-4bad-9baa-924a2b18711d', 'a8286840-79af-4754-9b26-66300785c77f', '2b8850fb-348a-438f-8b9b-46b2f8736044', '2025-12-17', 21.004, '2026-02-10', 23.084, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('81a67229-0c80-4606-a6ff-34adea2a6586', 'a8286840-79af-4754-9b26-66300785c77f', '3a033346-1d28-4607-895f-68b76beb31e1', '2025-12-17', 0.093, '2026-02-10', 0.096, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('6bb09573-d5de-48cf-9eb0-dee3e6baf4fd', 'a8286840-79af-4754-9b26-66300785c77f', '486aff72-27cf-431e-bada-8de095f05631', '2025-12-17', 26.837, '2026-02-10', 29.965, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('6bc1f447-055e-458e-bc93-eec639263d24', 'a8286840-79af-4754-9b26-66300785c77f', '53ea8ecc-75fb-47fe-962f-542d782384d7', '2025-12-17', 36.846, '2026-02-10', 40.189, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('906f3b3a-33db-47d0-9073-c0fc2257fad1', 'a8286840-79af-4754-9b26-66300785c77f', '54f35cdf-af1c-4b9e-9fbe-20ba75e5946c', '2025-12-17', 29.501, '2026-02-10', 29.501, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('0ce511fd-1ae0-44bc-baed-a06a897f06bf', 'a8286840-79af-4754-9b26-66300785c77f', '638029ef-17cb-43c5-b0e9-d859eba719aa', '2025-12-17', 0.058, '2026-02-10', 0.058, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('3850cb8e-1fbc-4c21-a8dc-67d845f1bd64', 'a8286840-79af-4754-9b26-66300785c77f', '6af057ec-3a86-4b0d-8a2a-8afd0edc8293', '2025-12-17', 37.303, '2026-02-10', 40.282, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('68ae39a6-2e3c-4dfe-ba06-bce3a280cbdc', 'a8286840-79af-4754-9b26-66300785c77f', '7a396308-f6a8-49b5-93a5-63ef6170a7f7', '2025-12-17', 42.49, '2026-02-10', 43.948, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('4871dc7b-8100-422e-a445-0c48ec19659d', 'a8286840-79af-4754-9b26-66300785c77f', '85fd72f6-6dd4-45e6-b10a-3f7b59f2e11e', '2025-12-17', 24.069, '2026-02-10', 25.631, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('4131d167-316b-4f49-94a1-fb63aaf29dbc', 'a8286840-79af-4754-9b26-66300785c77f', '9397d69f-c940-4693-9a8c-cb7190e0520e', '2025-12-17', 26.428, '2026-02-10', 27.813, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('78b81aae-0bf0-4bb5-a46f-6ec40c31f592', 'a8286840-79af-4754-9b26-66300785c77f', 'c8c41891-5792-4970-96dc-d060bdca9c51', '2025-12-17', 117.951, '2026-02-10', 119.652, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('151981d2-5bed-4c1e-9f61-ef494aa5efbd', 'a8286840-79af-4754-9b26-66300785c77f', 'd385ac7d-d8e0-4505-8f17-e981b8403ea9', '2025-12-17', 25.45, '2026-02-10', 26.396, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('7818a041-3460-4ddc-be67-fc3a0e016ddd', 'a8286840-79af-4754-9b26-66300785c77f', 'e538d323-25c4-4856-8e9c-74b42097ba03', '2025-12-17', 5.857, '2026-02-10', 5.857, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('49ef4f91-f170-4758-8823-f705851a9bda', 'a8286840-79af-4754-9b26-66300785c77f', 'ffc490a9-312d-4803-b941-cdfd1327f68b', '2025-12-17', 3.046, '2026-02-10', 5.153, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('9609d37c-66f0-4548-9f8b-be3efdf8aaf1', 'a8286840-79af-4754-9b26-66300785c77f', '0095aff1-8a5a-4610-8d09-27248ab6e907', '2025-12-25', 74.212, '2026-04-25', 77.168, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('86a02fd5-33bb-4d16-a1ea-8b4348ea92da', 'a8286840-79af-4754-9b26-66300785c77f', '0f7b3cbb-c7bf-425c-b365-fbbfed08d03c', '2025-12-25', 48.025, '2026-04-25', 48.025, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('c7b75ddb-49fd-4ade-95ef-a004ed0f23c6', 'a8286840-79af-4754-9b26-66300785c77f', '1758e3c5-7d40-430c-a00d-30337bb18825', '2025-12-25', 590.232, '2026-04-25', 592.02, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('5ee0fd54-8ccc-4091-8d4e-70379bc96335', 'a8286840-79af-4754-9b26-66300785c77f', '285503ce-c2fd-4dbd-bc04-4abe09e1aa26', '2025-12-25', 130.624, '2026-04-25', 134.251, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('0a972399-142c-43e4-8c1b-ec52b95dbf0b', 'a8286840-79af-4754-9b26-66300785c77f', '2bbcc98c-c377-4a9e-8237-1423d2711eee', '2025-12-25', 134.601, '2026-04-25', 136.662, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('905dfcca-4534-4d01-961b-879c7327eba1', 'a8286840-79af-4754-9b26-66300785c77f', '383e76d5-1a87-4d8f-af00-e26f39802ec4', '2025-12-25', 48.554, '2026-04-25', 48.554, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('253d6fe2-4f2e-443f-acc4-00302f1778a0', 'a8286840-79af-4754-9b26-66300785c77f', '484a9c36-8e2c-49cc-af64-52a618c002da', '2025-12-25', 89.37, '2026-04-25', 104.735, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('5a9729be-b3e9-4a4a-9a10-86836dc4f69e', 'a8286840-79af-4754-9b26-66300785c77f', '653c1b8c-287f-463a-a8c0-09c99b143910', '2025-12-25', 68.166, '2026-04-25', 80.158, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('badf58c7-bf44-4f01-ad1a-05791ea9a9be', 'a8286840-79af-4754-9b26-66300785c77f', '825d0103-98e8-41bf-a026-32bc2d4e6889', '2025-12-25', 133.688, '2026-04-25', 138.975, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('c996f1dd-e9a7-43d3-a2e7-e8c6d504e60d', 'a8286840-79af-4754-9b26-66300785c77f', '8a9eba76-f0a9-4ac8-8e49-133ab6f07436', '2025-12-25', 312.601, '2026-04-25', 324.918, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('6034e43f-246b-434e-856f-4f7bb557d200', 'a8286840-79af-4754-9b26-66300785c77f', '8c4e38a8-559e-4df4-b729-186e5a47ecee', '2025-12-25', 253.583, '2026-04-25', 259.728, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('fc68e05d-73de-4699-9804-3c7feb797aaa', 'a8286840-79af-4754-9b26-66300785c77f', 'bbd92f55-1ff2-4754-9d75-9fd940a94055', '2025-12-25', 77.86, '2026-04-25', 81.949, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('24785e0d-d4a0-4b1f-bf3c-397173d26f5f', 'a8286840-79af-4754-9b26-66300785c77f', 'c69c370a-3944-41bb-9021-cf80f87235b8', '2025-12-25', 148.171, '2026-04-25', 148.181, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('e6e77f3c-c5ea-4768-908b-5302ba426b00', 'a8286840-79af-4754-9b26-66300785c77f', 'd8c14d90-5ba3-4800-99bc-88930c975d75', '2025-12-25', 52.108, '2026-04-25', 56.03, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('7c5c85e2-4adc-46f8-b4d1-2bed95d99db7', 'a8286840-79af-4754-9b26-66300785c77f', 'f064406b-e376-4635-92b8-7aa967b9db07', '2025-12-25', 80.567, '2026-04-25', 83.457, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f'),
('e4e039de-f93b-48b8-a11f-f47a6796adfe', 'a8286840-79af-4754-9b26-66300785c77f', 'f08463a6-7b40-4488-8d79-59a5b6371c32', '2025-12-25', 226.85, '2026-04-25', 229.573, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f')
ON CONFLICT (id) DO NOTHING;
INSERT INTO leitura.ciclos (id, tenant_id, condominio_id, referencia, data_leitura, status, minimo_cobranca, criado_por, fechado_por, fechado_em) VALUES
('559d2d46-b7e6-4b33-b4bb-017775e02b2a', 'a8286840-79af-4754-9b26-66300785c77f', 'a7e31e55-b644-44c1-8ac5-80f455ff214c', '2026-01-01', '2026-01-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-01-10 12:00:00-03'),
('5ef4aed9-c64d-41bc-9d88-da57426efa6b', 'a8286840-79af-4754-9b26-66300785c77f', 'a7e31e55-b644-44c1-8ac5-80f455ff214c', '2026-02-01', '2026-02-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-02-10 12:00:00-03'),
('eec810e8-6c83-4a65-8a83-c44d056ec5cc', 'a8286840-79af-4754-9b26-66300785c77f', 'a7e31e55-b644-44c1-8ac5-80f455ff214c', '2026-03-01', '2026-03-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-03-10 12:00:00-03'),
('79c55bc4-0c5d-4840-a325-8fb31cfdf805', 'a8286840-79af-4754-9b26-66300785c77f', 'a7e31e55-b644-44c1-8ac5-80f455ff214c', '2026-04-01', '2026-04-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-04-10 12:00:00-03'),
('3fe1df58-5a7d-4b7f-badb-35d446a2c374', 'a8286840-79af-4754-9b26-66300785c77f', 'a7e31e55-b644-44c1-8ac5-80f455ff214c', '2026-05-01', '2026-05-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-05-10 12:00:00-03'),
('5e7d6c58-e8b1-4af5-b2a8-45c1fcb7c50c', 'a8286840-79af-4754-9b26-66300785c77f', 'a7e31e55-b644-44c1-8ac5-80f455ff214c', '2026-06-01', '2026-06-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-06-10 12:00:00-03'),
('c048bf69-34c9-4c41-930a-c522bcebe603', 'a8286840-79af-4754-9b26-66300785c77f', 'a7e31e55-b644-44c1-8ac5-80f455ff214c', '2026-07-01', '2026-07-13', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-07-13 12:00:00-03'),
('928b07dd-587a-4086-8791-04adc958566f', 'a8286840-79af-4754-9b26-66300785c77f', 'a7e31e55-b644-44c1-8ac5-80f455ff214c', '2026-08-01', '2026-08-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-08-10 12:00:00-03'),
('d0eba7ac-603a-4854-b30d-0db681d5bc3b', 'a8286840-79af-4754-9b26-66300785c77f', 'a7e31e55-b644-44c1-8ac5-80f455ff214c', '2026-09-01', '2026-09-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-09-10 12:00:00-03'),
('704ecc7b-fc77-4ef9-8ce0-07369de44b20', 'a8286840-79af-4754-9b26-66300785c77f', 'a7e31e55-b644-44c1-8ac5-80f455ff214c', '2026-10-01', '2026-10-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-10-10 12:00:00-03'),
('4cc8d831-51b2-432c-acef-153dc059f81b', 'a8286840-79af-4754-9b26-66300785c77f', '165091b6-6d27-440b-9b9d-3aa64c441d91', '2026-01-01', '2026-01-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-01-10 12:00:00-03'),
('bc8cfecc-f43c-4ade-a56d-2a0fcda017aa', 'a8286840-79af-4754-9b26-66300785c77f', '165091b6-6d27-440b-9b9d-3aa64c441d91', '2026-02-01', '2026-02-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-02-10 12:00:00-03'),
('70179beb-33a1-43fd-89dc-95493a874bcd', 'a8286840-79af-4754-9b26-66300785c77f', '165091b6-6d27-440b-9b9d-3aa64c441d91', '2026-03-01', '2026-03-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-03-10 12:00:00-03'),
('12263e51-418b-4a0e-875c-a22db2dee883', 'a8286840-79af-4754-9b26-66300785c77f', '165091b6-6d27-440b-9b9d-3aa64c441d91', '2026-04-01', '2026-04-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-04-10 12:00:00-03'),
('1e422b2e-22d2-4e89-a8de-a10084f9bb97', 'a8286840-79af-4754-9b26-66300785c77f', '165091b6-6d27-440b-9b9d-3aa64c441d91', '2026-05-01', '2026-05-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-05-10 12:00:00-03'),
('5f8919d0-f680-4d75-b9f9-cdcac3fc1b81', 'a8286840-79af-4754-9b26-66300785c77f', '165091b6-6d27-440b-9b9d-3aa64c441d91', '2026-06-01', '2026-06-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-06-10 12:00:00-03'),
('6314bbbe-68a0-4229-86f4-ccdcf867d381', 'a8286840-79af-4754-9b26-66300785c77f', '165091b6-6d27-440b-9b9d-3aa64c441d91', '2026-07-01', '2026-07-13', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-07-13 12:00:00-03'),
('06c59647-7090-49f8-80cb-0858c1a50ddc', 'a8286840-79af-4754-9b26-66300785c77f', '165091b6-6d27-440b-9b9d-3aa64c441d91', '2026-08-01', '2026-08-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-08-10 12:00:00-03'),
('46923264-c8a0-45b7-bd21-8e326d6dfbe7', 'a8286840-79af-4754-9b26-66300785c77f', '165091b6-6d27-440b-9b9d-3aa64c441d91', '2026-09-01', '2026-09-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-09-10 12:00:00-03'),
('30bd5252-7ff3-46d2-9c83-bd4368c0da38', 'a8286840-79af-4754-9b26-66300785c77f', '165091b6-6d27-440b-9b9d-3aa64c441d91', '2026-10-01', '2026-10-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-10-10 12:00:00-03'),
('81dd91b3-ef45-4fde-8fc8-50e742190ddc', 'a8286840-79af-4754-9b26-66300785c77f', 'aa878497-1fd1-4287-8196-3c2ae842670b', '2026-01-01', '2026-01-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-01-20 12:00:00-03'),
('ed434f56-286a-4993-93e4-d54ca87db7ad', 'a8286840-79af-4754-9b26-66300785c77f', 'aa878497-1fd1-4287-8196-3c2ae842670b', '2026-02-01', '2026-02-19', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-02-19 12:00:00-03'),
('4c09d35a-d3c3-4c5c-af26-c3870f644599', 'a8286840-79af-4754-9b26-66300785c77f', 'aa878497-1fd1-4287-8196-3c2ae842670b', '2026-03-01', '2026-03-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-03-20 12:00:00-03'),
('01106118-cd26-4922-a93d-a1706c0d0432', 'a8286840-79af-4754-9b26-66300785c77f', 'aa878497-1fd1-4287-8196-3c2ae842670b', '2026-04-01', '2026-04-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-04-20 12:00:00-03'),
('4bb37f21-bbe4-4e90-8459-a2a147498362', 'a8286840-79af-4754-9b26-66300785c77f', 'aa878497-1fd1-4287-8196-3c2ae842670b', '2026-05-01', '2026-05-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-05-20 12:00:00-03'),
('c931cb8d-dc6d-4567-b89c-752e9a5893f1', 'a8286840-79af-4754-9b26-66300785c77f', 'aa878497-1fd1-4287-8196-3c2ae842670b', '2026-06-01', '2026-06-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-06-20 12:00:00-03'),
('f87d0580-b775-4adb-8228-ed5d171a96d9', 'a8286840-79af-4754-9b26-66300785c77f', 'aa878497-1fd1-4287-8196-3c2ae842670b', '2026-07-01', '2026-07-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-07-20 12:00:00-03'),
('a36da0f4-e546-47bd-9350-b97c6ab61382', 'a8286840-79af-4754-9b26-66300785c77f', 'aa878497-1fd1-4287-8196-3c2ae842670b', '2026-08-01', '2026-08-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-08-20 12:00:00-03'),
('0b656a91-bf05-4089-bdb6-1cb5dc309900', 'a8286840-79af-4754-9b26-66300785c77f', 'aa878497-1fd1-4287-8196-3c2ae842670b', '2026-09-01', '2026-09-29', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-09-29 12:00:00-03'),
('c8106484-a9f8-4a59-8f6e-91d09cc30dd1', 'a8286840-79af-4754-9b26-66300785c77f', '9ea82ead-3b24-4701-a4cd-34cff9b8a185', '2026-02-01', '2026-02-26', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-02-26 12:00:00-03'),
('c68fdb50-c853-4e34-8577-32743b469647', 'a8286840-79af-4754-9b26-66300785c77f', '9ea82ead-3b24-4701-a4cd-34cff9b8a185', '2026-03-01', '2026-03-25', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-03-25 12:00:00-03'),
('a78efce1-0694-4746-8439-070f8a07c929', 'a8286840-79af-4754-9b26-66300785c77f', '9ea82ead-3b24-4701-a4cd-34cff9b8a185', '2026-04-01', '2026-04-25', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-04-25 12:00:00-03'),
('d2ed0321-0dc5-4ee1-a223-3654f3dc59d9', 'a8286840-79af-4754-9b26-66300785c77f', '9ea82ead-3b24-4701-a4cd-34cff9b8a185', '2026-05-01', '2026-05-25', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-05-25 12:00:00-03'),
('c2eb5d23-c385-4008-bf3e-e3ff18424df1', 'a8286840-79af-4754-9b26-66300785c77f', '9ea82ead-3b24-4701-a4cd-34cff9b8a185', '2026-06-01', '2026-06-25', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-06-25 12:00:00-03'),
('90f0ddeb-c9db-4dcc-8e44-a762dda361ee', 'a8286840-79af-4754-9b26-66300785c77f', '9ea82ead-3b24-4701-a4cd-34cff9b8a185', '2026-07-01', '2026-07-29', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-07-29 12:00:00-03'),
('43f927ef-881a-493a-9202-10466362ddf4', 'a8286840-79af-4754-9b26-66300785c77f', '9ea82ead-3b24-4701-a4cd-34cff9b8a185', '2026-08-01', '2026-08-25', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-08-25 12:00:00-03'),
('3f654e2b-4178-4eeb-8636-71cc0ba3cade', 'a8286840-79af-4754-9b26-66300785c77f', '9ea82ead-3b24-4701-a4cd-34cff9b8a185', '2026-09-01', '2026-09-29', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-09-29 12:00:00-03'),
('a44e9a86-8f21-4ab4-b137-0274d5679508', 'a8286840-79af-4754-9b26-66300785c77f', '9ea82ead-3b24-4701-a4cd-34cff9b8a185', '2026-10-01', '2026-10-27', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-10-27 12:00:00-03'),
('bcbdc999-54d7-49df-a713-520386935290', 'a8286840-79af-4754-9b26-66300785c77f', '4a5fd847-806a-4c2d-84cc-081fe0561ef8', '2026-01-01', '2026-01-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-01-10 12:00:00-03'),
('86213c16-1fbd-4247-a0e5-2c22590aadb2', 'a8286840-79af-4754-9b26-66300785c77f', '4a5fd847-806a-4c2d-84cc-081fe0561ef8', '2026-02-01', '2026-02-11', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-02-11 12:00:00-03'),
('dd2da3e9-7946-4b6e-849b-456c2b7325db', 'a8286840-79af-4754-9b26-66300785c77f', '4a5fd847-806a-4c2d-84cc-081fe0561ef8', '2026-03-01', '2026-03-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-03-10 12:00:00-03'),
('73500b8a-4613-4147-a2c9-0c87444d9e9b', 'a8286840-79af-4754-9b26-66300785c77f', '4a5fd847-806a-4c2d-84cc-081fe0561ef8', '2026-04-01', '2026-04-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-04-10 12:00:00-03'),
('97bc9809-48a6-49fb-a14c-fe886b84fa34', 'a8286840-79af-4754-9b26-66300785c77f', '4a5fd847-806a-4c2d-84cc-081fe0561ef8', '2026-05-01', '2026-05-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-05-10 12:00:00-03'),
('236f09d4-8364-4616-923f-68c5585b3d30', 'a8286840-79af-4754-9b26-66300785c77f', '4a5fd847-806a-4c2d-84cc-081fe0561ef8', '2026-06-01', '2026-06-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-06-10 12:00:00-03'),
('7a4e10a4-190c-43b2-9e3f-332940a726f1', 'a8286840-79af-4754-9b26-66300785c77f', '4a5fd847-806a-4c2d-84cc-081fe0561ef8', '2026-07-01', '2026-07-13', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-07-13 12:00:00-03'),
('9a097d34-bb6d-47e1-9d49-2379d0c9d578', 'a8286840-79af-4754-9b26-66300785c77f', '4a5fd847-806a-4c2d-84cc-081fe0561ef8', '2026-08-01', '2026-08-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-08-10 12:00:00-03'),
('9ebd3db6-3aa4-4d34-b54e-40a378db691b', 'a8286840-79af-4754-9b26-66300785c77f', '4a5fd847-806a-4c2d-84cc-081fe0561ef8', '2026-09-01', '2026-09-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-09-10 12:00:00-03'),
('f46b8f66-b3de-409c-b31b-45571b485e11', 'a8286840-79af-4754-9b26-66300785c77f', '4a5fd847-806a-4c2d-84cc-081fe0561ef8', '2026-10-01', '2026-10-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-10-10 12:00:00-03'),
('ac3e22da-a087-4db0-bb10-2e6e04aa95f5', 'a8286840-79af-4754-9b26-66300785c77f', '8d883261-ddde-483c-85ce-f683a2867c9a', '2026-01-01', '2026-01-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-01-15 12:00:00-03'),
('461985e3-c965-4b8d-ae5b-cb50eb79c290', 'a8286840-79af-4754-9b26-66300785c77f', '8d883261-ddde-483c-85ce-f683a2867c9a', '2026-02-01', '2026-02-16', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-02-16 12:00:00-03'),
('23344ec4-92a6-4229-ba37-90ebd37f657d', 'a8286840-79af-4754-9b26-66300785c77f', '8d883261-ddde-483c-85ce-f683a2867c9a', '2026-03-01', '2026-03-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-03-15 12:00:00-03'),
('16f9068f-9f6f-4199-b944-5ae45f000fda', 'a8286840-79af-4754-9b26-66300785c77f', '8d883261-ddde-483c-85ce-f683a2867c9a', '2026-04-01', '2026-04-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-04-15 12:00:00-03'),
('731c18be-a61c-4172-b205-c44cf9a75a29', 'a8286840-79af-4754-9b26-66300785c77f', '8d883261-ddde-483c-85ce-f683a2867c9a', '2026-05-01', '2026-05-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-05-15 12:00:00-03'),
('def7f423-76de-4a53-9b6c-a7a989a1c7ba', 'a8286840-79af-4754-9b26-66300785c77f', '8d883261-ddde-483c-85ce-f683a2867c9a', '2026-06-01', '2026-06-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-06-15 12:00:00-03'),
('37cc0ce6-eddc-4c43-99ce-f247233a95e0', 'a8286840-79af-4754-9b26-66300785c77f', '8d883261-ddde-483c-85ce-f683a2867c9a', '2026-07-01', '2026-07-16', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-07-16 12:00:00-03'),
('ba87139d-7d45-4233-8a62-12b0a3c9f3d2', 'a8286840-79af-4754-9b26-66300785c77f', '8d883261-ddde-483c-85ce-f683a2867c9a', '2026-08-01', '2026-08-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-08-15 12:00:00-03'),
('b5ebb157-f464-4e4e-b4e3-ccc5670fb2c8', 'a8286840-79af-4754-9b26-66300785c77f', '8d883261-ddde-483c-85ce-f683a2867c9a', '2026-09-01', '2026-09-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-09-15 12:00:00-03'),
('92f68a43-aed1-44c6-ab7b-ad35e8b7bfa7', 'a8286840-79af-4754-9b26-66300785c77f', '8d883261-ddde-483c-85ce-f683a2867c9a', '2026-10-01', '2026-10-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-10-15 12:00:00-03'),
('8fba84af-88ba-4ef4-907c-6c8912ae6db3', 'a8286840-79af-4754-9b26-66300785c77f', '00bbb61a-c9e5-416f-ad89-09956b7e595b', '2026-01-01', '2026-01-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-01-10 12:00:00-03'),
('8f2f7f98-d5bb-4d14-b8c9-0a4e53191c27', 'a8286840-79af-4754-9b26-66300785c77f', '00bbb61a-c9e5-416f-ad89-09956b7e595b', '2026-02-01', '2026-02-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-02-10 12:00:00-03'),
('367d32df-ec7d-43cf-bfb7-e517349cb002', 'a8286840-79af-4754-9b26-66300785c77f', '00bbb61a-c9e5-416f-ad89-09956b7e595b', '2026-03-01', '2026-03-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-03-10 12:00:00-03'),
('c1bb3dd3-d155-4571-b2de-cb1dd662aa2b', 'a8286840-79af-4754-9b26-66300785c77f', '00bbb61a-c9e5-416f-ad89-09956b7e595b', '2026-04-01', '2026-04-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-04-10 12:00:00-03'),
('b83e3d4d-0adb-42a3-889e-146c0a5cb269', 'a8286840-79af-4754-9b26-66300785c77f', '00bbb61a-c9e5-416f-ad89-09956b7e595b', '2026-05-01', '2026-05-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-05-10 12:00:00-03'),
('d8ced232-c4f6-4911-b792-757db5fd3618', 'a8286840-79af-4754-9b26-66300785c77f', '00bbb61a-c9e5-416f-ad89-09956b7e595b', '2026-06-01', '2026-06-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-06-10 12:00:00-03'),
('358b9a9b-0111-4d84-8742-f1cb67c04380', 'a8286840-79af-4754-9b26-66300785c77f', '00bbb61a-c9e5-416f-ad89-09956b7e595b', '2026-07-01', '2026-07-14', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-07-14 12:00:00-03'),
('77fce3f6-51ce-4125-95ee-ca559b63a93c', 'a8286840-79af-4754-9b26-66300785c77f', '00bbb61a-c9e5-416f-ad89-09956b7e595b', '2026-08-01', '2026-08-12', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-08-12 12:00:00-03'),
('99b7341b-def9-4174-b22a-e5cdb2c26144', 'a8286840-79af-4754-9b26-66300785c77f', '00bbb61a-c9e5-416f-ad89-09956b7e595b', '2026-09-01', '2026-09-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-09-10 12:00:00-03'),
('a565a503-1a93-4342-9775-86bafc02b412', 'a8286840-79af-4754-9b26-66300785c77f', '00bbb61a-c9e5-416f-ad89-09956b7e595b', '2026-10-01', '2026-10-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-10-10 12:00:00-03'),
('3927771e-c20b-4140-a899-6b4003501ff1', 'a8286840-79af-4754-9b26-66300785c77f', 'ccaf8584-1c3c-4457-8c1e-b1b00257e179', '2026-01-01', '2026-01-15', 'fechado', 0, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-01-15 12:00:00-03'),
('00dbd5fb-0484-4842-91c6-a820d07c0b6b', 'a8286840-79af-4754-9b26-66300785c77f', 'ccaf8584-1c3c-4457-8c1e-b1b00257e179', '2026-02-01', '2026-02-10', 'fechado', 0, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-02-10 12:00:00-03'),
('ab7c50fc-69bd-41e5-8c71-a4b64386d567', 'a8286840-79af-4754-9b26-66300785c77f', 'ccaf8584-1c3c-4457-8c1e-b1b00257e179', '2026-03-01', '2026-03-15', 'fechado', 0, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-03-15 12:00:00-03'),
('f7679312-b585-41e1-a213-b35e244f514f', 'a8286840-79af-4754-9b26-66300785c77f', 'ccaf8584-1c3c-4457-8c1e-b1b00257e179', '2026-04-01', '2026-04-15', 'fechado', 0, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-04-15 12:00:00-03'),
('d19eafce-597c-49dd-b302-cbfe7ae7fbca', 'a8286840-79af-4754-9b26-66300785c77f', 'ccaf8584-1c3c-4457-8c1e-b1b00257e179', '2026-05-01', '2026-05-15', 'fechado', 0, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-05-15 12:00:00-03'),
('dcf2748f-8984-43c9-b221-89cbec36484a', 'a8286840-79af-4754-9b26-66300785c77f', 'ccaf8584-1c3c-4457-8c1e-b1b00257e179', '2026-06-01', '2026-06-15', 'fechado', 0, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-06-15 12:00:00-03'),
('f5a35b74-7e16-43b7-b571-44b0e85fcefd', 'a8286840-79af-4754-9b26-66300785c77f', 'ccaf8584-1c3c-4457-8c1e-b1b00257e179', '2026-07-01', '2026-07-13', 'fechado', 0, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-07-13 12:00:00-03'),
('21b49af4-dd6a-43c0-9d5d-3531e7247112', 'a8286840-79af-4754-9b26-66300785c77f', 'ccaf8584-1c3c-4457-8c1e-b1b00257e179', '2026-08-01', '2026-08-15', 'fechado', 0, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-08-15 12:00:00-03'),
('dc3e3391-222b-4861-a16f-78506687792b', 'a8286840-79af-4754-9b26-66300785c77f', 'ccaf8584-1c3c-4457-8c1e-b1b00257e179', '2026-09-01', '2026-09-15', 'fechado', 0, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-09-15 12:00:00-03'),
('a05e2449-82cf-4e11-ba6e-b97b67682ae9', 'a8286840-79af-4754-9b26-66300785c77f', 'ccaf8584-1c3c-4457-8c1e-b1b00257e179', '2026-10-01', '2026-10-15', 'fechado', 0, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-10-15 12:00:00-03'),
('01e54cd0-a590-4618-987b-6e376c849106', 'a8286840-79af-4754-9b26-66300785c77f', 'bfca0c68-81f0-4f58-8fe8-cd19d59aa064', '2026-01-01', '2026-01-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-01-15 12:00:00-03'),
('b4ceda2b-1544-412d-bdc4-7b8c7410a3e6', 'a8286840-79af-4754-9b26-66300785c77f', 'bfca0c68-81f0-4f58-8fe8-cd19d59aa064', '2026-02-01', '2026-02-16', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-02-16 12:00:00-03'),
('92dafe31-946d-456c-b45f-ce7a7b0bf4a7', 'a8286840-79af-4754-9b26-66300785c77f', 'bfca0c68-81f0-4f58-8fe8-cd19d59aa064', '2026-03-01', '2026-03-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-03-15 12:00:00-03'),
('b42a4174-dc2f-4f2e-8ba8-55a759fc276d', 'a8286840-79af-4754-9b26-66300785c77f', 'bfca0c68-81f0-4f58-8fe8-cd19d59aa064', '2026-04-01', '2026-04-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-04-15 12:00:00-03'),
('26785788-59f9-4ce6-b74f-1f56ec2aaa9c', 'a8286840-79af-4754-9b26-66300785c77f', 'bfca0c68-81f0-4f58-8fe8-cd19d59aa064', '2026-05-01', '2026-05-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-05-15 12:00:00-03'),
('1542c1f3-bc93-4fc8-8038-c93d6595a036', 'a8286840-79af-4754-9b26-66300785c77f', 'bfca0c68-81f0-4f58-8fe8-cd19d59aa064', '2026-06-01', '2026-06-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-06-15 12:00:00-03'),
('befa24f2-dfc9-4b47-b8dc-c8a083a19707', 'a8286840-79af-4754-9b26-66300785c77f', 'bfca0c68-81f0-4f58-8fe8-cd19d59aa064', '2026-07-01', '2026-07-16', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-07-16 12:00:00-03'),
('61dd4235-7bfc-4259-ba32-1e8162118df9', 'a8286840-79af-4754-9b26-66300785c77f', 'bfca0c68-81f0-4f58-8fe8-cd19d59aa064', '2026-08-01', '2026-08-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-08-15 12:00:00-03'),
('b84f65c8-e6ae-4d37-badf-a2b1949b3392', 'a8286840-79af-4754-9b26-66300785c77f', 'bfca0c68-81f0-4f58-8fe8-cd19d59aa064', '2026-09-01', '2026-09-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-09-15 12:00:00-03'),
('9aa73e5a-8254-4c4d-9dd4-152a3db8019e', 'a8286840-79af-4754-9b26-66300785c77f', 'bfca0c68-81f0-4f58-8fe8-cd19d59aa064', '2026-10-01', '2026-10-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-10-15 12:00:00-03'),
('41fde4d8-a1e1-4612-87a7-e07398867fb3', 'a8286840-79af-4754-9b26-66300785c77f', '0a363657-9dba-4305-8108-fd3a0b37283c', '2026-02-01', '2026-02-23', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-02-23 12:00:00-03'),
('6a5eb75e-5eb2-4e06-ae87-8e567a142074', 'a8286840-79af-4754-9b26-66300785c77f', '0a363657-9dba-4305-8108-fd3a0b37283c', '2026-03-01', '2026-03-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-03-20 12:00:00-03'),
('fc0943b5-d9c1-487f-aa74-1999c571c052', 'a8286840-79af-4754-9b26-66300785c77f', '0a363657-9dba-4305-8108-fd3a0b37283c', '2026-04-01', '2026-04-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-04-20 12:00:00-03'),
('e83237d0-0df0-44ac-8dbf-094d812c2e55', 'a8286840-79af-4754-9b26-66300785c77f', '0a363657-9dba-4305-8108-fd3a0b37283c', '2026-05-01', '2026-05-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-05-20 12:00:00-03'),
('a1a9a667-662f-4a7f-9631-7d44376186ea', 'a8286840-79af-4754-9b26-66300785c77f', '0a363657-9dba-4305-8108-fd3a0b37283c', '2026-06-01', '2026-06-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-06-20 12:00:00-03'),
('a0441009-dd45-4d21-96e9-4a92be355772', 'a8286840-79af-4754-9b26-66300785c77f', '0a363657-9dba-4305-8108-fd3a0b37283c', '2026-07-01', '2026-07-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-07-20 12:00:00-03'),
('d9099b4b-0f17-4e07-954f-0cf3794f28fb', 'a8286840-79af-4754-9b26-66300785c77f', '0a363657-9dba-4305-8108-fd3a0b37283c', '2026-08-01', '2026-08-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-08-20 12:00:00-03'),
('ce2c8223-0862-45eb-bb92-ee0489b39ebb', 'a8286840-79af-4754-9b26-66300785c77f', '0a363657-9dba-4305-8108-fd3a0b37283c', '2026-09-01', '2026-09-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-09-20 12:00:00-03'),
('8c7933d9-ade8-4051-a958-599d3490b625', 'a8286840-79af-4754-9b26-66300785c77f', '0a363657-9dba-4305-8108-fd3a0b37283c', '2026-10-01', '2026-10-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-10-20 12:00:00-03'),
('8968a0a1-ab1e-4f71-99df-af8d8b4dab97', 'a8286840-79af-4754-9b26-66300785c77f', '284b5912-7cfc-4e3e-a75b-d8b72bb24418', '2026-01-01', '2026-01-25', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-01-25 12:00:00-03'),
('d674331b-d0c4-45c0-8f9c-6803dce3d892', 'a8286840-79af-4754-9b26-66300785c77f', '284b5912-7cfc-4e3e-a75b-d8b72bb24418', '2026-02-01', '2026-02-26', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-02-26 12:00:00-03'),
('b6674726-a655-4de0-8fe9-3c51444b3309', 'a8286840-79af-4754-9b26-66300785c77f', '284b5912-7cfc-4e3e-a75b-d8b72bb24418', '2026-03-01', '2026-03-25', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-03-25 12:00:00-03'),
('20112a57-bd65-4ae8-8dac-390b696e8dd5', 'a8286840-79af-4754-9b26-66300785c77f', '284b5912-7cfc-4e3e-a75b-d8b72bb24418', '2026-04-01', '2026-04-25', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-04-25 12:00:00-03'),
('dc619ff2-689d-4c77-879e-66091d577dfc', 'a8286840-79af-4754-9b26-66300785c77f', '284b5912-7cfc-4e3e-a75b-d8b72bb24418', '2026-05-01', '2026-05-25', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-05-25 12:00:00-03'),
('265f6a3b-0d62-4a2f-adec-19abd26bf782', 'a8286840-79af-4754-9b26-66300785c77f', '284b5912-7cfc-4e3e-a75b-d8b72bb24418', '2026-06-01', '2026-06-25', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-06-25 12:00:00-03'),
('ae01e9e2-f54b-4e2a-94c1-113d5baa7e48', 'a8286840-79af-4754-9b26-66300785c77f', '284b5912-7cfc-4e3e-a75b-d8b72bb24418', '2026-07-01', '2026-07-29', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-07-29 12:00:00-03'),
('8e2fcc4d-e081-4258-921c-cc8434fe0325', 'a8286840-79af-4754-9b26-66300785c77f', '284b5912-7cfc-4e3e-a75b-d8b72bb24418', '2026-08-01', '2026-08-25', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-08-25 12:00:00-03'),
('9ce97090-76c8-46fd-9e31-423e07817a47', 'a8286840-79af-4754-9b26-66300785c77f', '284b5912-7cfc-4e3e-a75b-d8b72bb24418', '2026-09-01', '2026-09-25', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-09-25 12:00:00-03'),
('a9c06da2-f0d8-402e-8c41-a0ec6574b953', 'a8286840-79af-4754-9b26-66300785c77f', '284b5912-7cfc-4e3e-a75b-d8b72bb24418', '2026-10-01', '2026-10-28', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-10-28 12:00:00-03'),
('4b7a8e55-ae2b-4858-ae20-c796bb97ed57', 'a8286840-79af-4754-9b26-66300785c77f', 'd7f9f54f-7c93-4611-8a16-e9477125f281', '2026-01-01', '2026-01-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-01-10 12:00:00-03'),
('eb6bd64d-a325-4a75-93ce-10c0d768239d', 'a8286840-79af-4754-9b26-66300785c77f', 'd7f9f54f-7c93-4611-8a16-e9477125f281', '2026-02-01', '2026-02-11', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-02-11 12:00:00-03'),
('3620537e-bb8f-45af-a5c9-9e984221faa6', 'a8286840-79af-4754-9b26-66300785c77f', 'd7f9f54f-7c93-4611-8a16-e9477125f281', '2026-03-01', '2026-03-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-03-10 12:00:00-03'),
('7c709eac-caf6-492c-8cbe-49176274b0e4', 'a8286840-79af-4754-9b26-66300785c77f', 'd7f9f54f-7c93-4611-8a16-e9477125f281', '2026-04-01', '2026-04-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-04-10 12:00:00-03'),
('a6372a08-a106-42f8-a168-2350a3c4b975', 'a8286840-79af-4754-9b26-66300785c77f', 'd7f9f54f-7c93-4611-8a16-e9477125f281', '2026-05-01', '2026-05-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-05-10 12:00:00-03'),
('3a083e5a-5a17-4814-8149-e304619b7303', 'a8286840-79af-4754-9b26-66300785c77f', 'd7f9f54f-7c93-4611-8a16-e9477125f281', '2026-06-01', '2026-06-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-06-10 12:00:00-03'),
('3971629b-f3e2-4424-adc8-04c85cc12eb6', 'a8286840-79af-4754-9b26-66300785c77f', 'd7f9f54f-7c93-4611-8a16-e9477125f281', '2026-07-01', '2026-07-16', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-07-16 12:00:00-03'),
('c535a32a-a118-4c71-9703-a55ef9add485', 'a8286840-79af-4754-9b26-66300785c77f', 'd7f9f54f-7c93-4611-8a16-e9477125f281', '2026-08-01', '2026-08-10', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-08-10 12:00:00-03'),
('725276ce-f0d8-4ee2-9a42-785c7778fe40', 'a8286840-79af-4754-9b26-66300785c77f', 'd7f9f54f-7c93-4611-8a16-e9477125f281', '2026-09-01', '2026-09-17', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-09-17 12:00:00-03'),
('4c7f3ae1-b3c5-4ac0-a64f-d21b43eca144', 'a8286840-79af-4754-9b26-66300785c77f', 'd7f9f54f-7c93-4611-8a16-e9477125f281', '2026-10-01', '2026-10-15', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-10-15 12:00:00-03'),
('835ea1c6-bfbd-49fb-8d1b-12d982e8955d', 'a8286840-79af-4754-9b26-66300785c77f', '071181eb-68f2-475d-adff-2ff5e4788fcc', '2026-01-01', '2026-01-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-01-20 12:00:00-03'),
('1291af53-4228-4c84-95c6-0db8d1582fa8', 'a8286840-79af-4754-9b26-66300785c77f', '071181eb-68f2-475d-adff-2ff5e4788fcc', '2026-02-01', '2026-02-26', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-02-26 12:00:00-03'),
('94087f4f-c997-466b-a5e0-26da68b27133', 'a8286840-79af-4754-9b26-66300785c77f', '071181eb-68f2-475d-adff-2ff5e4788fcc', '2026-03-01', '2026-03-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-03-20 12:00:00-03'),
('7592d687-af74-4320-8cde-d627ef2a148a', 'a8286840-79af-4754-9b26-66300785c77f', '071181eb-68f2-475d-adff-2ff5e4788fcc', '2026-04-01', '2026-04-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-04-20 12:00:00-03'),
('79fab0eb-3bc6-428e-8a8b-5d2cbbb978a0', 'a8286840-79af-4754-9b26-66300785c77f', '071181eb-68f2-475d-adff-2ff5e4788fcc', '2026-05-01', '2026-05-25', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-05-25 12:00:00-03'),
('8f584a8b-58c3-42ae-abbc-69faca81f7fb', 'a8286840-79af-4754-9b26-66300785c77f', '071181eb-68f2-475d-adff-2ff5e4788fcc', '2026-06-01', '2026-06-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-06-20 12:00:00-03'),
('04d59e7d-2991-48b6-9962-2ec2f651b19c', 'a8286840-79af-4754-9b26-66300785c77f', '071181eb-68f2-475d-adff-2ff5e4788fcc', '2026-07-01', '2026-07-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-07-20 12:00:00-03'),
('12231345-ad1b-41ac-a9e8-4f50e924032b', 'a8286840-79af-4754-9b26-66300785c77f', '071181eb-68f2-475d-adff-2ff5e4788fcc', '2026-08-01', '2026-08-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-08-20 12:00:00-03'),
('73a4dbb2-286a-4072-a958-73a786a715fc', 'a8286840-79af-4754-9b26-66300785c77f', '071181eb-68f2-475d-adff-2ff5e4788fcc', '2026-09-01', '2026-09-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-09-20 12:00:00-03'),
('70a72391-9a5f-4bf5-bd8d-044cdafa95b3', 'a8286840-79af-4754-9b26-66300785c77f', '071181eb-68f2-475d-adff-2ff5e4788fcc', '2026-10-01', '2026-10-20', 'fechado', 65, 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', 'ae4e28c1-14b3-4076-8697-3a3f82567f7f', '2026-10-20 12:00:00-03')
ON CONFLICT (id) DO NOTHING;
