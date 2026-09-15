import { useEffect, useState } from 'react'
import { Building2, Mail, User, IdCard, Pencil, Check, X } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'
import TarjetaMentor from './TarjetaMentor.jsx'
import { leerMentoresRemotos } from '../../services/mentoresService.js'

/**
 * Cuadrante "Perfil del Emprendedor & Ficha Identificativa": tarjeta
 * interactiva con edición de los datos básicos del emprendedor y la ficha
 * (solo lectura) del equipo de mentoría asignado.
 *
 * El equipo de mentoría sale de Supabase: se leen las relaciones
 * `mentor_principal_id` y `comentor_id` del expediente. Mientras no estén
 * asignadas, las fichas muestran "Por asignar".
 *
 * La edición de los datos del emprendedor sigue siendo local al componente
 * (no persiste): la escritura real en Supabase se conectará en la Fase 5
 * del plan maestro.
 *
 * @param {{ perfilCliente: import('../../types/configuracion.js').PerfilCliente }} props
 */
export default function PerfilClienteCard({ perfilCliente }) {
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState(perfilCliente)
  const [mentores, setMentores] = useState(null)
  const [cargandoMentores, setCargandoMentores] = useState(true)

  // Se revalida en cada montaje, que es al entrar en Configuración: la
  // asignación la hace el equipo mientras el usuario usa el panel.
  useEffect(() => {
    let vigente = true

    leerMentoresRemotos()
      .then((equipo) => {
        if (vigente) setMentores(equipo)
      })
      .finally(() => {
        if (vigente) setCargandoMentores(false)
      })

    return () => {
      vigente = false
    }
  }, [])

  const iniciarEdicion = () => {
    setBorrador(perfilCliente)
    setEditando(true)
  }

  const cancelar = () => {
    setBorrador(perfilCliente)
    setEditando(false)
  }

  const guardar = () => {
    // Persistencia real (Supabase) pendiente de la Fase 5 del plan maestro.
    setEditando(false)
  }

  const actualizarCampo = (campo) => (e) => setBorrador((b) => ({ ...b, [campo]: e.target.value }))

  const { categoriaSector, tamano, fechaAlta } = perfilCliente

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Perfil del Emprendedor</CardTitle>
        {!editando ? (
          <button
            type="button"
            onClick={iniciarEdicion}
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/15"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={guardar}
              className="flex items-center gap-1 rounded-full bg-accent-green/10 px-2.5 py-1 text-xs font-semibold text-accent-green hover:bg-accent-green/15"
            >
              <Check className="h-3.5 w-3.5" />
              Guardar
            </button>
            <button
              type="button"
              onClick={cancelar}
              className="flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-muted hover:bg-gray-200"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          {editando ? (
            <input
              type="text"
              value={borrador.nombreEmpresa}
              onChange={actualizarCampo('nombreEmpresa')}
              className="w-full rounded-md border border-card-border px-2 py-1 text-lg font-bold text-main outline-none focus:border-primary"
            />
          ) : (
            <p className="text-lg font-bold text-main">{perfilCliente.nombreEmpresa}</p>
          )}
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-muted">{perfilCliente.sector}</p>
            <Badge className="bg-primary/10 text-primary">{categoriaSector}</Badge>
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-card-border pt-4 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-muted">Contacto</dt>
            {editando ? (
              <input
                type="text"
                value={borrador.contactoNombre}
                onChange={actualizarCampo('contactoNombre')}
                className="w-full rounded-md border border-card-border px-2 py-0.5 font-medium text-main outline-none focus:border-primary"
              />
            ) : (
              <dd className="truncate font-medium text-main">{perfilCliente.contactoNombre}</dd>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-muted">Email</dt>
            {editando ? (
              <input
                type="email"
                value={borrador.contactoEmail}
                onChange={actualizarCampo('contactoEmail')}
                className="w-full rounded-md border border-card-border px-2 py-0.5 font-medium text-main outline-none focus:border-primary"
              />
            ) : (
              <dd className="truncate font-medium text-main">{perfilCliente.contactoEmail}</dd>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IdCard className="h-4 w-4 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-muted">NIF</dt>
            {editando ? (
              <input
                type="text"
                value={borrador.nif}
                onChange={actualizarCampo('nif')}
                className="w-full rounded-md border border-card-border px-2 py-0.5 font-medium text-main outline-none focus:border-primary"
              />
            ) : (
              <dd className="font-medium text-main">{perfilCliente.nif}</dd>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-muted" />
          <div>
            <dt className="text-xs text-muted">Tamaño</dt>
            <dd className="font-medium text-main">{tamano}</dd>
          </div>
        </div>
      </dl>

      {/* Equipo de mentoría asignado (solo lectura) */}
      <div className="mt-5 border-t border-card-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Equipo de Mentoría Asignado</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TarjetaMentor
            rotulo="Mentor Principal"
            mentor={mentores?.principal ?? null}
            cargando={cargandoMentores}
            tono="primario"
          />
          <TarjetaMentor
            rotulo="Co-Mentor"
            mentor={mentores?.coMentor ?? null}
            cargando={cargandoMentores}
            tono="secundario"
          />
        </div>
        <p className="mt-2 text-[11px] text-muted">Alta: {fechaAlta}</p>
      </div>
    </Card>
  )
}
