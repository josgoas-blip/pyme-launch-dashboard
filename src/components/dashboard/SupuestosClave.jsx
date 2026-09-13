import { CardTitle, Badge } from '../ui/Card.jsx'
import { colorEvidencia } from '../../utils/evidencia.js'

/**
 * Columna derecha del bloque principal de Viabilidad: panel "Supuestos
 * Clave" con fondo cálido tenue. Lista las variables financieras que el
 * usuario ha declarado en el diagnóstico (o su derivación aritmética
 * directa), cada una con el badge de su procedencia (Taxonomía de Evidencia
 * — src/utils/evidencia.js) alineado a la derecha.
 *
 * Debajo, las alertas que el modelo del TFM aplica sobre la dimensión de
 * solvencia: son las mismas penalizaciones que recortan el score, para que
 * la pestaña no contradiga al diagnóstico.
 *
 * @param {{
 *   supuestosClave: import('../../types/viabilidad.js').SupuestoClave[],
 *   alertas?: string[],
 * }} props
 */
export default function SupuestosClave({ supuestosClave, alertas = [] }) {
  const supuestos = supuestosClave ?? []

  return (
    <div className="rounded-xl border border-accent-amber/20 bg-accent-amber/5 p-6 shadow-sm">
      <CardTitle>Supuestos Clave</CardTitle>
      <p className="mt-1 text-xs text-[#4B5563]">Variables que has declarado en el diagnóstico</p>

      {supuestos.length === 0 ? (
        <p className="mt-4 text-sm text-[#4B5563]">
          Completa el bloque financiero del diagnóstico para ver aquí tus cifras declaradas y la
          procedencia de cada una.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {supuestos.map((s) => {
            const { badge } = colorEvidencia(s.valor.tipo_evidencia)
            return (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 border-b border-accent-amber/15 pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-[#4B5563]">{s.etiqueta}</p>
                  <p className="text-lg font-bold text-[#1F2937]">{s.valor.valor}</p>
                </div>
                <Badge className={`shrink-0 ${badge}`}>{s.valor.tipo_evidencia}</Badge>
              </li>
            )
          })}
        </ul>
      )}

      {/* Penalizaciones del modelo sobre la dimensión de solvencia. */}
      {alertas.length > 0 && (
        <div className="mt-4 border-t border-accent-amber/20 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-red">
            Alertas que penalizan tu score
          </p>
          <ul className="mt-2 space-y-1.5">
            {alertas.map((alerta) => (
              <li key={alerta} className="flex gap-2 text-xs leading-snug text-[#1F2937]">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-red" />
                {alerta}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 border-t border-accent-amber/20 pt-3 text-xs font-semibold text-accent-amber">
        Lectura correcta: &quot;bajo estos supuestos...&quot;
      </p>
    </div>
  )
}
