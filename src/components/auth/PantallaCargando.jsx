import { Loader2 } from 'lucide-react'

/**
 * Pantalla intermedia mientras se resuelve la sesión o se busca el
 * diagnóstico del usuario.
 *
 * Existe para evitar un parpadeo: recuperar la sesión de Supabase es
 * asíncrono, y sin esta pausa el primer render enseñaría la pantalla de
 * acceso a alguien que ya tiene sesión iniciada.
 *
 * @param {{ mensaje?: string }} props
 */
export default function PantallaCargando({ mensaje = 'Cargando tu panel…' }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-4"
      style={{ backgroundColor: '#FAF9F5' }}
      role="status"
      aria-live="polite"
    >
      <img src="/logo-pymelaunch.png" alt="Pyme Launch" className="h-9 w-auto object-contain" />
      <div className="flex items-center gap-2 text-sm" style={{ color: '#4B5563' }}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {mensaje}
      </div>
    </div>
  )
}
