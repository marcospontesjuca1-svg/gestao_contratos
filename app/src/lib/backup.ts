import * as XLSX from 'xlsx'
import type { Imovel } from '../types/imovel'

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
