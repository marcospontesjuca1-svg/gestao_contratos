import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { CAMPOS_RELATORIO } from '../lib/relatorio'
import type { FiltrosImoveis, Imovel, ImovelInput } from '../types/imovel'

const COLECAO = 'imoveis'

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Escuta a coleção inteira em tempo real e aplica os filtros no cliente.
 * Volume atual (~300 imóveis) não justifica queries compostas para todos os
 * filtros combinados — ver docs/MODELO_DE_DADOS.md, seção de índices.
 */
export function escutarImoveis(filtros: FiltrosImoveis, callback: (imoveis: Imovel[]) => void): Unsubscribe {
  const q = query(collection(db, COLECAO), orderBy('endereco'))
  return onSnapshot(q, (snap) => {
    const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Imovel)
    callback(aplicarFiltros(todos, filtros))
  })
}

export function aplicarFiltros(imoveis: Imovel[], filtros: FiltrosImoveis): Imovel[] {
  const camposAtivos = Object.entries(filtros.campos ?? {}).filter(([, valor]) => valor)

  return imoveis.filter((imovel) => {
    for (const [chave, valor] of camposAtivos) {
      const campo = CAMPOS_RELATORIO.find((c) => c.chave === chave)
      if (campo && String(campo.obter(imovel)) !== valor) return false
    }

    const valorReferencia = imovel.locacao.valorAluguel ?? imovel.valorMercadoImovel ?? null
    if (filtros.valorMin != null && (valorReferencia == null || valorReferencia < filtros.valorMin)) return false
    if (filtros.valorMax != null && (valorReferencia == null || valorReferencia > filtros.valorMax)) return false

    if (filtros.texto) {
      const alvo = normalizar(`${imovel.endereco} ${imovel.municipio ?? ''} ${imovel.bairro ?? ''} ${imovel.proprietario ?? ''}`)
      if (!alvo.includes(normalizar(filtros.texto))) return false
    }

    return true
  })
}

export async function buscarImovel(id: string): Promise<Imovel | null> {
  const snap = await getDoc(doc(db, COLECAO, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Imovel) : null
}

export async function listarImoveis(): Promise<Imovel[]> {
  const snap = await getDocs(collection(db, COLECAO))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Imovel)
}

export async function criarImovel(input: ImovelInput, uid: string): Promise<string> {
  const ref = await addDoc(collection(db, COLECAO), {
    ...input,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
    criadoPor: uid,
    atualizadoPor: uid,
  })
  return ref.id
}

export async function atualizarImovel(id: string, input: Partial<ImovelInput>, uid: string): Promise<void> {
  await updateDoc(doc(db, COLECAO, id), {
    ...input,
    atualizadoEm: serverTimestamp(),
    atualizadoPor: uid,
  })
}

export async function removerImovel(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECAO, id))
}

/**
 * Extrai valores distintos já cadastrados para popular os selects de filtro, um
 * conjunto de opções por chave de CampoRelatorio marcado como filtravel.
 */
export function opcoesDeFiltro(imoveis: Imovel[]): Record<string, string[]> {
  const opcoes: Record<string, string[]> = {}
  for (const campo of CAMPOS_RELATORIO) {
    if (!campo.filtravel) continue
    opcoes[campo.chave] = Array.from(new Set(imoveis.map((i) => String(campo.obter(i))).filter((v) => v))).sort()
  }
  return opcoes
}
