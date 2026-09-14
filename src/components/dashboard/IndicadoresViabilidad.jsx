import { Wind, Flag, Flame, ShieldCheck, ClipboardList, TrendingDown, TrendingUp, ChevronDown } from 'lucide-react'
import { Card, CardTitle, KpiNumber, Badge } from '../ui/Card.jsx'
import PistaTermino from '../ui/PistaTermino.jsx'
import Delta from '../ui/Delta.jsx'
import { INDICADORES_PENDIENTES } from '../../utils/viabilidadDiagnostico.js'

const formatEUR = (n) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

/**
 * Textos de los indicadores: titular en lenguaje de emprendedor, término
 * técnico como subtítulo y una explicación breve en la pista de ayuda.
 *
 * El titular es lo que se lee de un vistazo; el rigor no se pierde, pasa a
 * segundo plano visual. Se agrupan aquí para poder revisar la redacción de
 * todos los indicadores de una sola lectura.
 */
const TEXTOS = {
  oxigeno: {
    titular: 'Meses de oxígeno',
    tecnico: 'Runway / Autonomía financiera',
    ayuda: 'Tiempo que tu negocio puede sobrevivir sin ventas suficientes usando la inversión inicial que declaraste.',
  },
  equilibrio: {
    titular: 'Mes de equilibrio',
    tecnico: 'Break-even / Punto muerto',
    ayuda: 'El mes en el que estimas que tus ingresos cubrirán tus costes y dejarás de perder dinero.',
  },
  margen: {
    titular: 'Margen de maniobra',
    tecnico: 'Meses de oxígeno sobrantes tras alcanzar el equilibrio',
    ayuda: 'La diferencia entre tus meses de oxígeno y el mes de equilibrio. En negativo, te quedas sin caja antes de que el negocio se sostenga solo.',
  },
  gasto: {
    titular: 'Gasto fijo mensual',
    tecnico: 'Burn rate / Consumo de caja implícito',
    ayuda: 'Media de lo que consume el negocio cada mes. No lo has declarado directamente: se deduce repartiendo tu inversión entre tus meses de oxígeno.',
  },
  solvencia: {
    titular: 'Solvencia financiera',
    tecnico: 'Dimensión financiera y legal del diagnóstico',
    ayuda: 'Una de las cuatro áreas que ponderan tu score global. Pesa un 25 % y combina tus previsiones, tu situación legal, la cobertura de la inversión y tu autonomía.',
  },
  previsiones: {
    titular: 'Tus números sobre papel',
    tecnico: 'Nivel de elaboración del plan financiero',
    ayuda: 'Cómo de trabajadas están tus previsiones de ventas, costes y punto muerto, según lo que respondiste en el diagnóstico.',
  },
}

/**
 * Cabecera de una tarjeta de KPI: titular grande y legible, pista de ayuda
 * al lado y término técnico debajo, en gris pequeño.
 */
function CabeceraKpi({ icono: Icono, textos, tono = 'neutro' }) {
  const colorIcono =
    tono === 'alerta'
      ? 'bg-red-100 text-red-600'
      : tono === 'bien'
        ? 'bg-green-100 text-green-700'
        : 'bg-primary/10 text-primary'

  return (
    <div className="flex items-start gap-2.5">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorIcono}`}>
        <Icono className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-bold leading-tight text-[#1F2937]">
          {textos.titular}
          <PistaTermino texto={textos.ayuda} etiqueta={textos.titular} />
        </p>
        <p className="mt-0.5 text-xs leading-snug text-[#4B5563]">{textos.tecnico}</p>
      </div>
    </div>
  )
}

/**
 * Barómetro del margen de maniobra: la tarjeta más destacada de la
 * pestaña. Es el indicador que responde a la pregunta que más importa
 * —¿me da el dinero hasta que el negocio se sostenga solo?— así que ocupa
 * el doble de ancho y cambia de color con el signo: rojo si los ahorros se
 * agotan antes del equilibrio, verde si sobran meses.
 */
function BarometroMargen({ metricas }) {
  const { margenMeses, estadoMargen, autonomiaMeses, breakevenMeses } = metricas

  if (margenMeses === undefined) {
    return (
      <Card className="sm:col-span-2">
        <CabeceraKpi icono={TrendingDown} textos={TEXTOS.margen} />
        <p className="mt-3 text-sm text-[#4B5563]">
          Declara tus meses de oxígeno y tu mes de equilibrio en el diagnóstico para calcularlo.
        </p>
      </Card>
    )
  }

  const hayMargen = margenMeses >= 0
  const deficit = Math.abs(margenMeses)

  // Aun siendo binario el color (negativo rojo, positivo verde), el texto
  // conserva la gravedad que distingue el modelo: una brecha corta todavía
  // es corregible con ajustes operativos; una larga, no.
  const explicacion = hayMargen
    ? `Tu colchón cubre el mes de equilibrio y aún te sobran ${margenMeses} ${
        margenMeses === 1 ? 'mes' : 'meses'
      } de oxígeno.`
    : estadoMargen === 'critico'
      ? `Te quedas sin caja ${deficit} meses antes de llegar al equilibrio. La brecha es demasiado amplia para cerrarla solo con ajustes operativos.`
      : `Te quedas sin caja ${deficit} ${deficit === 1 ? 'mes' : 'meses'} antes de llegar al equilibrio. La brecha aún es corregible.`

  return (
    <Card
      // El `!` es necesario: `Card` ya trae `bg-surface`, y entre dos
      // utilidades de fondo con la misma especificidad gana la que el CSS
      // compilado coloca después, no la que se escribe al final aquí. Sin
      // él, el barómetro se quedaba en blanco y perdía la señal de color.
      className={`sm:col-span-2 border-2 ${
        hayMargen ? 'border-green-600/40 !bg-green-50' : 'border-red-600/40 !bg-red-50'
      }`}
    >
      <CabeceraKpi
        icono={hayMargen ? TrendingUp : TrendingDown}
        textos={TEXTOS.margen}
        tono={hayMargen ? 'bien' : 'alerta'}
      />

      <p className={`mt-3 text-4xl font-extrabold ${hayMargen ? 'text-green-600' : 'text-red-600'}`}>
        {margenMeses > 0 ? '+' : ''}
        {margenMeses} {Math.abs(margenMeses) === 1 ? 'mes' : 'meses'}
      </p>

      <p className="mt-1.5 text-sm font-semibold leading-snug text-[#1F2937]">{explicacion}</p>

      {autonomiaMeses !== undefined && breakevenMeses !== undefined && (
        <p className="mt-2 text-xs text-[#4B5563]">
          {autonomiaMeses} meses de oxígeno − mes {breakevenMeses} de equilibrio
        </p>
      )}
    </Card>
  )
}

/**
 * Tarjeta de KPI sencilla: cabecera, cifra, un delta comparativo opcional
 * y una nota.
 */
function TarjetaKpi({ icono, textos, valor, nota, vacio, delta }) {
  return (
    <Card>
      <CabeceraKpi icono={icono} textos={textos} />
      {valor === null ? (
        <p className="mt-3 text-sm text-[#4B5563]">{vacio}</p>
      ) : (
        <>
          <KpiNumber className="mt-3">{valor}</KpiNumber>
          {delta && <div className="mt-2">{delta}</div>}
          {nota && <p className="mt-1.5 text-xs text-[#4B5563]">{nota}</p>}
        </>
      )}
    </Card>
  )
}

/**
 * Fila de indicadores de la pestaña "Viabilidad".
 *
 * Ergonomía cognitiva: seis tarjetas principales como máximo, con el
 * Margen de maniobra destacado como barómetro, y los indicadores que el
 * diagnóstico no sostiene (Punto Muerto, VAN, TIR) recogidos en un bloque
 * plegado para que no compitan por la atención con las cifras reales.
 *
 * Esta capa es solo presentación: todas las cifras llegan ya calculadas
 * desde `derivarMetricasViabilidad`.
 *
 * @param {{ metricas: ReturnType<typeof import('../../utils/viabilidadDiagnostico.js').derivarMetricasViabilidad> }} props
 */
export default function IndicadoresViabilidad({ metricas }) {
  if (!metricas) {
    return (
      <Card>
        <CardTitle>Indicadores de viabilidad</CardTitle>
        <p className="mt-3 text-sm text-[#4B5563]">
          Completa el bloque financiero del diagnóstico para ver cuántos meses de oxígeno tienes, tu
          mes de equilibrio y tu margen de maniobra.
        </p>
      </Card>
    )
  }

  const {
    autonomiaMeses,
    autonomiaDias,
    breakevenMeses,
    margenMeses,
    consumoMensual,
    scoreSolvencia,
    nivelPrevisiones,
    etiquetaPrevisiones,
  } = metricas

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Barómetro: ocupa el doble de ancho y abre la fila. */}
        <BarometroMargen metricas={metricas} />

        <TarjetaKpi
          icono={Wind}
          textos={TEXTOS.oxigeno}
          valor={autonomiaMeses !== undefined ? `${autonomiaMeses} meses` : null}
          // La brecha frente al equilibrio, dicha aquí mismo: sin ella, el
          // usuario tiene que restar mentalmente contra la tarjeta de al lado.
          delta={
            margenMeses !== undefined ? (
              <Delta
                valor={margenMeses}
                unidad={Math.abs(margenMeses) === 1 ? ' mes' : ' meses'}
                positivo={margenMeses >= 0}
                neutro={margenMeses === 0}
                texto={
                  margenMeses > 0
                    ? 'de margen sobre el equilibrio'
                    : margenMeses === 0
                      ? 'justo en el equilibrio'
                      : 'de brecha hasta el equilibrio'
                }
              />
            ) : undefined
          }
          nota={autonomiaDias !== undefined ? `Unos ${autonomiaDias} días sin ingresos suficientes` : undefined}
          vacio="No has declarado tu colchón de liquidez."
        />

        <TarjetaKpi
          icono={Flag}
          textos={TEXTOS.equilibrio}
          valor={breakevenMeses !== undefined ? `Mes ${breakevenMeses}` : null}
          nota="Momento estimado en que los ingresos cubren los costes"
          vacio="No has declarado tu plazo hasta el equilibrio."
        />

        <TarjetaKpi
          icono={Flame}
          textos={TEXTOS.gasto}
          valor={consumoMensual !== undefined ? `${formatEUR(consumoMensual)}/mes` : null}
          nota="Deducido de tu inversión y tus meses de oxígeno"
          vacio="Requiere inversión y meses de oxígeno declarados."
        />

        <TarjetaKpi
          icono={ShieldCheck}
          textos={TEXTOS.solvencia}
          valor={scoreSolvencia !== undefined ? `${scoreSolvencia}/100` : null}
          nota="Pesa un 25 % de tu score global"
          vacio="Completa el diagnóstico para obtener tu score."
        />

        <TarjetaKpi
          icono={ClipboardList}
          textos={TEXTOS.previsiones}
          valor={nivelPrevisiones !== undefined ? `${nivelPrevisiones}/5` : null}
          nota={etiquetaPrevisiones}
          vacio="Sin respuesta sobre tus previsiones."
        />
      </div>

      {/* Métricas que el diagnóstico no sostiene: plegadas por defecto para
          no competir con las cifras reales. `<details>` es nativo y
          accesible, sin estado en React ni dependencias. */}
      <details className="group rounded-xl border border-card-border bg-surface shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1F2937]">Métricas avanzadas (Inversores)</p>
            <p className="mt-0.5 text-xs text-[#4B5563]">
              Punto Muerto, VAN y TIR · pendientes de datos que el diagnóstico no recoge
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge className="bg-gray-100 text-[#4B5563]">{INDICADORES_PENDIENTES.length} pendientes</Badge>
            <ChevronDown className="h-4 w-4 text-[#4B5563] transition-transform group-open:rotate-180" />
          </div>
        </summary>

        <div className="border-t border-card-border p-5 pt-4">
          <p className="text-sm leading-snug text-[#4B5563]">
            Son las cifras que pide un inversor o una entidad financiera. El cuestionario de 20
            preguntas no recoge las variables necesarias para calcularlas, y preferimos dejarlas
            vacías antes que enseñarte un número inventado.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {INDICADORES_PENDIENTES.map((indicador) => (
              <div
                key={indicador.id}
                className="rounded-xl border border-dashed border-card-border bg-canvas p-4"
              >
                <p className="text-sm font-bold text-[#1F2937]">{indicador.etiqueta}</p>
                <p className="mt-1 text-xs leading-snug text-[#4B5563]">{indicador.requiere}</p>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  )
}
