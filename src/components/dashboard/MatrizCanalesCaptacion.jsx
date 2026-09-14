import { Compass } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'
import PistaTermino from '../ui/PistaTermino.jsx'
import { explicar } from '../../utils/glosario.js'

/**
 * Cuadrante "Canales de Captación": refleja la estrategia de adquisición
 * declarada en el diagnóstico (`p12_primeros_clientes`) — el estadio actual
 * más canales y acciones tácticas acordes a ese nivel de madurez.
 *
 * No inventa métricas (CAC/LTV/ROAS): con un negocio en fase inicial esas
 * cifras serían ficticias, así que se ofrecen sugerencias tácticas honestas.
 *
 * @param {{ adquisicion: import('../../utils/estrategiaDiagnostico.js').Adquisicion | null }} props
 */
export default function MatrizCanalesCaptacion({ adquisicion }) {
  if (!adquisicion) {
    return (
      <Card>
        <CardTitle>Canales de Captación</CardTitle>
        <p className="mt-4 text-sm text-muted">
          Completa el diagnóstico para ver tu estrategia de captación de clientes.
          Aquí aparecerán los canales y acciones recomendados según cómo planeas
          conseguir tus primeros clientes.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <CardTitle>Canales de Captación</CardTitle>
        <Badge className="bg-primary/10 text-primary">Nivel {adquisicion.nivel}/5</Badge>
      </div>

      {/* Estadio declarado en p12 y su lectura */}
      <div className="mt-3 flex items-start gap-3 rounded-xl bg-canvas p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary">
          <Compass className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-main">{adquisicion.etiqueta}</p>
          <p className="mt-1 text-xs leading-snug text-muted">{adquisicion.diagnostico}</p>
        </div>
      </div>

      {/* Canales / acciones tácticas acordes al estadio */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {adquisicion.canales.map((canal) => {
          // Solo las acciones cuyo nombre contiene jerga llevan pista: el
          // resto ("Programa de referidos", "Prueba social") se lee solo.
          const ayuda = explicar(canal.id)
          return (
            <div key={canal.id} className="flex flex-col rounded-xl border border-card-border bg-canvas p-4">
              <Badge className="self-start bg-primary/10 text-primary">{canal.foco}</Badge>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-main">
                {canal.nombre}
                {ayuda && <PistaTermino texto={ayuda} etiqueta={canal.nombre} />}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted">{canal.descripcion}</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
