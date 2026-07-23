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
  return imoveis.filter((imovel) => {
    if (filtros.estado && imovel.estado !== filtros.estado) return false
    if (filtros.municipio && imovel.municipio !== filtros.municipio) return false
    if (filtros.bairro && imovel.bairro !== filtros.bairro) return false
    if (filtros.tipo && imovel.tipo !== filtros.tipo) return false
    if (filtros.status && imovel.status !== filtros.status) return false
    if (filtros.segmento && imovel.segmento !== filtros.segmento) return false

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

/** Extrai valores distintos já cadastrados para popular os selects de filtro. */
export function opcoesDeFiltro(imoveis: Imovel[]) {
  const coletar = (fn: (i: Imovel) => string | null) =>
    Array.from(new Set(imoveis.map(fn).filter((v): v is string => !!v))).sort()

  return {
    estados: coletar((i) => i.estado),
    municipios: coletar((i) => i.municipio),
    bairros: coletar((i) => i.bairro),
    tipos: coletar((i) => i.tipo),
  }
}
