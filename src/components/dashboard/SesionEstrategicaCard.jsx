import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CalendarDays,
  Clock,
  Loader2,
  CheckCircle2,
  Hourglass,
  Video,
  AlertTriangle,
  ShieldCheck,
  UserRound,
  CalendarX,
  Info,
} from 'lucide-react'
import { useOnboarding } from '../../context/OnboardingContext.jsx'
import { solicitarSesion, leerCitaRemota, hayWebhookCita, cancelarCita } from '../../services/citaService.js'
import CancelarSesionModal from './CancelarSesionModal.jsx'
import { leerFichaExpediente } from '../../services/expedienteService.js'
import { suscribirseAlExpediente } from '../../services/realtimeExpediente.js'
import { obtenerClienteAnonimo } from '../../services/diagnosticoService.js'
import { cargarCitaLocal, guardarCitaLocal } from '../../utils/persistenciaCita.js'
import { cargarExpedienteId } from '../../utils/persistenciaDiagnostico.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useModoLectura } from '../../context/ModoLecturaContext.jsx'
import { ESTADO_CITA, normalizarCita, formatearFechaCita } from '../../utils/citaDiagnostico.js'

/* Paleta de la tarjeta (Pyme Launch). Se aplican como valores literales
   porque son tonos propios de este bloque y no tokens del tema. */
const VERDE = '#1B4D3E'
const VERDE_SUAVE = '#EBF3EF' // Fondo de la tarjeta confirmada
const CREMA = '#F0EDE6' // Fondo de la tarjeta en revisión
const SUPERFICIE = '#FAF9F5'
const BORDE = '#E0DCD3'
const TEXTO = '#2C3E35'
const TEXTO_SUAVE = '#4B5563'

/** Duración de la sesión, en minutos. */
const DURACION_MIN = 45

/** Días hábiles ofrecidos en el selector (unas cuatro semanas). */
const DIAS_HABILES_OFRECIDOS = 20

/**
 * Horas de inicio disponibles.
 *
 * La jornada va de 10:00 a 19:00 y la sesión dura 45 minutos, así que el
 * último inicio posible es a las 18:00: empezar a las 19:00 la dejaría
 * terminando fuera de horario.
 */
const HORAS = Array.from({ length: 9 }, (_, i) => `${String(10 + i).padStart(2, '0')}:00`)

const formatoFechaLarga = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

/**
 * Próximos días hábiles a partir de mañana.
 *
 * Se genera la lista en vez de usar un `<input type="date">` porque un
 * campo de fecha nativo no sabe excluir sábados y domingos: habría que
 * dejar al usuario elegir un fin de semana y rechazárselo después. Con una
 * lista cerrada el fin de semana simplemente no existe.
 */
function proximosDiasHabiles(cantidad = DIAS_HABILES_OFRECIDOS) {
  const dias = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1)

  while (dias.length < cantidad) {
    const diaSemana = cursor.getDay()
    if (diaSemana !== 0 && diaSemana !== 6) {
      const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(
        cursor.getDate(),
      ).padStart(2, '0')}`
      dias.push({ iso, etiqueta: formatoFechaLarga.format(cursor) })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return dias
}

/**
 * Nombre del mentor asignado, o el aviso de que aún no lo está.
 *
 * Se escribe "Por asignar" en vez de dejar el hueco vacío o inventar un
 * nombre: el cliente tiene que poder distinguir "todavía no lo sabemos" de
 * "esta es la persona con la que te reúnes".
 *
 * @param {{ rotulo: string, mentor: import('../../services/expedienteService.js').Mentor|null }} props
 */
function LineaMentor({ rotulo, mentor }) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: '#FFFFFF', color: VERDE }}
      >
        <UserRound className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: TEXTO_SUAVE }}>
          {rotulo}
        </p>
        <p className="truncate text-sm font-bold" style={{ color: mentor ? TEXTO : TEXTO_SUAVE }}>
          {mentor?.nombre ?? 'Por asignar'}
        </p>
        {mentor?.especialidad && (
          <p className="truncate text-xs" style={{ color: TEXTO_SUAVE }}>
            {mentor.especialidad}
          </p>
        )}
      </div>
    </div>
  )
}

/** Envoltorio con la paleta de la tarjeta. */
function Bloque({ children, fondo = '#FFFFFF', borde = BORDE, grosor = 'border' }) {
  return (
    <div
      className={`rounded-xl ${grosor} p-6 shadow-sm`}
      style={{ backgroundColor: fondo, borderColor: borde, color: TEXTO }}
    >
      {children}
    </div>
  )
}

/** Cabecera común a los tres estados. */
function Cabecera({ titulo = 'Sesión Estratégica de Mentoría', icono: Icono = CalendarDays, tono = VERDE, children }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${tono}1A`, color: tono }}
      >
        <Icono className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-bold leading-tight" style={{ color: TEXTO }}>
          {titulo}
        </h3>
        <p className="mt-0.5 text-xs" style={{ color: TEXTO_SUAVE }}>
          {children}
        </p>
      </div>
    </div>
  )
}

/**
 * Bloque de agendado de la Sesión Estratégica con el mentor.
 *
 * Tres estados, resueltos en este orden de prioridad:
 *   1. `respuestas.cita` del diagnóstico — lo que escribe n8n al aprobar.
 *   2. La copia remota que se pueda leer de Supabase.
 *   3. La copia local del navegador, que es lo que sostiene el estado
 *      "en revisión" entre la solicitud y la confirmación.
 *
 * Sin ninguna de las tres, se muestra el formulario. Todo lo que llega de
 * fuera pasa por `normalizarCita`, así que da igual si n8n escribe
 * `confirmada` o `sesion_agendada`, o si la fecha viene en ISO con huso o
 * en el formato del formulario.
 */
export default function SesionEstrategicaCard() {
  const { respuestas } = useOnboarding()
  const { userId, nombreCompleto, email: emailSesion } = useAuth()
  const { soloLectura, expedienteId: expedienteLectura } = useModoLectura()

  const dias = proximosDiasHabiles()
  const [fecha, setFecha] = useState(dias[0]?.iso ?? '')
  const [hora, setHora] = useState(HORAS[1] ?? HORAS[0])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  /**
   * Consentimiento para compartir el diagnóstico con el mentor.
   *
   * Arranca siempre desmarcado y no se recuerda entre sesiones: un
   * consentimiento es un acto explícito por cada solicitud, no una
   * preferencia que se deje configurada una vez.
   */
  const [consentimiento, setConsentimiento] = useState(false)

  /**
   * La cita del diagnóstico manda; si no la hay, la copia local.
   *
   * En Modo Consultor no se mira la copia local: ese `localStorage` es el
   * del navegador del mentor y contendría su propia cita, no la del
   * expediente que está revisando. Ahí solo vale lo que venga en el
   * expediente cargado desde Supabase.
   */
  const [cita, setCita] = useState(
    () => normalizarCita(respuestas?.cita) ?? (soloLectura ? null : normalizarCita(cargarCitaLocal())),
  )

  /**
   * Equipo de mentoría asignado al expediente.
   *
   * Se lee aquí además de en la ficha del perfil porque cuando la sesión
   * está confirmada lo que el cliente necesita saber es con quién se
   * reúne, y esa respuesta debe estar en la misma tarjeta que la fecha.
   */
  const [ficha, setFicha] = useState(null)

  /** Cita vigente legible desde la revalidación asíncrona. */
  const citaRef = useRef(cita)
  citaRef.current = cita

  /** Modal de cancelación abierto. */
  const [cancelando, setCancelando] = useState(false)

  /**
   * Avisos tras cancelar: qué se ha hecho y qué no (por ejemplo, si no se
   * pudo avisar automáticamente al mentor). Se muestran sobre el formulario.
   */
  const [avisosCancelacion, setAvisosCancelacion] = useState([])

  /**
   * Aviso que sustituye al botón de cancelar. El botón desaparece con la
   * cita confirmada, así que el foco se lleva aquí para no perderlo.
   */
  const avisoCancelacionRef = useRef(null)
  const [enfocarAviso, setEnfocarAviso] = useState(false)
  useEffect(() => {
    if (!enfocarAviso) return
    avisoCancelacionRef.current?.focus()
    setEnfocarAviso(false)
  }, [enfocarAviso])

  /**
   * Relectura del estado real desde Supabase.
   *
   * La copia local solo sirve para pintar algo mientras la red responde:
   * la cita la aprueba el mentor fuera de este navegador, así que el
   * `localStorage` no puede ser la fuente de la verdad. Lo que llegue de
   * Supabase manda sobre él.
   *
   * Cuando la lectura confirma, se escribe también en el navegador: así la
   * tarjeta ya no puede volver a pintar "en revisión" si una lectura
   * posterior falla o se queda sin red. La dirección contraria no se
   * aplica —una lectura vacía no borra una confirmación— porque un corte
   * de red no es una cancelación.
   */
  const refrescarDesdeSupabase = useCallback(async (sigueVigente = () => true) => {
    const [remota, fichaRemota] = await Promise.all([leerCitaRemota(), leerFichaExpediente()])

    if (!sigueVigente()) return

    if (fichaRemota) setFicha(fichaRemota)

    if (!remota) return

    const actual = citaRef.current
    // Una solicitud nueva enviada tras cancelar está "en revisión" en este
    // navegador; la cita cancelada que aún devuelve Supabase es la anterior
    // y no debe devolver la tarjeta al formulario.
    if (remota.estado === ESTADO_CITA.CANCELADA && actual?.estado === ESTADO_CITA.PENDIENTE) return
    // Cancelada aquí pero todavía confirmada en Supabase: pasa cuando la
    // base de datos no dejó modificar la fila y la cancelación llegó por n8n,
    // que la actualizará después. Hasta entonces manda la cancelación.
    if (
      actual?.estado === ESTADO_CITA.CANCELADA &&
      actual.filaId &&
      actual.filaId === remota.filaId &&
      remota.estado !== ESTADO_CITA.CANCELADA
    ) {
      return
    }

    setCita(remota)

    if (remota.estado === ESTADO_CITA.CONFIRMADA) {
      guardarCitaLocal({
        estado: 'confirmada',
        fecha: remota.fecha ? remota.fecha.toISOString() : undefined,
        meet_url: remota.meetUrl ?? undefined,
      })
    }
  }, [])

  /**
   * Revalidación al montar + suscripción en tiempo real.
   *
   * La lectura inicial cubre la recarga y la vuelta a la pestaña. La
   * suscripción cubre el caso que la lectura no puede cubrir: que el
   * mentor apruebe la sesión con el panel ya abierto. Sin ella el cliente
   * seguiría viendo "en revisión" hasta recargar, que es exactamente el
   * síntoma que se quería corregir.
   */
  useEffect(() => {
    let vigente = true
    const sigueVigente = () => vigente

    // En Modo Consultor se lee el expediente del enlace en modo aislado:
    // sin tocar el `localStorage` del mentor ni su identidad, que
    // devolverían *su* cita y *sus* mentores en la ficha del cliente.
    //
    // La cita hay que leerla, no basta con la que trae el expediente
    // cargado: n8n la escribe en una fila aparte, así que sin esta consulta
    // al mentor se le decía que el cliente no había pedido sesión cuando en
    // realidad la tenía confirmada con él. Tampoco se suscribe a cambios:
    // la ficha es una foto para preparar la reunión, no un panel vivo.
    if (soloLectura) {
      Promise.all([
        leerCitaRemota(expedienteLectura, { aislado: true }),
        leerFichaExpediente(expedienteLectura),
      ]).then(([remota, fichaRemota]) => {
        if (!vigente) return
        if (remota) setCita(remota)
        if (fichaRemota) setFicha(fichaRemota)
      })

      return () => {
        vigente = false
      }
    }

    refrescarDesdeSupabase(sigueVigente)

    const darDeBaja = suscribirseAlExpediente({
      expedienteId: cargarExpedienteId(),
      // Las dos identidades posibles: la fila puede haberse creado antes
      // de que el usuario se registrara.
      identificadores: [userId, obtenerClienteAnonimo()],
      alCambiar: () => refrescarDesdeSupabase(sigueVigente),
    })

    return () => {
      vigente = false
      darDeBaja()
    }
  }, [soloLectura, expedienteLectura, userId, refrescarDesdeSupabase])

  const enviar = async () => {
    // Segunda barrera además del botón deshabilitado: el estado podría
    // enviarse por teclado o por una llamada programática, y la solicitud
    // no debe salir sin el consentimiento marcado.
    if (!consentimiento) {
      setError('Debes aceptar compartir los datos de tu diagnóstico para solicitar la sesión.')
      return
    }

    setEnviando(true)
    setError(null)

    const fechaPropuesta = `${fecha} ${hora}`

    const resultado = await solicitarSesion({
      // Con sesión iniciada manda el `user_id` real; sin ella, el cliente
      // anónimo estable que ya usa el servicio de diagnóstico.
      id_usuario: userId ?? obtenerClienteAnonimo(),
      // El expediente es la fila de `diagnosticos` creada al guardar el
      // cuestionario: permite a n8n escribir la cita en la fila correcta.
      expediente_id: cargarExpedienteId(),
      // Nombre y correo reales de la sesión (perfil → registro → correo).
      // Sin sesión se envía `null`: el literal "Invitado" o un contacto
      // de ejemplo llegarían al mentor como si fueran los del cliente.
      cliente_nombre: userId ? nombreCompleto : null,
      cliente_email: emailSesion ?? null,
      fecha_propuesta: fechaPropuesta,
      fase: respuestas?.fase_embudo || 'Tracción',
      score_total: respuestas?.score_total ?? 78,
      // Queda registrado en el flujo de n8n: es la prueba de que el usuario
      // autorizó el acceso del mentor a sus métricas.
      consentimiento_compartir_datos: true,
    })

    setEnviando(false)

    if (!resultado.ok) {
      setError(`No se ha podido enviar la solicitud: ${resultado.motivo}.`)
      return
    }

    const guardada = {
      estado: 'en_revision',
      fecha_propuesta: fechaPropuesta,
      solicitadaEn: new Date().toISOString(),
      // Se guarda también en local para poder acreditar cuándo se dio el
      // consentimiento sin depender de que n8n responda.
      consentimientoEn: new Date().toISOString(),
    }
    guardarCitaLocal(guardada)
    setCita(normalizarCita(guardada))
  }

  /**
   * Cancela la sesión confirmada con el motivo indicado.
   *
   * Si la cancelación se registra (en Supabase o a través de n8n), la copia
   * local pasa a "cancelada" y la tarjeta vuelve al formulario para elegir
   * otro día. Se avisa de lo que no haya podido hacerse: que el mentor no ha
   * recibido aviso automático o que la reserva está pendiente de liberarse.
   */
  const confirmarCancelacion = async (motivo) => {
    const resultado = await cancelarCita({
      filaId: cita?.filaId ?? null,
      motivo,
      cita,
      contacto: {
        id_usuario: userId ?? obtenerClienteAnonimo(),
        expediente_id: cargarExpedienteId(),
        cliente_nombre: userId ? nombreCompleto : null,
        cliente_email: emailSesion ?? null,
      },
    })

    if (!resultado.ok) return resultado

    const cancelada = {
      estado: 'cancelada',
      fila_id: resultado.filaId,
      motivo: motivo.trim(),
      cancelada_en: resultado.canceladaEn,
    }
    guardarCitaLocal(cancelada)
    setCita(normalizarCita(cancelada))
    // El consentimiento es por solicitud: la nueva debe marcarlo de nuevo.
    setConsentimiento(false)
    setError(null)

    const avisos = []
    if (!resultado.enSupabase) {
      avisos.push(
        'El equipo de mentoría liberará la reserva en tu expediente en breve; hasta entonces puede seguir figurando como confirmada en otros dispositivos.',
      )
    }
    if (resultado.avisoMentor === null) {
      avisos.push(
        'No hay un aviso automático configurado: escribe a tu mentor para confirmarle la cancelación y que libere el evento del calendario.',
      )
    } else if (resultado.avisoMentor === false) {
      avisos.push(
        'No se ha podido avisar automáticamente a tu mentor: escríbele para confirmarle la cancelación.',
      )
    }
    setAvisosCancelacion(avisos)
    setCancelando(false)
    setEnfocarAviso(true)
    return { ok: true }
  }

  // ── Estado confirmado ───────────────────────────────────────────────
  if (cita?.estado === ESTADO_CITA.CONFIRMADA) {
    const cuando = formatearFechaCita(cita.fecha)

    return (
      <Bloque fondo={VERDE_SUAVE} borde={`${VERDE}33`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Cabecera titulo="Sesión Estratégica Confirmada" icono={CheckCircle2}>
            {soloLectura ? 'Sesión aceptada por el equipo de mentoría' : 'Tu mentor ha aceptado la sesión'}
          </Cabecera>

          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: VERDE }}
          >
            Confirmada
          </span>
        </div>

        {/* En Modo Consultor la frase se redacta en tercera persona: quien
            lee es el mentor, y tutearle como si fuera el cliente le haría
            dudar de si está viendo su propia agenda o la del expediente. */}
        <p className="mt-4 text-sm leading-relaxed" style={{ color: TEXTO }}>
          {soloLectura ? (
            cuando ? (
              <>
                La sesión con este emprendedor está confirmada para el{' '}
                <span className="font-bold">{cuando}</span>.
              </>
            ) : (
              <>La sesión con este emprendedor está confirmada; la fecha aún no consta.</>
            )
          ) : cuando ? (
            <>
              Tu sesión ha sido confirmada para el{' '}
              <span className="font-bold">{cuando}</span>. Recibirás recordatorios en tu correo.
            </>
          ) : (
            <>
              Tu sesión ha sido confirmada. Recibirás la fecha definitiva y los recordatorios en tu
              correo.
            </>
          )}
        </p>

        {/* Equipo asignado. Se pinta siempre que la sesión esté confirmada,
            aunque todavía no haya nombres: saber que están "por asignar" es
            información útil, y ocultar el bloque dejaría al cliente sin
            saber si el dato existe o si la tarjeta se lo está callando. */}
        <div
          className="mt-4 grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2"
          style={{ backgroundColor: `${VERDE}0D`, borderColor: `${VERDE}26` }}
        >
          <LineaMentor rotulo="Tutor" mentor={ficha?.principal ?? null} />
          <LineaMentor rotulo="Co-tutor" mentor={ficha?.coMentor ?? null} />
        </div>

        {cita.meetUrl ? (
          <a
            href={cita.meetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: VERDE }}
          >
            <Video className="h-4 w-4" />
            Entrar a Google Meet
          </a>
        ) : (
          <p className="mt-4 text-sm" style={{ color: TEXTO_SUAVE }}>
            El enlace de Google Meet llegará por correo antes de la sesión.
          </p>
        )}

        <p className="mt-4 text-xs" style={{ color: TEXTO_SUAVE }}>
          Duración: {DURACION_MIN} minutos
        </p>

        {/* Cancelar o reprogramar: solo el emprendedor, nunca el mentor desde
            su visor de solo lectura. Reprogramar es cancelar y pedir otro día. */}
        {!soloLectura && (
          <button
            type="button"
            onClick={() => setCancelando(true)}
            aria-haspopup="dialog"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: BORDE, color: TEXTO }}
          >
            <CalendarX className="h-4 w-4" aria-hidden="true" />
            Cancelar o reprogramar sesión
          </button>
        )}

        {cancelando && (
          <CancelarSesionModal
            cuando={cuando}
            onConfirmar={confirmarCancelacion}
            onCerrar={() => setCancelando(false)}
          />
        )}
      </Bloque>
    )
  }

  // ── Estado en revisión ──────────────────────────────────────────────
  if (cita?.estado === ESTADO_CITA.PENDIENTE) {
    const cuando = formatearFechaCita(cita.fecha)

    return (
      <Bloque fondo={CREMA} borde={VERDE}>
        <Cabecera>Solicitud enviada al equipo de mentoría</Cabecera>

        <div className="mt-4 flex items-start gap-2.5">
          <Hourglass className="mt-0.5 h-4 w-4 shrink-0" style={{ color: VERDE }} />
          <p className="text-sm font-semibold leading-relaxed" style={{ color: TEXTO }}>
            Tu solicitud para el {cuando ?? 'día propuesto'} está en revisión por el equipo de
            mentoría. Recibirás confirmación por correo en menos de 24 h.
          </p>
        </div>
      </Bloque>
    )
  }

  // ── Sin solicitar ───────────────────────────────────────────────────

  // En Modo Consultor no se ofrece el formulario: el mentor no puede pedir
  // una sesión en nombre del cliente. Se le informa del estado, que es lo
  // que necesita saber al preparar la reunión.
  if (soloLectura) {
    const cancelada = cita?.estado === ESTADO_CITA.CANCELADA
    const fechaCancelacion = cancelada ? formatearFechaCita(cita.canceladaEn) : null
    return (
      <Bloque fondo={SUPERFICIE}>
        <Cabecera>Sesión de mentoría</Cabecera>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: TEXTO_SUAVE }}>
          {cancelada
            ? `El emprendedor canceló su sesión estratégica${fechaCancelacion ? ` el ${fechaCancelacion}` : ''}. Puede volver a solicitarla desde su panel.`
            : 'Este emprendedor todavía no ha solicitado su sesión estratégica. La solicitud parte siempre del cliente desde su propio panel.'}
        </p>
        {cancelada && cita.motivo && (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: TEXTO }}>
            <span className="font-semibold">Motivo:</span> {cita.motivo}
          </p>
        )}
      </Bloque>
    )
  }

  return (
    <Bloque fondo={SUPERFICIE}>
      <Cabecera>
        Reserva {DURACION_MIN} minutos con tu mentor para revisar el diagnóstico
      </Cabecera>

      {/* Tras cancelar, el formulario queda listo para pedir otra fecha; el
          aviso dice qué se ha hecho y, si falta algo, qué debe hacer el
          emprendedor. */}
      {cita?.estado === ESTADO_CITA.CANCELADA && (
        <div
          ref={avisoCancelacionRef}
          tabIndex={-1}
          role="status"
          className="mt-4 rounded-lg border px-3 py-2.5 text-xs leading-relaxed focus:outline-none"
          style={{ backgroundColor: '#FFFFFF', borderColor: BORDE, color: TEXTO }}
        >
          <p className="flex items-start gap-2 font-semibold">
            <CalendarX className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: VERDE }} aria-hidden="true" />
            Has cancelado tu sesión anterior
            {formatearFechaCita(cita.canceladaEn) ? ` el ${formatearFechaCita(cita.canceladaEn)}` : ''}. Elige un
            nuevo día y hora para reprogramarla.
          </p>
          {avisosCancelacion.map((aviso) => (
            <p key={aviso} className="mt-1.5 flex items-start gap-2" style={{ color: TEXTO_SUAVE }}>
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {aviso}
            </p>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="cita-fecha"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
            style={{ color: TEXTO_SUAVE }}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Día (lunes a viernes)
          </label>
          <select
            id="cita-fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            disabled={enviando}
            className="mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#1B4D3E] disabled:opacity-60"
            style={{ borderColor: BORDE, color: TEXTO }}
          >
            {dias.map((dia) => (
              <option key={dia.iso} value={dia.iso}>
                {dia.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="cita-hora"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
            style={{ color: TEXTO_SUAVE }}
          >
            <Clock className="h-3.5 w-3.5" />
            Hora de inicio (10:00 – 19:00)
          </label>
          <select
            id="cita-hora"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            disabled={enviando}
            className="mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#1B4D3E] disabled:opacity-60"
            style={{ borderColor: BORDE, color: TEXTO }}
          >
            {HORAS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Consentimiento de tratamiento de datos.
          Los colores van literales y el texto se renderiza siempre, sin
          depender del estado del checkbox: un enunciado legal que solo se
          lee al marcarlo no es un consentimiento informado. */}
      <div
        className="mt-5 rounded-xl border p-4"
        style={{ backgroundColor: '#FFFFFF', borderColor: BORDE }}
      >
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: VERDE }} aria-hidden="true" />
          <p className="text-xs leading-relaxed" style={{ color: TEXTO_SUAVE }}>
            <span className="font-bold" style={{ color: TEXTO }}>
              Consentimiento de tratamiento de datos para mentoría:
            </span>{' '}
            Al agendar esta sesión, autorizas que el mentor asignado acceda a los datos y métricas
            declarados en tu diagnóstico para el análisis y conducción de la sesión técnica, bajo
            estricto secreto profesional y política de privacidad.
          </p>
        </div>

        <label
          htmlFor="cita-consentimiento"
          className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-lg border p-3"
          style={{ backgroundColor: SUPERFICIE, borderColor: BORDE, colorScheme: 'light' }}
        >
          <input
            id="cita-consentimiento"
            type="checkbox"
            checked={consentimiento}
            onChange={(e) => setConsentimiento(e.target.checked)}
            disabled={enviando}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded"
            style={{ accentColor: VERDE, colorScheme: 'light' }}
          />
          <span
            className="select-none text-xs font-semibold leading-relaxed"
            style={{ color: TEXTO, WebkitTextFillColor: TEXTO, opacity: 1 }}
          >
            Acepto compartir los datos de mi diagnóstico con el equipo de mentoría asignado.
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={enviar}
        disabled={enviando || !hayWebhookCita || !fecha || !consentimiento}
        title={consentimiento ? undefined : 'Acepta el consentimiento para poder solicitar la sesión'}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        style={{ backgroundColor: VERDE }}
      >
        {enviando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando solicitud…
          </>
        ) : (
          `Solicitar Sesión Estratégica (${DURACION_MIN} min)`
        )}
      </button>

      {error && (
        <p
          className="mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-semibold leading-snug"
          style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', color: '#B91C1C' }}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {!hayWebhookCita && (
        <p className="mt-3 text-xs" style={{ color: TEXTO_SUAVE }}>
          El agendado está desactivado: falta definir VITE_N8N_WEBHOOK_CITA_URL.
        </p>
      )}
    </Bloque>
  )
}
