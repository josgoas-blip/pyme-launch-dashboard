import { Eye } from 'lucide-react'
import { useModoLectura } from '../../context/ModoLecturaContext.jsx'

/**
 * Banda superior del Modo Consultor.
 *
 * Va fija arriba y en un tono distinto del resto del panel: el mentor debe
 * saber en todo momento que está mirando el expediente de otra persona, no
 * el suyo. Se marca `no-imprimir` para que no aparezca en el PDF del
 * Informe Ejecutivo.
 *
 * Muestra el identificador completo, no abreviado: es lo que el mentor
 * necesita copiar para referirse al expediente en una incidencia.
 */
export default function BannerConsultor() {
  const { soloLectura, expedienteId, nombreCliente } = useModoLectura()
  if (!soloLectura) return null

  return (
    <div
      className="no-imprimir sticky top-0 z-40 border-b"
      style={{ backgroundColor: '#1B4D3E', borderColor: '#14392E' }}
      role="status"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 sm:px-6">
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          <Eye className="h-3 w-3 shrink-0" aria-hidden="true" />
          Modo Mentoría
        </span>

        <p className="min-w-0 text-xs text-white/90">
          Visualizando expediente{' '}
          <span className="font-mono font-semibold text-white">{expedienteId}</span> de{' '}
          <span className="font-semibold text-white">{nombreCliente}</span>
        </p>

        <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wider text-white/70">
          Solo lectura
        </span>
      </div>
    </div>
  )
}
