import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { coordenadasDoMunicipio } from '../lib/municipioCoords'
import type { Imovel } from '../types/imovel'

const CENTRO_BRASIL: [number, number] = [-10, -50]

interface GrupoMunicipio {
  municipio: string
  posicao: [number, number]
  imoveis: Imovel[]
}

export function MapaOperacoes({ imoveis }: { imoveis: Imovel[] }) {
  const grupos = new Map<string, GrupoMunicipio>()

  for (const imovel of imoveis) {
    const posicao = coordenadasDoMunicipio(imovel.municipio)
    if (!posicao) continue
    const chave = imovel.municipio as string
    const existente = grupos.get(chave)
    if (existente) {
      existente.imoveis.push(imovel)
    } else {
      grupos.set(chave, { municipio: chave, posicao, imoveis: [imovel] })
    }
  }

  const pontos = Array.from(grupos.values())
  const maxQuantidade = Math.max(1, ...pontos.map((p) => p.imoveis.length))

  return (
    <div className="relative h-full min-h-96 overflow-hidden rounded-lg">
      <MapContainer center={CENTRO_BRASIL} zoom={4} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {pontos.map((ponto) => (
          <CircleMarker
            key={ponto.municipio}
            center={ponto.posicao}
            radius={6 + (ponto.imoveis.length / maxQuantidade) * 14}
            pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.6, weight: 1 }}
          >
            <Popup maxHeight={220} minWidth={240}>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-slate-900">
                  {ponto.municipio} — {ponto.imoveis.length} imóve{ponto.imoveis.length === 1 ? 'l' : 'is'}
                </p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
                  {ponto.imoveis.map((imovel) => (
                    <li key={imovel.id} className="flex items-center justify-between gap-2 border-t border-slate-100 pt-1 first:border-0 first:pt-0">
                      <Link to={`/imoveis/${imovel.id}`} className="truncate text-blue-600 hover:underline" title={imovel.endereco}>
                        {imovel.endereco}
                      </Link>
                      {imovel.kmzUrl ? (
                        <a href={imovel.kmzUrl} target="_blank" rel="noreferrer" className="shrink-0 whitespace-nowrap text-red-600 hover:underline">
                          Google Earth
                        </a>
                      ) : (
                        <span className="shrink-0 whitespace-nowrap text-slate-300">sem KMZ</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      {pontos.length === 0 && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 px-6 text-center text-xs text-slate-500">
          Nenhum imóvel com município reconhecido ainda para plotar no mapa.
        </p>
      )}
    </div>
  )
}
