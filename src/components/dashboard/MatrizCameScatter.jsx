import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  Cell,
  LabelList,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardTitle } from '../ui/Card.jsx'

const UMBRAL = 5 // punto medio de la escala 0-10 (Impacto y Esfuerzo)

// Cuadrantes (design.md: 4 cuadrantes pastel suave — verde, azul, amarillo, rojo).
// La clave interna se usa para clasificar/colorear; `nombreEs` es la
// traducción al español mostrada en la leyenda y el tooltip.
const CUADRANTES = {
  'Quick Win': { fill: '#38A169', pastel: '#38A169', nombreEs: 'Victoria Rápida' }, // impacto alto, esfuerzo bajo
  'Key Project': { fill: '#2563EB', pastel: '#2563EB', nombreEs: 'Proyecto Clave' }, // impacto alto, esfuerzo alto
  'Low Priority': { fill: '#D69E2E', pastel: '#D69E2E', nombreEs: 'Baja Prioridad' }, // impacto bajo, esfuerzo bajo
  Discard: { fill: '#E53E3E', pastel: '#E53E3E', nombreEs: 'Descartar' }, // impacto bajo, esfuerzo alto
}

// Rango [x1, x2, y1, y2] de cada cuadrante, sobre la escala 0-10.
const RANGOS_CUADRANTE = {
  'Quick Win': [0, UMBRAL, UMBRAL, 10],
  'Key Project': [UMBRAL, 10, UMBRAL, 10],
  'Low Priority': [0, UMBRAL, 0, UMBRAL],
  Discard: [UMBRAL, 10, 0, UMBRAL],
}

/** Clasifica una iniciativa según su Impacto y Esfuerzo (escala 0-10). */
function clasificar({ impacto, esfuerzo }) {
  if (impacto >= UMBRAL && esfuerzo < UMBRAL) return 'Quick Win'
  if (impacto >= UMBRAL && esfuerzo >= UMBRAL) return 'Key Project'
  if (impacto < UMBRAL && esfuerzo < UMBRAL) return 'Low Priority'
  return 'Discard'
}

/**
 * Cuadrante "Matriz de Priorización CAME": scatter plot (Impacto vs
 * Esfuerzo) que clasifica las iniciativas en Victoria Rápida, Proyecto
 * Clave, Baja Prioridad y Descartar. El fondo del gráfico se mantiene
 * limpio (sin títulos flotantes en los cuadrantes); cada punto muestra el
 * nombre corto de su iniciativa y el tooltip amplía el detalle.
 *
 * @param {{ iniciativasCame: import('../../types/estrategia.js').IniciativaCame[] }} props
 */
export default function MatrizCameScatter({ iniciativasCame }) {
  const data = iniciativasCame.map((i) => ({ ...i, cuadrante: clasificar(i) }))

  return (
    <Card>
      <CardTitle>Matriz de Priorización CAME</CardTitle>
      <p className="mt-1 text-xs text-muted">Impacto vs Esfuerzo</p>

      <div className="mt-4 h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 10, left: 0 }}>
            <CartesianGrid stroke="#E5E7EB" />

            {/* Fondos pastel de los 4 cuadrantes, sin texto/título dentro del área de trazado */}
            {Object.entries(RANGOS_CUADRANTE).map(([nombre, [x1, x2, y1, y2]]) => (
              <ReferenceArea
                key={nombre}
                x1={x1}
                x2={x2}
                y1={y1}
                y2={y2}
                fill={CUADRANTES[nombre].pastel}
                fillOpacity={0.1}
                stroke="none"
              />
            ))}

            <ReferenceLine x={UMBRAL} stroke="#9CA3AF" strokeDasharray="3 3" />
            <ReferenceLine y={UMBRAL} stroke="#9CA3AF" strokeDasharray="3 3" />

            <XAxis
              type="number"
              dataKey="esfuerzo"
              name="Esfuerzo"
              domain={[0, 10]}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              label={{ value: 'Esfuerzo', position: 'insideBottom', offset: -5, fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="impacto"
              name="Impacto"
              domain={[0, 10]}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              label={{ value: 'Impacto', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 12 }}
            />
            <ZAxis range={[120, 120]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value, name) => [value, name]}
              labelFormatter={() => ''}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0].payload
                return (
                  <div className="rounded-lg border border-card-border bg-surface p-2 text-xs shadow-sm">
                    <p className="font-semibold text-main">{p.nombre}</p>
                    <p className="text-muted">Impacto {p.impacto} · Esfuerzo {p.esfuerzo}</p>
                    <p className="font-semibold" style={{ color: CUADRANTES[p.cuadrante].fill }}>
                      {CUADRANTES[p.cuadrante].nombreEs}
                    </p>
                  </div>
                )
              }}
            />
            <Scatter data={data} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.id} fill={CUADRANTES[d.cuadrante].fill} />
              ))}
              <LabelList
                dataKey="nombreCorto"
                position="right"
                offset={8}
                fontSize={10}
                fill="#1F2937"
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda (español de España) */}
      <div className="mt-3 flex flex-wrap gap-4 border-t border-card-border pt-3 text-xs text-muted">
        {Object.values(CUADRANTES).map(({ nombreEs, fill }) => (
          <span key={nombreEs} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: fill }} />
            {nombreEs}
          </span>
        ))}
      </div>
    </Card>
  )
}
