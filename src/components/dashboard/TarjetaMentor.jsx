import { UserRound } from 'lucide-react'

/**
 * Ficha de un mentor del equipo asignado.
 *
 * Cuando la clave foránea del expediente aún está vacía se muestra "Por
 * asignar" en lugar de un nombre por defecto. Enseñar un mentor cableado
 * que nadie ha asignado haría creer al emprendedor que ya tiene contacto,
 * y es justo el tipo de dato simulado que el panel ha ido retirando.
 *
 * @param {{
 *   rotulo: string,
 *   mentor: import('../../services/expedienteService.js').Mentor | null,
 *   cargando?: boolean,
 *   tono?: 'primario' | 'secundario',
 * }} props
 */
export default function TarjetaMentor({ rotulo, mentor, cargando = false, tono = 'primario' }) {
  const estiloIcono =
    tono === 'primario' ? 'bg-primary/10 text-primary' : 'bg-accent-green/10 text-accent-green'

  return (
    <div className="flex items-center gap-2 rounded-lg border border-card-border bg-canvas p-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ${
          mentor ? estiloIcono : 'bg-gray-100 text-[#4B5563]'
        }`}
      >
        {mentor?.avatarUrl ? (
          <img
            src={mentor.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            // Un avatar roto no debe dejar un hueco: se oculta y queda el
            // fondo del contenedor.
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <UserRound className="h-4 w-4" />
        )}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{rotulo}</p>

        {cargando ? (
          <>
            <span className="mt-1 block h-3.5 w-28 animate-pulse rounded bg-gray-200" />
            <span className="mt-1.5 block h-3 w-20 animate-pulse rounded bg-gray-100" />
          </>
        ) : mentor ? (
          <>
            <p className="truncate text-sm font-bold text-main">{mentor.nombre}</p>
            {mentor.especialidad && (
              <p className="truncate text-xs text-muted">{mentor.especialidad}</p>
            )}
          </>
        ) : (
          <>
            <p className="truncate text-sm font-bold text-[#4B5563]">Por asignar</p>
            <p className="truncate text-xs text-muted">Te lo comunicaremos por correo</p>
          </>
        )}
      </div>
    </div>
  )
}
