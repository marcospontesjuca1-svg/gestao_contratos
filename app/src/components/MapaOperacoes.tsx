import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { coordenadasDoMunicipio } from '../lib/municipioCoords'

const CENTRO_BRASIL: [number, number] = [-10, -50]

interface PontoMapa {
  municipio: string
  quantidade: number
  posicao: [number, number]
}

export function MapaOperacoes({ contagemPorMunicipio }: { contagemPorMunicipio: Record<string, number> }) {
  const pontos: PontoMapa[] = Object.entries(contagemPorMunicipio)
    .map(([municipio, quantidade]) => {
      const posicao = coordenadasDoMunicipio(municipio)
      return posicao ? { municipio, quantidade, posicao } : null
    })
    .filter((p): p is PontoMapa => p !== null)

  const maxQuantidade = Math.max(1, ...pontos.map((p) => p.quantidade))

  return (
    <div className="h-72 overflow-hidden rounded-lg">
      <MapContainer center={CENTRO_BRASIL} zoom={4} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {pontos.map((ponto) => (
          <CircleMarker
            key={ponto.municipio}
            center={ponto.posicao}
            radius={6 + (ponto.quantidade / maxQuantidade) * 14}
            pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.6, weight: 1 }}
          >
            <Tooltip>
              {ponto.municipio}: {ponto.quantidade} imóve{ponto.quantidade === 1 ? 'l' : 'is'}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      {pontos.length === 0 && (
        <p className="relative -mt-72 flex h-72 items-center justify-center bg-white/70 px-6 text-center text-xs text-slate-500">
          Nenhum imóvel com município reconhecido ainda para plotar no mapa.
        </p>
      )}
    </div>
  )
}
