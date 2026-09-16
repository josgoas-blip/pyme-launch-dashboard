import { useEffect, useState } from 'react'
import { Building2, Mail, User, IdCard, Users, Pencil, Check, X, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'
import TarjetaMentor from './TarjetaMentor.jsx'
import { leerFichaExpediente } from '../../services/expedienteService.js'
import {
  componerFichaEmpresa,
  leerPerfilEmpresa,
  leerPerfilDeExpediente,
  guardarPerfilEmpresa,
  TAMANOS_EMPRESA,
  SECTORES_SUGERIDOS,
} from '../../services/perfilEmpresaService.js'
import { useOnboarding } from '../../context/OnboardingContext.jsx'
import { useModoLectura } from '../../context/ModoLecturaContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const FORMATO_ALTA = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Madrid',
})

/**
 * Fecha de alta en formato español, con una cadena de reservas.
 *
 * Prioridad: el `completado_en` de la fila de Supabase, la marca que el
 * cuestionario dejó en el diagnóstico guardado y, si no hubiera ninguna, la
 * fecha de hoy. Así la línea nunca queda vacía ni muestra "Invalid Date".
 *
 * @param {Date|null|undefined} altaRemota
 * @param {Record<string, unknown>|null} respuestas
 * @returns {string}
 */
function formatearAlta(altaRemota, respuestas) {
  const candidatos = [altaRemota, respuestas?.meta?.completadoEn, new Date()]

  for (const candidato of candidatos) {
    if (!candidato) continue
    const fecha = candidato instanceof Date ? candidato : new Date(candidato)
    if (Number.isFinite(fecha.getTime())) return FORMATO_ALTA.format(fecha)
  }

  return FORMATO_ALTA.format(new Date())
}

/** Clases compartidas por los campos del formulario de edición. */
const CLASE_CAMPO =
  'w-full rounded-md border border-card-border bg-white px-2 py-1 font-medium text-main outline-none focus:border-primary disabled:opacity-60'

/** Borrador del formulario a partir del perfil guardado. */
function borradorDesde(perfil) {
  return {
    nombre_empresa: perfil?.nombre_empresa ?? '',
    actividad: perfil?.actividad ?? '',
    sector: perfil?.sector ?? '',
    nif: perfil?.nif ?? '',
    tamano_empresa: perfil?.tamano_empresa ?? '',
  }
}

/**
 * Valor de la ficha: gris cuando es un texto de reserva, para que "No
 * especificado" no se lea como si fuera un dato registrado.
 */
function Valor({ registrado, className = '', children }) {
  return <span className={`${registrado ? 'text-main' : 'text-muted italic'} ${className}`}>{children}</span>
}

/**
 * Cuadrante "Perfil del Emprendedor & Ficha Identificativa".
 *
 * Los datos salen de `profiles`; no hay mock. Lo que no consta se muestra
 * con un texto de reserva en gris ("Mi Empresa (Sin registrar)", "No
 * especificado"…), nunca con los datos de otra empresa.
 *
 * Dos modos:
 *   - Cliente autenticado: lee su propio perfil y puede editar los datos
 *     de empresa, que se escriben en `profiles` con su `id`.
 *   - Modo Consultor: lee el perfil asociado al expediente del enlace, en
 *     solo lectura y sin tocar la sesión del navegador del mentor.
 *
 * El equipo de mentoría y la fecha de alta siguen saliendo del expediente.
 */
export default function PerfilClienteCard() {
  const { respuestas } = useOnboarding()
  const { soloLectura, expedienteId } = useModoLectura()
  const { usuario, userId } = useAuth()

  const [ficha, setFicha] = useState(null)
  const [cargandoFicha, setCargandoFicha] = useState(true)

  /** Fila de `profiles` tal como está guardada (o `null`). */
  const [perfil, setPerfil] = useState(null)
  /** Nombre y correo de respaldo del expediente, solo en Modo Consultor. */
  const [respaldo, setRespaldo] = useState({})
  const [cargandoPerfil, setCargandoPerfil] = useState(true)

  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState(borradorDesde(null))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [avisoGuardado, setAvisoGuardado] = useState(false)

  // Equipo de mentoría y alta. Se revalida en cada montaje, que es al
  // entrar en Configuración: la asignación la hace el equipo mientras el
  // usuario usa el panel.
  useEffect(() => {
    let vigente = true

    // En Modo Consultor se consulta el expediente del enlace: sin pasarlo,
    // el servicio caería en el expediente guardado en el navegador del
    // mentor y mostraría su ficha en lugar de la del cliente.
    leerFichaExpediente(soloLectura ? expedienteId : undefined)
      .then((datos) => {
        if (vigente) setFicha(datos)
      })
      .finally(() => {
        if (vigente) setCargandoFicha(false)
      })

    return () => {
      vigente = false
    }
  }, [soloLectura, expedienteId])

  // Datos del emprendedor y de su empresa.
  useEffect(() => {
    let vigente = true
    setCargandoPerfil(true)

    // En Modo Consultor la fuente es el expediente y nada más: el `userId`
    // de esta pestaña, si lo hubiera, sería el del mentor.
    const lectura = soloLectura
      ? leerPerfilDeExpediente(expedienteId).then((datos) => {
          if (!vigente) return
          setPerfil(datos?.perfil ?? null)
          setRespaldo(datos?.respaldo ?? {})
        })
      : leerPerfilEmpresa(userId).then((datos) => {
          if (!vigente) return
          setPerfil(datos)
          setRespaldo({})
        })

    lectura.finally(() => {
      if (vigente) setCargandoPerfil(false)
    })

    return () => {
      vigente = false
    }
  }, [soloLectura, expedienteId, userId])

  const vista = componerFichaEmpresa({
    perfil,
    // En Modo Consultor no se pasa el usuario de la sesión: su nombre y su
    // correo no son los del cliente.
    usuario: soloLectura ? null : usuario,
    respaldo,
  })

  // Solo se edita con sesión: sin `userId` no hay fila de `profiles` en la
  // que escribir, y ofrecer el botón terminaría siempre en error.
  const puedeEditar = !soloLectura && Boolean(userId)

  const iniciarEdicion = () => {
    setBorrador(borradorDesde(perfil))
    setError(null)
    setAvisoGuardado(false)
    setEditando(true)
  }

  const cancelar = () => {
    setBorrador(borradorDesde(perfil))
    setError(null)
    setEditando(false)
  }

  const guardar = async () => {
    setGuardando(true)
    setError(null)

    const resultado = await guardarPerfilEmpresa(userId, borrador)

    setGuardando(false)

    if (!resultado.ok) {
      setError(resultado.motivo)
      return
    }

    // Se pinta lo que devolvió la base de datos, no el borrador: así la
    // tarjeta refleja exactamente lo guardado, normalización incluida
    // (NIF en mayúsculas, campos vacíos a null).
    setPerfil(resultado.perfil)
    setEditando(false)
    setAvisoGuardado(true)
  }

  const actualizarCampo = (campo) => (e) => setBorrador((b) => ({ ...b, [campo]: e.target.value }))

  // Un tamaño guardado fuera de los tramos actuales se conserva como opción:
  // si no, abrir el formulario y guardar sin tocarlo lo sobrescribiría.
  const opcionesTamano =
    borrador.tamano_empresa && !TAMANOS_EMPRESA.includes(borrador.tamano_empresa)
      ? [borrador.tamano_empresa, ...TAMANOS_EMPRESA]
      : TAMANOS_EMPRESA

  const fechaAlta = formatearAlta(ficha?.altaEn, respuestas)
  const cargando = cargandoPerfil && !perfil

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Perfil del Emprendedor</CardTitle>
        {puedeEditar &&
          (!editando ? (
            <button
              type="button"
              onClick={iniciarEdicion}
              disabled={cargandoPerfil}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/15 disabled:opacity-60"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="flex items-center gap-1 rounded-full bg-accent-green/10 px-2.5 py-1 text-xs font-semibold text-accent-green hover:bg-accent-green/15 disabled:opacity-60"
              >
                {guardando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={cancelar}
                disabled={guardando}
                className="flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-muted hover:bg-gray-200 disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" />
                Cancelar
              </button>
            </div>
          ))}
      </div>

      {/* Empresa, actividad y sector */}
      <div className="mt-4 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          {editando ? (
            <div className="space-y-2">
              <label className="block">
                <span className="text-xs text-muted">Nombre comercial / Empresa</span>
                <input
                  type="text"
                  value={borrador.nombre_empresa}
                  onChange={actualizarCampo('nombre_empresa')}
                  disabled={guardando}
                  maxLength={120}
                  placeholder="Nombre de tu empresa o proyecto"
                  className={`${CLASE_CAMPO} text-base font-bold`}
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted">Actividad / Descripción</span>
                <textarea
                  value={borrador.actividad}
                  onChange={actualizarCampo('actividad')}
                  disabled={guardando}
                  maxLength={280}
                  rows={2}
                  placeholder="A qué se dedica tu negocio"
                  className={`${CLASE_CAMPO} text-sm`}
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted">Sector</span>
                <input
                  type="text"
                  list="sectores-sugeridos"
                  value={borrador.sector}
                  onChange={actualizarCampo('sector')}
                  disabled={guardando}
                  maxLength={80}
                  placeholder="Elige uno o escríbelo"
                  className={`${CLASE_CAMPO} text-sm`}
                />
                <datalist id="sectores-sugeridos">
                  {SECTORES_SUGERIDOS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </label>
            </div>
          ) : (
            <>
              <p className="text-lg font-bold">
                <Valor registrado={vista.empresaRegistrada || cargando}>
                  {cargando ? 'Cargando…' : vista.empresa}
                </Valor>
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-sm">
                  <Valor registrado={vista.actividadRegistrada} className="!text-muted">
                    {vista.actividad}
                  </Valor>
                </p>
                <Badge className="bg-primary/10 text-primary">{vista.sector}</Badge>
              </div>
            </>
          )}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-card-border pt-4 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-muted">Contacto</dt>
            <dd className="truncate font-medium text-main">{vista.nombreCompleto}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-muted">Email</dt>
            <dd className="truncate font-medium">
              <Valor registrado={Boolean(vista.email)}>{vista.email ?? 'No especificado'}</Valor>
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IdCard className="h-4 w-4 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-muted">NIF / CIF</dt>
            {editando ? (
              <input
                type="text"
                value={borrador.nif}
                onChange={actualizarCampo('nif')}
                disabled={guardando}
                maxLength={20}
                aria-label="NIF / CIF"
                placeholder="B12345678"
                className={`${CLASE_CAMPO} py-0.5 uppercase`}
              />
            ) : (
              <dd className="font-medium">
                <Valor registrado={vista.nifRegistrado}>{vista.nif}</Valor>
              </dd>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-muted">Tamaño</dt>
            {editando ? (
              <select
                aria-label="Tamaño de la empresa"
                value={borrador.tamano_empresa}
                onChange={actualizarCampo('tamano_empresa')}
                disabled={guardando}
                className={`${CLASE_CAMPO} py-0.5`}
              >
                <option value="">Sin especificar</option>
                {opcionesTamano.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            ) : (
              <dd className="font-medium">
                <Valor registrado={vista.tamanoRegistrado}>{vista.tamano}</Valor>
              </dd>
            )}
          </div>
        </div>
      </dl>

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold leading-snug text-red-700"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {avisoGuardado && !editando && (
        <p role="status" className="mt-4 text-xs font-semibold text-accent-green">
          Ficha guardada.
        </p>
      )}

      {/* Equipo de mentoría asignado (solo lectura) */}
      <div className="mt-5 border-t border-card-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Equipo de Mentoría Asignado</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TarjetaMentor
            rotulo="Mentor Principal"
            mentor={ficha?.principal ?? null}
            cargando={cargandoFicha}
            tono="primario"
          />
          <TarjetaMentor
            rotulo="Co-Mentor"
            mentor={ficha?.coMentor ?? null}
            cargando={cargandoFicha}
            tono="secundario"
          />
        </div>
        <p className="mt-2 text-[11px] text-muted">Alta: {fechaAlta}</p>
      </div>
    </Card>
  )
}
