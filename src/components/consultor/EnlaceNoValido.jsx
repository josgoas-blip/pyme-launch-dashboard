import { LinkIcon, AlertTriangle } from 'lucide-react'

/**
 * Motivo → texto que ve el mentor.
 *
 * Se distingue entre casos porque la acción que toca es distinta en cada
 * uno: un expediente inexistente se resuelve pidiendo otro enlace, y un
 * fallo de red, reintentando. Un único mensaje genérico dejaría al mentor
 * sin saber cuál de las dos cosas hacer.
 */
const MOTIVOS = {
  'enlace-invalido': {
    titulo: 'Enlace de consultoría no válido',
    detalle:
      'El enlace no incluye un identificador de expediente con el formato esperado. Pide al equipo que vuelva a generarlo.',
  },
  'no-encontrado': {
    titulo: 'Enlace de consultoría no válido o expirado',
    detalle:
      'No hay ningún expediente con ese identificador. Puede que se haya eliminado o que el enlace esté incompleto.',
  },
  'token-invalido': {
    titulo: 'Enlace de consultoría no válido o expirado',
    detalle:
      'El token del enlace no corresponde a este expediente. Solicita un enlace nuevo al equipo de mentoría.',
  },
  'error-red': {
    titulo: 'No se ha podido cargar el expediente',
    detalle: 'No hay conexión con el servidor. Comprueba tu red y vuelve a intentarlo.',
  },
  'sin-configuracion': {
    titulo: 'Acceso de consultoría no disponible',
    detalle: 'Esta instalación no tiene configurada la conexión con la base de datos.',
  },
}

/**
 * Pantalla de error del Modo Consultor.
 *
 * @param {{ motivo: string, expedienteId?: string|null }} props
 */
export default function EnlaceNoValido({ motivo, expedienteId }) {
  const { titulo, detalle } = MOTIVOS[motivo] ?? MOTIVOS['no-encontrado']

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: '#FAF9F5' }}
    >
      <div className="w-full max-w-md text-center">
        <img
          src="/logo-pymelaunch.png"
          alt="Pyme Launch"
          className="mx-auto h-9 w-auto object-contain"
        />

        <div
          className="mt-6 rounded-xl border p-6 shadow-sm"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E0DCD3' }}
        >
          <span
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: '#FEF2F2', color: '#B91C1C' }}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>

          <h1 className="mt-4 text-lg font-bold" style={{ color: '#1F2937' }}>
            {titulo}
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: '#4B5563' }}>
            {detalle}
          </p>

          {expedienteId && (
            <p
              className="mt-4 flex items-center justify-center gap-1.5 break-all rounded-lg px-3 py-2 font-mono text-xs"
              style={{ backgroundColor: '#FAF9F5', color: '#4B5563' }}
            >
              <LinkIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
              {expedienteId}
            </p>
          )}
        </div>

        <p className="mt-6 text-xs leading-relaxed" style={{ color: '#4B5563' }}>
          Si crees que se trata de un error, contacta con el equipo de Pyme Launch.
        </p>
      </div>
    </div>
  )
}
