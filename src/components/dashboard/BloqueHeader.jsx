/**
 * Cabecera numerada de un bloque de análisis/estrategia progresivo
 * (design.md: acento verde corporativo + jerarquía tipográfica de cuadrante).
 *
 * @param {{ numero: number, titulo: string, subtitulo?: string }} props
 */
export default function BloqueHeader({ numero, titulo, subtitulo }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
        {numero}
      </span>
      <div>
        <h2 className="text-lg font-bold text-main">{titulo}</h2>
        {subtitulo && <p className="text-sm text-muted">{subtitulo}</p>}
      </div>
    </div>
  )
}
