/**
 * Tramos cualitativos de la solidez de validación comercial.
 *
 * El corte no es estético: por debajo del 50 % las respuestas del usuario
 * describen intenciones sin contrastar; entre 50 y 70 ya hay señales de
 * interés real; por encima, hay demanda demostrada. El texto es lo que se
 * lee primero, el porcentaje solo lo respalda.
 */
export const TRAMOS_VALIDACION = [
  { minimo: 71, etiqueta: 'Tracción y demanda validada', color: '#1B4D3E', tono: 'text-green-700' },
  { minimo: 50, etiqueta: 'Interés inicial detectado', color: '#DD6B20', tono: 'text-accent-amber' },
  { minimo: 0, etiqueta: 'Hipótesis sin contrastar', color: '#E53E3E', tono: 'text-red-600' },
]

/** Tramo al que pertenece una puntuación 0-100. */
export function tramoValidacion(porcentaje) {
  return TRAMOS_VALIDACION.find((tramo) => porcentaje >= tramo.minimo) ?? TRAMOS_VALIDACION[2]
}

/** Punto de la circunferencia para un ángulo dado (0° = izquierda, 180° = derecha). */
function punto(cx, cy, radio, gradosDesdeIzquierda) {
  const radianes = (Math.PI * (180 - gradosDesdeIzquierda)) / 180
  return [cx + radio * Math.cos(radianes), cy - radio * Math.sin(radianes)]
}

/** Descripción SVG de un arco semicircular entre dos ángulos. */
function arco(cx, cy, radio, desde, hasta) {
  const [x1, y1] = punto(cx, cy, radio, desde)
  const [x2, y2] = punto(cx, cy, radio, hasta)
  const arcoLargo = hasta - desde > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${radio} ${radio} 0 ${arcoLargo} 1 ${x2} ${y2}`
}

/**
 * Medidor semicircular de la solidez de validación comercial.
 *
 * SVG nativo, como `ScoreCircular`: dos trazos de arco, uno de fondo y
 * otro recortado al porcentaje. El semicírculo se lee como un cuadro de
 * mandos (de "nada contrastado" a la izquierda a "validado" a la derecha),
 * que es justo la escala que describe esta métrica.
 *
 * @param {{ porcentaje: number, tamano?: number, grosor?: number }} props
 */
export default function GaugeValidacion({ porcentaje, tamano = 220, grosor = 18 }) {
  const valor = Math.max(0, Math.min(100, Number(porcentaje) || 0))
  const tramo = tramoValidacion(valor)

  const cx = tamano / 2
  const radio = (tamano - grosor) / 2
  // El lienzo es medio círculo más el grosor del trazo y hueco para el texto.
  const cy = radio + grosor / 2
  const alto = cy + grosor / 2

  return (
    <div className="flex flex-col items-center">
      <svg
        width={tamano}
        height={alto}
        viewBox={`0 0 ${tamano} ${alto}`}
        role="img"
        aria-label={`Solidez de validación comercial: ${valor} % — ${tramo.etiqueta}`}
      >
        <path
          d={arco(cx, cy, radio, 0, 180)}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={grosor}
          strokeLinecap="round"
        />
        {valor > 0 && (
          <path
            d={arco(cx, cy, radio, 0, (valor / 100) * 180)}
            fill="none"
            stroke={tramo.color}
            strokeWidth={grosor}
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* La cifra y el estado van en HTML, no en el SVG: heredan la
          tipografía de la aplicación y se pueden seleccionar. */}
      <div className="-mt-8 flex flex-col items-center">
        <span className="text-3xl font-extrabold leading-none text-[#1F2937]">{valor} %</span>
        <span className={`mt-1.5 text-sm font-bold ${tramo.tono}`}>{tramo.etiqueta}</span>
      </div>
    </div>
  )
}
