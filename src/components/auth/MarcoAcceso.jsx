/* Paleta corporativa de las pantallas de acceso, en literales: se pintan
   antes que nada y no pueden quedarse sin contraste si un navegador
   reinterpreta los tokens del tema. */
export const VERDE = '#1B4D3E'
export const SUPERFICIE = '#FAF9F5'
export const BORDE = '#E0DCD3'
export const TEXTO = '#1F2937'
export const TEXTO_SUAVE = '#4B5563'

/** Estilo común de los campos de las pantallas de acceso. */
export const CLASE_INPUT =
  'w-full rounded-lg border py-2.5 pr-3 text-sm outline-none transition-colors focus:border-[#1B4D3E] disabled:opacity-60'
export const CLASE_ETIQUETA = 'text-xs font-semibold uppercase tracking-wider'
export const CLASE_BOTON_PRINCIPAL =
  'inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
export const CLASE_ENLACE =
  'font-bold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]/60'

/**
 * Marco común de las pantallas de acceso: marca, título, tarjeta y aviso
 * legal. Lo comparten el inicio de sesión, el registro, la recuperación y
 * el cambio de contraseña, para que las cuatro se vean como un mismo flujo.
 *
 * @param {{ titulo: string, subtitulo: string, children: import('react').ReactNode }} props
 */
export default function MarcoAcceso({ titulo, subtitulo, children }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: SUPERFICIE }}
    >
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo-pymelaunch.png" alt="Pyme Launch" className="h-10 w-auto object-contain" />
          <h1 className="mt-4 text-2xl font-bold" style={{ color: TEXTO }}>
            {titulo}
          </h1>
          <p className="mt-1 text-sm" style={{ color: TEXTO_SUAVE }}>
            {subtitulo}
          </p>
        </div>

        <div className="rounded-xl border p-6 shadow-sm" style={{ backgroundColor: '#FFFFFF', borderColor: BORDE }}>
          {children}
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: TEXTO_SUAVE }}>
          Prediagnóstico asistido por IA. No constituye certificación de viabilidad, garantía de
          financiación ni asesoramiento jurídico, fiscal o financiero.
        </p>
      </div>
    </div>
  )
}

/**
 * Mensaje de error o de confirmación bajo un formulario de acceso.
 *
 * @param {{ tipo: 'error'|'exito', icono: import('react').ComponentType, children: import('react').ReactNode }} props
 */
export function MensajeAcceso({ tipo, icono: Icono, children }) {
  const esError = tipo === 'error'
  return (
    <p
      role={esError ? 'alert' : 'status'}
      className="flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold leading-snug"
      style={
        esError
          ? { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', color: '#B91C1C' }
          : { borderColor: `${VERDE}55`, backgroundColor: '#EBF3EF', color: VERDE }
      }
    >
      <Icono className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  )
}
