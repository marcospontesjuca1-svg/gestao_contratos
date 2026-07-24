# Modelo de Dados — Gestão de Contratos (Ativos Imobiliários)

Este documento define o schema definitivo do Firestore, com base:
1. Nos requisitos funcionais descritos no briefing do projeto.
2. Na planilha real fornecida (`Lista_Geral_Imóveis_23.07.2026.xls`), aba `LISTA GERAL IMÓVEIS`, 301 imóveis / 24 colunas.

## 1. Estrutura de coleções do Firestore

```
imoveis/{imovelId}
usuarios/{uid}
configuracoes/geral
importacoes/{importacaoId}          (histórico de importações)
```

Não há necessidade de subcoleções no MVP: o volume (~300 imóveis, tendência de
crescimento lento) cabe folgado em uma única coleção `imoveis`, com queries
compostas (índices) para os filtros. Histórico de locações passadas (se
necessário no futuro) pode virar subcoleção `imoveis/{id}/locacoes` sem quebrar
o schema atual — hoje só guardamos a locação vigente.

## 2. `imoveis/{imovelId}`

| Campo Firestore | Tipo | Coluna original na planilha | Observações |
|---|---|---|---|
| `endereco` | string | `ENDEREÇO` | Campo livre, único campo 100% preenchido (301/301) |
| `pastaFisica` | boolean | `PASTA` (S/N) | Indica se existe pasta física com documentação |
| `kmzUrl` | string \| null | `KMZ` (vazia na planilha) | URL do arquivo KMZ (Storage) ou link do Google Earth |
| `coordenadas` | `{ lat: number, lng: number } \| null` | — (novo) | Preenchido manualmente ou extraído do KMZ |
| `estado` | string \| null | `ESTADO` (vazia) | UF. Pré-preenchido via parser de endereço na importação, revisar manualmente |
| `municipio` | string \| null | `MUNICÍPIO` (vazia) | Pré-preenchido via parser de endereço (best-effort) |
| `bairro` | string \| null | `BAIRRO` (vazia) | Idem — poucos endereços trazem bairro explícito |
| `enderecoRevisado` | boolean | — (novo) | `false` quando estado/município/bairro vieram do parser automático; UI sinaliza "revisar" |
| `operacao` | `'VENDA' \| 'LOCACAO' \| 'DESENVOLVIMENTO'` | `OPERAÇÃO` (quase toda vazia, 4 = "VENDA") | Default `'LOCACAO'` quando vazio. "Uso interno" não é uma operação — fica registrado em `status = 'ATIVO_INTERNO'` |
| `segmento` | string (texto livre) \| null | `SEGMENTO` (100% vazia) | Natureza de uso do imóvel (ex.: Varejo, Shopping, Galpão, Depósito, Construção civil) — não é uma lista fechada, fica a critério de quem cadastra |
| `proprietario` | string | `PROPRIETÁRIOS` | Sigla da empresa/pessoa proprietária (ex.: ESAM, CPC, C.ROLIM, SAMA SARO) |
| `tipo` | string (enum aberto) | `TIPO` | Valores observados: `SALA`, `LOJA`, `TERRENO`, `APTO`, `PRÉDIO`, `MALL`, `CASA` |
| `valorContabil` | number \| null | `Valor Contábil` (vazia) | Valor contábil do ativo |
| `valorMercadoImovel` | number \| null | `Valor de Mercado` (vazia) | Valor de mercado do imóvel como um todo (avaliação), diferente do R$/m² regional |
| `status` | `'LOCADO' \| 'VAGO' \| 'ATIVO_INTERNO' \| 'LOCADO_PARCIAL'` | `STATUS` | `LOCADO_PARCIAL` cobre o caso observado `"LOCADO / VAGO"` (imóvel com partes distintas) |
| `matriculaZona` | string \| null | `MATRÍCULA / ZONA` | Ex.: `"574 / 4ª"` |
| `inscricaoIptu` | string \| null | `INSC. IPTU` | Mantido como string (tem formatos como `07-2210-0001-0500`) |
| `areaTerreno` | number \| null | `ÁREA TERRENO` | m² |
| `areaConstruida` | number \| null | `ÁREA CONSTRUÍDA` | m² |
| `nomeFantasia` | string \| null | `NOME DE FANTASIA` (vazia) | Nome fantasia do empreendimento/loja, quando aplicável |
| `fotos` | string[] | — (novo, sugestão aceita) | URLs de fotos no Firebase Storage (`imoveis/{id}/fotos/...`) |
| `anexos` | `{ nome: string, url: string, tipo: string }[]` | — (novo) | Documentos anexos (matrícula, contrato, IPTU) |
| `locacao.locatario` | string \| null | `LOCATÁRIO` | |
| `locacao.valorAluguel` | number \| null | `VALOR` | Valor mensal do aluguel (R$) |
| `locacao.dataInicio` | Timestamp \| null | `INÍCIO` | |
| `locacao.dataFim` | Timestamp \| null | `FIM` | |
| `locacao.reajuste` | string \| null | `REAJUSTE` | Índice/mês de reajuste. Valores observados combinam mês + índice (ex.: `"MAR / IPCA"`, `"JAN"`) |
| `locacao.valorM2` | number \| null | `R$ M² LOC` | R$/m² pago pelo locatário — calculado na planilha, recalculado no sistema (`valorAluguel / areaConstruida`) e guardado para consistência histórica |
| `comparativoMercado.valorM2Regiao` | number \| null | — (novo, requisito "comparativo de mercado") | Preenchido **manualmente** no MVP (decisão do usuário) |
| `comparativoMercado.fonte` | string \| null | — (novo) | Ex.: "FipeZAP", "corretor local", link de anúncio |
| `comparativoMercado.atualizadoEm` | Timestamp \| null | — (novo) | |
| `comparativoMercado.atualizadoPor` | string (uid) \| null | — (novo) | |
| `criadoEm` / `atualizadoEm` | Timestamp | — | Auditoria |
| `criadoPor` / `atualizadoPor` | string (uid) | — | Auditoria |
| `importadoDe` | string \| null | — | Id do documento em `importacoes/` que originou o registro (rastreabilidade) |

### Cálculo de `comparativoMercado` (exibição)
```
diferencaPercentual = (locacao.valorM2 - comparativoMercado.valorM2Regiao) / comparativoMercado.valorM2Regiao
```
Exibido como badge: acima da média / na média / abaixo da média de mercado.

## 3. `usuarios/{uid}`

| Campo | Tipo | Descrição |
|---|---|---|
| `nome` | string | |
| `email` | string | Espelha o e-mail do Firebase Auth |
| `perfil` | `'admin' \| 'operador'` | `admin`: CRUD completo, gestão de usuários, importação, configurações. `operador`: apenas leitura/consulta de imóveis e comparativo |
| `ativo` | boolean | Permite desativar acesso sem apagar o usuário |
| `criadoEm` | Timestamp | |

O `perfil` também é espelhado em **custom claims** do Firebase Auth (via Cloud
Function `onUserCreate`/callable admin) para uso nas Security Rules — o
Firestore não confia em client-side role checks sozinho.

## 4. `configuracoes/geral`

| Campo | Tipo | Descrição |
|---|---|---|
| `backupAtivo` | boolean | Liga/desliga rotina de backup |
| `backupFrequencia` | `'DIARIO' \| 'SEMANAL' \| 'MENSAL'` | |
| `backupUltimaExecucao` | Timestamp \| null | |
| `backupDestino` | string \| null | Ex.: bucket do Cloud Storage |

## 5. `importacoes/{importacaoId}`

| Campo | Tipo | Descrição |
|---|---|---|
| `arquivoNome` | string | |
| `realizadoPor` | string (uid) | |
| `realizadoEm` | Timestamp | |
| `totalLinhas` | number | |
| `totalImportados` | number | |
| `totalComAvisos` | number | Linhas importadas mas com campos que precisam revisão (ex.: endereço não parseado) |
| `erros` | `{ linha: number, motivo: string }[]` | |

## 6. Índices compostos necessários (`firestore.indexes.json`)

Para suportar filtros combinados (estado + tipo + status + faixa de preço):
- `imoveis`: (`estado` ASC, `status` ASC, `locacao.valorAluguel` ASC)
- `imoveis`: (`municipio` ASC, `tipo` ASC)
- `imoveis`: (`status` ASC, `locacao.valorAluguel` ASC)

Filtros adicionais (bairro, texto livre no endereço) são aplicados client-side
sobre o resultado paginado, dado o volume atual (~300 registros) — evita
multiplicar índices compostos no MVP.

## 7. Observações sobre a planilha original

- **Volume**: 301 imóveis, 24 colunas, aba única.
- **Colunas nunca preenchidas na planilha**: `KMZ`, `ESTADO`, `MUNICÍPIO`,
  `BAIRRO`, `SEGMENTO`, `Valor Contábil`, `Valor de Mercado`,
  `NOME DE FANTASIA`. Todas existem no schema novo, mas chegarão vazias (ou
  parcialmente inferidas) na importação inicial — ficam sinalizadas para
  revisão manual (campo `enderecoRevisado = false`, ou simplesmente vazias).
- **`STATUS`**: `LOCADO` (181), `ATIVO INTERNO` (64), `VAGO` (48), 7 vazios
  (tratados como `VAGO` por padrão), 1 caso `"LOCADO / VAGO"` → `LOCADO_PARCIAL`.
- **`TIPO`**: `SALA` (117), `LOJA` (44), `TERRENO` (42), `APTO.` (34),
  `PRÉDIO` (27), `MALL` (26), `CASA` (10), 1 vazio.
- **`PROPRIETÁRIOS`**: `ESAM` (146), `CPC` (113), `C.ROLIM` (22),
  `SAMA SARO` (12), outros residuais.
- **`PASTA`**: `S`/`N`/vazio — assumido `false` quando vazio.
