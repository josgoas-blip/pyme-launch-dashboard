/**
 * Gráfico circular de progreso (donut) para el Score Global.
 *
 * Es SVG puro, sin Recharts: un anillo de fondo y otro recortado con
 * `stroke-dasharray`. Para un único valor no hace falta cargar una
 * librería de gráficos, y así el donut hereda el color exacto que se le
 * pase y se imprime bien.
 *
 * El arco arranca arriba (`rotate(-90)`) porque un progreso que empieza a
 * las 3 en punto se lee mal.
 *
 * @param {{
 *   valor: number,
 *   maximo?: number,
 *   color?: string,
 *   tamano?: number,
 *   grosor?: number,
 *   etiqueta?: string,
 * }} props
 */
export default function ScoreCircular({
  valor,
  maximo = 100,
  color = '#1B4D3E',
  tamano = 176,
  grosor = 14,
  etiqueta = 'sobre 100',
}) {
  const acotado = Math.max(0, Math.min(maximo, Number(valor) || 0))
  const radio = (tamano - grosor) / 2
  const circunferencia = 2 * Math.PI * radio
  const recorrido = (acotado / maximo) * circunferencia

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <svg
        width={tamano}
        height={tamano}
        viewBox={`0 0 ${tamano} ${tamano}`}
        role="img"
        aria-label={`Score global: ${acotado} ${etiqueta}`}
      >
        <g transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}>
          <circle
            cx={tamano / 2}
            cy={tamano / 2}
            r={radio}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={grosor}
          />
          <circle
            cx={tamano / 2}
            cy={tamano / 2}
            r={radio}
            fill="none"
            stroke={color}
            strokeWidth={grosor}
            strokeLinecap="round"
            strokeDasharray={`${recorrido} ${circunferencia}`}
            className="transition-[stroke-dasharray] duration-700"
          />
        </g>
      </svg>

      {/* La cifra va superpuesta, no dentro del SVG: así hereda la
          tipografía de la aplicación y se puede seleccionar. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold leading-none text-[#1F2937]">{acotado}</span>
        <span className="mt-1 text-xs text-[#4B5563]">{etiqueta}</span>
      </div>
    </div>
  )
}
