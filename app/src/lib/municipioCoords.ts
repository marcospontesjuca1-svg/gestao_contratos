/**
 * Coordenadas aproximadas de municípios, para plotar no mapa do Painel
 * Gerencial. Cobre o Ceará (onde está a maior parte da carteira) e as
 * capitais dos demais estados. Chave em maiúsculas sem acento, para casar
 * com o texto salvo em `imovel.municipio` (vindo da planilha/importação).
 *
 * Sem geocodificação automática no MVP — se um município não estiver aqui,
 * ele simplesmente não aparece no mapa (fica só nas listas/contagens).
 */
export const COORDENADAS_MUNICIPIOS: Record<string, [number, number]> = {
  // Região Metropolitana de Fortaleza / Ceará
  FORTALEZA: [-3.7327, -38.527],
  MARACANAU: [-3.8767, -38.6256],
  CAUCAIA: [-3.7361, -38.6531],
  EUSEBIO: [-3.8908, -38.4506],
  AQUIRAZ: [-3.9014, -38.3911],
  PACATUBA: [-3.9836, -38.6206],
  ITAITINGA: [-3.9711, -38.5386],
  HORIZONTE: [-4.0964, -38.4956],
  CASCAVEL: [-4.1319, -38.2381],
  PACAJUS: [-4.1728, -38.4606],
  CHOROZINHO: [-4.3208, -38.5133],
  'SAO GONCALO DO AMARANTE': [-3.6081, -38.9683],
  TRAIRI: [-3.2778, -39.2683],
  SOBRAL: [-3.6886, -40.3494],
  'JUAZEIRO DO NORTE': [-7.2131, -39.3153],
  CRATO: [-7.2342, -39.4097],
  IGUATU: [-6.3611, -39.2981],
  QUIXADA: [-4.9711, -39.0153],
  ITAPIPOCA: [-3.4939, -39.5786],
  CANINDE: [-4.3572, -39.3111],
  RUSSAS: [-4.9403, -37.9769],
  ARACATI: [-4.5619, -37.7697],
  VITORIA: [-20.3155, -40.3128], // capital do ES; observado na planilha original

  // Capitais dos demais estados (referência regional)
  'SAO PAULO': [-23.5505, -46.6333],
  'RIO DE JANEIRO': [-22.9068, -43.1729],
  'BELO HORIZONTE': [-19.9167, -43.9345],
  SALVADOR: [-12.9714, -38.5014],
  BRASILIA: [-15.7939, -47.8828],
  RECIFE: [-8.0476, -34.877],
  CURITIBA: [-25.4284, -49.2733],
  'PORTO ALEGRE': [-30.0346, -51.2177],
  MANAUS: [-3.119, -60.0217],
  BELEM: [-1.4558, -48.4902],
  GOIANIA: [-16.6869, -49.2648],
  'SAO LUIS': [-2.5307, -44.3068],
  MACEIO: [-9.6498, -35.7089],
  NATAL: [-5.7945, -35.211],
  'JOAO PESSOA': [-7.1195, -34.845],
  TERESINA: [-5.0892, -42.8019],
  ARACAJU: [-10.9472, -37.0731],
  CUIABA: [-15.601, -56.0974],
  'CAMPO GRANDE': [-20.4697, -54.6201],
  'PORTO VELHO': [-8.7619, -63.9039],
  'RIO BRANCO': [-9.9754, -67.8249],
  'BOA VISTA': [2.8235, -60.6758],
  MACAPA: [0.0389, -51.0664],
  PALMAS: [-10.1689, -48.3317],
  FLORIANOPOLIS: [-27.5954, -48.548],
}

/** Remove acentos e caixa para casar chaves da tabela com o texto salvo (ex.: "MARACANAÚ" -> "MARACANAU"). */
export function normalizarNomeMunicipio(nome: string): string {
  return nome
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function coordenadasDoMunicipio(nome: string | null): [number, number] | null {
  if (!nome) return null
  return COORDENADAS_MUNICIPIOS[normalizarNomeMunicipio(nome)] ?? null
}
