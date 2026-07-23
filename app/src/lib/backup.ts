import * as XLSX from 'xlsx'
import { Timestamp } from 'firebase/firestore'
import type { Imovel } from '../types/imovel'
import type { Usuario } from '../types/usuario'
import type { Configuracoes } from '../types/configuracoes'

function linhaDoImovel(imovel: Imovel) {
  return {
    ENDEREÇO: imovel.endereco,
    ESTADO: imovel.estado ?? '',
    MUNICÍPIO: imovel.municipio ?? '',
    BAIRRO: imovel.bairro ?? '',
    PROPRIETÁRIOS: imovel.proprietario ?? '',
    TIPO: imovel.tipo,
    SEGMENTO: imovel.segmento ?? '',
    STATUS: imovel.status,
    OPERAÇÃO: imovel.operacao,
    'MATRÍCULA / ZONA': imovel.matriculaZona ?? '',
    'INSC. IPTU': imovel.inscricaoIptu ?? '',
    'ÁREA TERRENO': imovel.areaTerreno ?? '',
    'ÁREA CONSTRUÍDA': imovel.areaConstruida ?? '',
    'Valor Contábil': imovel.valorContabil ?? '',
    'Valor de Mercado': imovel.valorMercadoImovel ?? '',
    LOCATÁRIO: imovel.locacao.locatario ?? '',
    VALOR: imovel.locacao.valorAluguel ?? '',
    INÍCIO: imovel.locacao.dataInicio ? imovel.locacao.dataInicio.toDate().toLocaleDateString('pt-BR') : '',
    FIM: imovel.locacao.dataFim ? imovel.locacao.dataFim.toDate().toLocaleDateString('pt-BR') : '',
    REAJUSTE: imovel.locacao.reajuste ?? '',
    'R$ M² LOC': imovel.locacao.valorM2 ?? '',
    'R$ M² REGIÃO (mercado)': imovel.comparativoMercado.valorM2Regiao ?? '',
    KMZ: imovel.kmzUrl ?? '',
  }
}

/** Gera um .xlsx com todos os imóveis e dispara o download no navegador (pasta padrão de Downloads). */
export function baixarBackupXlsx(imoveis: Imovel[]) {
  const planilha = XLSX.utils.json_to_sheet(imoveis.map(linhaDoImovel))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, planilha, 'Imóveis')

  const dataHoje = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `backup-gestao-contratos-${dataHoje}.xlsx`)
}

function serializarTimestamps(valor: unknown): unknown {
  if (valor instanceof Timestamp) return valor.toDate().toISOString()
  if (Array.isArray(valor)) return valor.map(serializarTimestamps)
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([chave, v]) => [chave, serializarTimestamps(v)]))
  }
  return valor
}

/** Gera um .json com o dump completo dos dados do sistema (imóveis, usuários e configurações) e dispara o download. */
export function baixarBackupJson(dados: { imoveis: Imovel[]; usuarios: Usuario[]; configuracoes: Configuracoes }) {
  const payload = {
    geradoEm: new Date().toISOString(),
    imoveis: serializarTimestamps(dados.imoveis),
    usuarios: serializarTimestamps(dados.usuarios),
    configuracoes: serializarTimestamps(dados.configuracoes),
  }

  const conteudo = JSON.stringify(payload, null, 2)
  const blob = new Blob([conteudo], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `backup-gestao-contratos-${new Date().toISOString().slice(0, 10)}.json`
  link.click()

  URL.revokeObjectURL(url)
}
