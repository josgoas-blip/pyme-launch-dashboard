import { useMemo } from 'react'
import { FileText, Lock, Loader2, RefreshCw } from 'lucide-react'
import { Card, CardTitle } from '../ui/Card.jsx'
import { useExpedienteEmprendedor } from '../../context/ExpedienteEmprendedorContext.jsx'
import { sanitizeReportHtml } from '../../lib/sanitizeHtml.js'

/**
 * Estilos del HTML del informe. Se aplican desde el contenedor porque el
 * HTML llega de n8n sin clases de Tailwind; los `style` inline que traiga
 * mandan sobre estos.
 */
const CLASE_INFORME = [
  'text-sm leading-relaxed text-[#1F2937]',
  '[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-primary',
  '[&_h4]:mt-4 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-bold',
  '[&_p]:my-2',
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1',
  '[&_a]:font-semibold [&_a]:text-primary [&_a]:underline',
  '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs',
  '[&_th]:border [&_th]:border-card-border [&_th]:bg-canvas [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left',
  '[&_td]:border [&_td]:border-card-border [&_td]:px-2 [&_td]:py-1.5',
].join(' ')

/** Mensaje de estado de la tarjeta (cargando, bloqueado, pendiente…). */
function Aviso({ icono: Icono, titulo, children, accion }) {
  return (
    <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-card-border bg-canvas p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icono className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#1F2937]">{titulo}</p>
          {children && <p className="mt-0.5 text-xs leading-snug text-[#4B5563]">{children}</p>}
        </div>
      </div>
      {accion}
    </div>
  )
}

/**
 * Cuadrante "Informe Ejecutivo" de Configuración: visor de solo lectura,
 * sin botones de descarga ni de impresión.
 *
 * Pinta `Entrepreneur_diagnostics.informe_html` solo si el expediente tiene
 * `estado_pago = 'activo'`, y siempre pasado por `sanitizeReportHtml`: el
 * HTML lo genera un LLM y no se inserta en el DOM tal cual.
 */
export default function InformeHtmlCard() {
  const lectura = useExpedienteEmprendedor()
  const informeHtml = lectura.estado === 'ok' ? lectura.expediente.informeHtml : null
  const htmlSeguro = useMemo(() => (informeHtml ? sanitizeReportHtml(informeHtml) : ''), [informeHtml])

  // Modo Consultor: sin sesión del emprendedor no hay expediente que leer.
  if (lectura.estado === 'no-disponible') return null

  const botonRecargar = (
    <button
      type="button"
      onClick={lectura.recargar}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
      Volver a comprobar
    </button>
  )

  let contenido
  if (lectura.estado === 'cargando') {
    contenido = <Aviso icono={Loader2} titulo="Comprobando tu informe…" />
  } else if (lectura.estado === 'error') {
    contenido = (
      <Aviso icono={FileText} titulo="No se ha podido consultar tu informe" accion={botonRecargar}>
        Revisa tu conexión e inténtalo de nuevo.
      </Aviso>
    )
  } else if (lectura.estado !== 'ok') {
    contenido = (
      <Aviso icono={FileText} titulo="Todavía no hay un informe asociado a tu cuenta" accion={botonRecargar}>
        El informe ejecutivo aparece aquí cuando se registra el expediente con el email de tu cuenta.
      </Aviso>
    )
  } else if (!lectura.expediente.pagoActivo) {
    contenido = (
      <Aviso icono={Lock} titulo="Informe pendiente de pago" accion={botonRecargar}>
        Tu informe ejecutivo se desbloquea en cuanto se confirma el pago.
      </Aviso>
    )
  } else if (!htmlSeguro) {
    contenido = (
      <Aviso icono={Loader2} titulo="Estamos preparando tu informe" accion={botonRecargar}>
        El pago está confirmado. El informe aparecerá aquí en cuanto esté listo.
      </Aviso>
    )
  } else {
    contenido = (
      <article
        className={`mt-4 max-h-[70vh] overflow-y-auto rounded-lg border border-card-border bg-white p-5 ${CLASE_INFORME}`}
        // HTML sanitizado con DOMPurify (src/lib/sanitizeHtml.js).
        dangerouslySetInnerHTML={{ __html: htmlSeguro }}
      />
    )
  }

  return (
    <Card>
      <CardTitle>Informe Ejecutivo</CardTitle>
      {contenido}
    </Card>
  )
}
