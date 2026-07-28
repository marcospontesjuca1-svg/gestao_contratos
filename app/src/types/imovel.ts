import type { Timestamp } from 'firebase/firestore'

export type Operacao = 'VENDA' | 'LOCACAO' | 'DESENVOLVIMENTO'

/** Natureza de uso do imóvel — texto livre (ex.: Varejo, Shopping, Galpão, Depósito, Construção civil). */
export type Segmento = string

export type StatusImovel = 'LOCADO' | 'VAGO' | 'ATIVO_INTERNO' | 'LOCADO_PARCIAL'

/** Tipos observados na planilha original. Mantido como union + string para aceitar novos tipos sem quebrar o form. */
export type TipoImovel = 'SALA' | 'LOJA' | 'TERRENO' | 'APTO' | 'PREDIO' | 'MALL' | 'CASA' | (string & {})

export interface Coordenadas {
  lat: number
  lng: number
}

export interface Anexo {
  nome: string
  url: string
  tipo: string
}

export interface DadosLocacao {
  locatario: string | null
  valorAluguel: number | null
  dataInicio: Timestamp | null
  dataFim: Timestamp | null
  reajuste: string | null
  /** R$/m² pago pelo locatário. Recalculado a partir de valorAluguel/areaConstruida quando possível. */
  valorM2: number | null
}

export interface ComparativoMercado {
  /** Valor médio de R$/m² de mercado na região, informado manualmente (MVP). */
  valorM2Regiao: number | null
  fonte: string | null
  atualizadoEm: Timestamp | null
  atualizadoPor: string | null
}

export interface Imovel {
  id: string
  endereco: string
  pastaFisica: boolean
  kmzUrl: string | null
  coordenadas: Coordenadas | null

  estado: string | null
  municipio: string | null
  bairro: string | null
  /** false quando estado/municipio/bairro vieram de um parser automático na importação e ainda não foram revisados. */
  enderecoRevisado: boolean

  operacao: Operacao
  segmento: Segmento | null
  proprietario: string | null
  tipo: TipoImovel

  valorContabil: number | null
  valorMercadoImovel: number | null

  status: StatusImovel

  matriculaZona: string | null
  inscricaoIptu: string | null
  areaTerreno: number | null
  areaConstruida: number | null
  nomeFantasia: string | null

  fotos: string[]
  anexos: Anexo[]

  locacao: DadosLocacao
  comparativoMercado: ComparativoMercado

  criadoEm: Timestamp | null
  atualizadoEm: Timestamp | null
  criadoPor: string | null
  atualizadoPor: string | null
  importadoDe: string | null
}

/** Payload usado pelos formulários/serviços antes de virar um Imovel persistido. */
export type ImovelInput = Omit<Imovel, 'id' | 'criadoEm' | 'atualizadoEm' | 'criadoPor' | 'atualizadoPor'>

export interface FiltrosImoveis {
  texto?: string
  valorMin?: number
  valorMax?: number
  /** Filtros dinâmicos por coluna do relatório (chave = CampoRelatorio.chave, valor = texto exato exibido na coluna). */
  campos: Record<string, string>
}
