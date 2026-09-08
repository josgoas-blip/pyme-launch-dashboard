import { FunnelChart, Funnel, LabelList, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { Card, CardTitle } from '../ui/Card.jsx'

// Color por etapa del funnel (design.md): Atracción (verde corporativo),
// Nutrición (ámbar), Conversión (verde esmeralda de conversión lograda).
const COLOR_POR_FASE = {
  Atracción: '#1B4D3E',
  Nutrición: '#DD6B20',
  Conversión: '#10B981',
}

const formatNumero = (n) => new Intl.NumberFormat('es-ES').format(n)

/**
 * Cuadrante "Funnel de Conversión Digital": embudo de 3 fases (Atracción,
 * Nutrición, Conversión) con el volumen de prospectos y el % de conversión
 * entre etapas consecutivas.
 *
 * @param {{ funnelConversion: import('../../types/estrategia.js').EtapaFunnel[] }} props
 */
export default function FunnelConversionDigital({ funnelConversion }) {
  const data = funnelConversion.map((e) => ({ ...e, name: e.etiqueta, value: e.volumen }))

  return (
    <Card>
      <CardTitle>Funnel de Conversión Digital</CardTitle>

      <div className="mt-2 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip
              formatter={(value, _name, item) => [`${formatNumero(value)} prospectos`, item.payload.fase]}
            />
            <Funnel dataKey="value" data={data} isAnimationActive={false}>
              <LabelList
                position="right"
                dataKey="etiqueta"
                fill="#1F2937"
                stroke="none"
                fontSize={12}
                offset={12}
              />
              {data.map((d) => (
                <Cell key={d.id} fill={COLOR_POR_FASE[d.fase]} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>

      {/* % de conversión entre etapas consecutivas (calculado dinámicamente) */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 border-t border-card-border pt-4 text-sm">
        {funnelConversion.slice(1).map((etapa, i) => {
          const anterior = funnelConversion[i]
          const pct = (etapa.volumen / anterior.volumen) * 100
          return (
            <span key={etapa.id} className="text-muted">
              <span className="font-semibold text-main">{anterior.fase} → {etapa.fase}:</span>{' '}
              <span className="font-bold" style={{ color: COLOR_POR_FASE[etapa.fase] }}>
                {pct.toFixed(1)}%
              </span>
            </span>
          )
        })}
      </div>
    </Card>
  )
}
