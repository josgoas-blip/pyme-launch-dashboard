import { Lock } from 'lucide-react'
import { Card, CardTitle, KpiNumber, Badge } from '../ui/Card.jsx'
import { INDICADORES_PENDIENTES } from '../../utils/viabilidadDiagnostico.js'

/**
 * Color del margen de seguridad según su estado. Mismos códigos que el
 * Semáforo de supervivencia, para que ambos cuadrantes no se contradigan.
 */
const COLOR_MARGEN = {
  holgado: 'text-accent-green',
  ajustado: 'text-accent-amber',
  critico: 'text-accent-red',
}

const TEXTO_MARGEN = {
  holgado: 'Tu colchón cubre el plazo hasta el equilibrio.',
  ajustado: 'El colchón se agota antes del equilibrio: la brecha aún es corregible.',
  critico: 'El colchón se agota muy por delante del equilibrio.',
}

/** Cifra pendiente de dato: no se rellena con una estimación inventada. */
function TarjetaPendiente({ etiqueta, requiere }) {
  return (
    <div className="flex flex-col rounded-xl border border-dashed border-card-border bg-canvas p-4">
      <div className="flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 shrink-0 text-[#4B5563]" />
        <p className="text-sm font-bold text-[#1F2937]">{etiqueta}</p>
      </div>
      <p className="mt-1.5 text-xs leading-snug text-[#4B5563]">{requiere}</p>
    </div>
  )
}

/**
 * Fila superior de la pestaña "Viabilidad": las 4 métricas que el
 * diagnóstico sí sostiene — Autonomía financiera, Margen de seguridad,
 * Solvencia financiera y Nivel de previsiones — más el bloque de
 * indicadores clásicos (Punto Muerto, VAN, TIR) que el cuestionario de 20
 * preguntas no permite calcular y que, por honestidad, se muestran
 * pendientes con el dato que les falta en lugar de con una cifra simulada.
 *
 * @param {{ metricas: ReturnType<typeof import('../../utils/viabilidadDiagnostico.js').derivarMetricasViabilidad> }} props
 */
export default function IndicadoresViabilidad({ metricas }) {
  if (!metricas) {
    return (
      <Card>
        <CardTitle>Indicadores de viabilidad</CardTitle>
        <p className="mt-3 text-sm text-[#4B5563]">
          Completa el bloque financiero del diagnóstico para ver tu autonomía de caja, tu margen de
          seguridad y tu nivel de solvencia.
        </p>
      </Card>
    )
  }

  const {
    autonomiaMeses,
    autonomiaDias,
    breakevenMeses,
    margenMeses,
    estadoMargen,
    scoreSolvencia,
    nivelPrevisiones,
    etiquetaPrevisiones,
  } = metricas

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Autonomía: meses de colchón declarados (p19). */}
        <Card>
          <CardTitle>Autonomía financiera</CardTitle>
          {autonomiaMeses !== undefined ? (
            <>
              <KpiNumber className="mt-2">{autonomiaMeses} meses</KpiNumber>
              <p className="mt-1 text-xs text-[#4B5563]">
                Unos {autonomiaDias} días de reserva sin ingresos suficientes
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#4B5563]">Colchón de liquidez no declarado.</p>
          )}
        </Card>

        {/* 2. Margen de seguridad: la brecha colchón vs equilibrio (p19). */}
        <Card>
          <CardTitle>Margen de seguridad</CardTitle>
          {margenMeses !== undefined ? (
            <>
              <KpiNumber className={`mt-2 ${COLOR_MARGEN[estadoMargen] ?? 'text-[#1F2937]'}`}>
                {margenMeses > 0 ? '+' : ''}
                {margenMeses} meses
              </KpiNumber>
              <p className="mt-1 text-xs text-[#4B5563]">{TEXTO_MARGEN[estadoMargen]}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#4B5563]">
              Declara tu colchón y tu plazo hasta el equilibrio para calcularlo.
            </p>
          )}
        </Card>

        {/* 3. Score de la dimensión de solvencia del modelo del TFM. */}
        <Card>
          <CardTitle>Solvencia financiera</CardTitle>
          {scoreSolvencia !== undefined ? (
            <>
              <KpiNumber className="mt-2">{scoreSolvencia}/100</KpiNumber>
              <p className="mt-1 text-xs text-[#4B5563]">
                Dimensión financiera y legal del diagnóstico (25 % del score)
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#4B5563]">Completa el diagnóstico para obtener tu score.</p>
          )}
        </Card>

        {/* 4. Nivel de elaboración del plan financiero declarado (p16). */}
        <Card>
          <CardTitle>Previsiones financieras</CardTitle>
          {nivelPrevisiones !== undefined ? (
            <>
              <div className="mt-2 flex items-baseline gap-2">
                <KpiNumber>{nivelPrevisiones}/5</KpiNumber>
                <Badge className="bg-primary/10 text-primary">Nivel declarado</Badge>
              </div>
              <p className="mt-1 text-xs text-[#4B5563]">{etiquetaPrevisiones}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#4B5563]">Sin respuesta sobre tus previsiones.</p>
          )}
        </Card>
      </div>

      {/* Indicadores clásicos que el diagnóstico no permite calcular. */}
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle>Indicadores pendientes de datos</CardTitle>
          {breakevenMeses !== undefined && (
            <p className="text-xs text-[#4B5563]">
              Equilibrio estimado por ti: {breakevenMeses} meses
            </p>
          )}
        </div>
        <p className="mt-2 text-sm text-[#4B5563]">
          El diagnóstico de 20 preguntas no recoge las variables necesarias para calcular estas
          cifras. No se muestran estimaciones porque cualquier número sería arbitrario.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {INDICADORES_PENDIENTES.map((indicador) => (
            <TarjetaPendiente
              key={indicador.id}
              etiqueta={indicador.etiqueta}
              requiere={indicador.requiere}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}
