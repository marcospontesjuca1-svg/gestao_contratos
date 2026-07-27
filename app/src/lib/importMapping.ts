import { Timestamp } from 'firebase/firestore'
import type { DadosLocacao, Imovel, ImovelInput, Operacao, StatusImovel, TipoImovel } from '../types/imovel'

/**
 * Mapeamento de colunas -> campos, calibrado com a planilha real
 * "Lista_Geral_Imóveis" (301 linhas, 24 colunas). Ver docs/MODELO_DE_DADOS.md.
 */
export const COLUNAS_ESPERADAS = [
  'ENDEREÇO',
  'PASTA',
  'KMZ',
  'ESTADO',
  'CIDADE', // aceito como sinônimo de MUNICÍPIO
  'MUNICÍPIO',
  'BAIRRO',
  'OPERAÇÃO',
  'SEGMENTO',
  'PROPRIETÁRIOS',
  'TIPO',
  'VALOR CONTÁBIL',
  'VALOR DE MERCADO',
  'STATUS',
  'MATRÍCULA / ZONA',
  'INSC. IPTU',
  'ÁREA TERRENO',
  'ÁREA CONSTRUÍDA',
  'NOME DE FANTASIA',
  'LOCATÁRIO',
  'VALOR',
  'INÍCIO',
  'FIM',
  'REAJUSTE',
  'R$ M² LOC',
] as const

export interface LinhaImportada {
  imovel: ImovelInput
  avisos: string[]
}

/**
 * Normaliza as chaves da linha (maiúsculas, sem espaços nas pontas) para
 * casar com COLUNAS_ESPERADAS mesmo que a planilha use "Cidade", " CIDADE "
 * etc. em vez de "CIDADE" exatamente.
 */
function normalizarChaves(linha: Record<string, unknown>): Record<string, unknown> {
  const normalizada: Record<string, unknown> = {}
  for (const [chave, valor] of Object.entries(linha)) {
    normalizada[chave.trim().toUpperCase()] = valor
  }
  return normalizada
}

function textoOuNull(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function numeroOuNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function dataOuNull(v: unknown): Timestamp | null {
  if (v == null || v === '') return null
  if (v instanceof Date) return Timestamp.fromDate(v)
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : Timestamp.fromDate(d)
}

function normalizarStatus(raw: unknown): StatusImovel {
  const s = textoOuNull(raw)?.toUpperCase() ?? ''
  if (s.includes('LOCADO') && s.includes('VAGO')) return 'LOCADO_PARCIAL'
  if (s.includes('ATIVO INTERNO')) return 'ATIVO_INTERNO'
  if (s.includes('LOCADO')) return 'LOCADO'
  if (s.includes('VAGO')) return 'VAGO'
  return 'VAGO'
}

function normalizarTipo(raw: unknown): TipoImovel {
  const s = (textoOuNull(raw) ?? '').toUpperCase().replace(/\.$/, '').trim()
  if (s === 'PRÉDIO' || s === 'PREDIO') return 'PREDIO'
  if (s === 'APTO' || s === 'APARTAMENTO') return 'APTO'
  return (s || 'SALA') as TipoImovel
}

function normalizarOperacao(raw: unknown): Operacao {
  const s = textoOuNull(raw)?.toUpperCase() ?? ''
  if (s.includes('VENDA')) return 'VENDA'
  if (s.includes('DESENVOLVIMENTO')) return 'DESENVOLVIMENTO'
  return 'LOCACAO'
}

/**
 * Extração best-effort de município/bairro a partir do endereço livre.
 * Padrão observado: "LOGRADOURO, NÚMERO - CIDADE" (ex.: "AMERICO BUAIZ, 200 - VITORIA").
 * Quando não há esse padrão, município/bairro ficam null e o registro é
 * marcado como `enderecoRevisado: false` para revisão manual na UI.
 */
export function extrairLocalizacaoDoEndereco(endereco: string): { municipio: string | null; bairro: string | null; confiavel: boolean } {
  const partes = endereco.split(' - ')
  if (partes.length < 2) return { municipio: null, bairro: null, confiavel: false }

  const candidato = partes[partes.length - 1].trim()
  // Heurística: candidato parece nome de cidade se não tiver dígitos e tiver ao menos 3 letras.
  const pareceCidade = candidato.length >= 3 && !/\d/.test(candidato) && !/^(APTO|SALA|LOJA|BLOCO|QD|LT)\b/i.test(candidato)

  if (!pareceCidade) return { municipio: null, bairro: null, confiavel: false }
  return { municipio: candidato, bairro: null, confiavel: true }
}

/** Converte uma linha bruta da planilha (objeto com as chaves de COLUNAS_ESPERADAS) em um ImovelInput. */
export function mapearLinha(linhaBruta: Record<string, unknown>): LinhaImportada {
  const linha = normalizarChaves(linhaBruta)
  const avisos: string[] = []

  const endereco = textoOuNull(linha['ENDEREÇO']) ?? ''
  if (!endereco) avisos.push('Endereço vazio')

  const status = normalizarStatus(linha['STATUS'])
  const tipo = normalizarTipo(linha['TIPO'])

  const estado = textoOuNull(linha['ESTADO'])
  // Aceita tanto "CIDADE" quanto "MUNICÍPIO" como nome da coluna.
  let municipio = textoOuNull(linha['CIDADE']) ?? textoOuNull(linha['MUNICÍPIO'])
  let bairro = textoOuNull(linha['BAIRRO'])
  let enderecoRevisado = true

  if (!municipio && endereco) {
    const extraido = extrairLocalizacaoDoEndereco(endereco)
    municipio = extraido.municipio
    bairro = bairro ?? extraido.bairro
    if (extraido.confiavel) {
      avisos.push(`Município "${extraido.municipio}" inferido automaticamente do endereço — revisar`)
      enderecoRevisado = false
    } else {
      avisos.push('Não foi possível inferir município/bairro do endereço — preencher manualmente')
      enderecoRevisado = false
    }
  }

  const areaConstruida = numeroOuNull(linha['ÁREA CONSTRUÍDA'])
  const valorAluguel = numeroOuNull(linha['VALOR'])
  const valorM2Planilha = numeroOuNull(linha['R$ M² LOC'])
  const valorM2 = valorM2Planilha ?? (valorAluguel && areaConstruida ? Number((valorAluguel / areaConstruida).toFixed(2)) : null)

  const imovel: ImovelInput = {
    endereco,
    pastaFisica: textoOuNull(linha['PASTA'])?.toUpperCase() === 'S',
    kmzUrl: textoOuNull(linha['KMZ']),
    coordenadas: null,

    estado,
    municipio,
    bairro,
    enderecoRevisado,

    operacao: normalizarOperacao(linha['OPERAÇÃO']),
    segmento: textoOuNull(linha['SEGMENTO']),
    proprietario: textoOuNull(linha['PROPRIETÁRIOS']),
    tipo,

    valorContabil: numeroOuNull(linha['VALOR CONTÁBIL']),
    valorMercadoImovel: numeroOuNull(linha['VALOR DE MERCADO']),

    status,

    matriculaZona: textoOuNull(linha['MATRÍCULA / ZONA']),
    inscricaoIptu: textoOuNull(linha['INSC. IPTU']),
    areaTerreno: numeroOuNull(linha['ÁREA TERRENO']),
    areaConstruida,
    nomeFantasia: textoOuNull(linha['NOME DE FANTASIA']),

    fotos: [],
    anexos: [],

    locacao: {
      locatario: textoOuNull(linha['LOCATÁRIO']),
      valorAluguel,
      dataInicio: dataOuNull(linha['INÍCIO']),
      dataFim: dataOuNull(linha['FIM']),
      reajuste: textoOuNull(linha['REAJUSTE']),
      valorM2,
    },

    comparativoMercado: {
      valorM2Regiao: null,
      fonte: null,
      atualizadoEm: null,
      atualizadoPor: null,
    },

    importadoDe: null,
  }

  return { imovel, avisos }
}

/** Chave de casamento entre uma linha importada e um imóvel já cadastrado. */
export function normalizarEndereco(endereco: string): string {
  return endereco.trim().toUpperCase().replace(/\s+/g, ' ')
}

function preferirNaoNulo<T>(importado: T | null, existente: T | null): T | null {
  return importado ?? existente
}

/**
 * Reimportar a planilha deve atualizar o cadastro existente, não duplicar.
 * Casamos pelo endereço e mesclamos: os campos que vêm da planilha (status,
 * locação, valores etc.) são atualizados quando presentes na linha nova;
 * o que só existe no app (KMZ, fotos, anexos, comparativo de mercado,
 * coordenadas) é sempre preservado, já que a planilha nunca traz isso.
 */
export function mesclarComExistente(existente: Imovel, importado: ImovelInput): ImovelInput {
  const locacaoMesclada: DadosLocacao = {
    locatario: preferirNaoNulo(importado.locacao.locatario, existente.locacao.locatario),
    valorAluguel: preferirNaoNulo(importado.locacao.valorAluguel, existente.locacao.valorAluguel),
    dataInicio: preferirNaoNulo(importado.locacao.dataInicio, existente.locacao.dataInicio),
    dataFim: preferirNaoNulo(importado.locacao.dataFim, existente.locacao.dataFim),
    reajuste: preferirNaoNulo(importado.locacao.reajuste, existente.locacao.reajuste),
    valorM2: preferirNaoNulo(importado.locacao.valorM2, existente.locacao.valorM2),
  }

  // Se o endereço já foi revisado manualmente, não deixa a nova inferência automática sobrescrever.
  const manterLocalizacaoAtual = existente.enderecoRevisado
  const estado = manterLocalizacaoAtual ? existente.estado : preferirNaoNulo(importado.estado, existente.estado)
  const municipio = manterLocalizacaoAtual ? existente.municipio : preferirNaoNulo(importado.municipio, existente.municipio)
  const bairro = manterLocalizacaoAtual ? existente.bairro : preferirNaoNulo(importado.bairro, existente.bairro)

  return {
    ...importado,
    estado,
    municipio,
    bairro,
    enderecoRevisado: manterLocalizacaoAtual || importado.enderecoRevisado,
    pastaFisica: existente.pastaFisica || importado.pastaFisica,
    kmzUrl: existente.kmzUrl,
    coordenadas: existente.coordenadas,
    fotos: existente.fotos,
    anexos: existente.anexos,
    nomeFantasia: preferirNaoNulo(importado.nomeFantasia, existente.nomeFantasia),
    valorContabil: preferirNaoNulo(importado.valorContabil, existente.valorContabil),
    valorMercadoImovel: preferirNaoNulo(importado.valorMercadoImovel, existente.valorMercadoImovel),
    matriculaZona: preferirNaoNulo(importado.matriculaZona, existente.matriculaZona),
    inscricaoIptu: preferirNaoNulo(importado.inscricaoIptu, existente.inscricaoIptu),
    areaTerreno: preferirNaoNulo(importado.areaTerreno, existente.areaTerreno),
    areaConstruida: preferirNaoNulo(importado.areaConstruida, existente.areaConstruida),
    segmento: preferirNaoNulo(importado.segmento, existente.segmento),
    proprietario: preferirNaoNulo(importado.proprietario, existente.proprietario),
    locacao: locacaoMesclada,
    comparativoMercado: existente.comparativoMercado,
    importadoDe: existente.importadoDe,
  }
}
