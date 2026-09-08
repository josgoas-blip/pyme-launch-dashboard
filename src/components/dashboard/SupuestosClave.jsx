import { CardTitle, Badge } from '../ui/Card.jsx'
import { colorEvidencia } from '../../utils/evidencia.js'

/**
 * Columna derecha del bloque principal de Viabilidad: panel "Supuestos
 * Clave" con fondo cálido tenue. Lista las variables base usadas en los
 * cálculos de esta pestaña, cada una con el badge de su procedencia
 * (Taxonomía de Evidencia — src/utils/evidencia.js) alineado a la derecha.
 *
 * @param {{ supuestosClave: import('../../types/viabilidad.js').SupuestoClave[] }} props
 */
export default function SupuestosClave({ supuestosClave }) {
  return (
    <div className="rounded-xl border border-accent-amber/20 bg-accent-amber/5 p-6 shadow-sm">
      <CardTitle>Supuestos Clave</CardTitle>
      <p className="mt-1 text-xs text-muted">Variables base de los cálculos de esta pestaña</p>

      <ul className="mt-4 space-y-3">
        {supuestosClave.map((s) => {
          const { badge } = colorEvidencia(s.valor.tipo_evidencia)
          return (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 border-b border-accent-amber/15 pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-main">{s.etiqueta}</p>
                <p className="text-lg font-bold text-main">{s.valor.valor}</p>
              </div>
              <Badge className={`shrink-0 ${badge}`}>{s.valor.tipo_evidencia}</Badge>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 border-t border-accent-amber/20 pt-3 text-xs font-semibold text-accent-amber">
        Lectura correcta: &quot;bajo estos supuestos...&quot;
      </p>
    </div>
  )
}
