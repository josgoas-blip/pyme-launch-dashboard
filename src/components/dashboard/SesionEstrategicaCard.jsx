import { useEffect, useState } from 'react'
import { CalendarDays, Clock, Loader2, CheckCircle2, Hourglass, Video, AlertTriangle } from 'lucide-react'
import { useOnboarding } from '../../context/OnboardingContext.jsx'
import { solicitarSesion, leerCitaRemota, hayWebhookCita } from '../../services/citaService.js'
import { obtenerClienteAnonimo } from '../../services/diagnosticoService.js'
import { cargarCitaLocal, guardarCitaLocal } from '../../utils/persistenciaCita.js'
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
 *
 * @param {{ perfil: import('../../types/configuracion.js').PerfilCliente }} props
 */
export default function SesionEstrategicaCard({ perfil }) {
  const { respuestas } = useOnboarding()

  const dias = proximosDiasHabiles()
  const [fecha, setFecha] = useState(dias[0]?.iso ?? '')
  const [hora, setHora] = useState(HORAS[1] ?? HORAS[0])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  // La cita del diagnóstico manda; si no la hay, la copia local. Ambas se
  // normalizan, así que la vista trabaja siempre con la misma forma.
  const [cita, setCita] = useState(
    () => normalizarCita(respuestas?.cita) ?? normalizarCita(cargarCitaLocal()),
  )

  // Intento de lectura remota: si la política RLS lo permite algún día, la
  // confirmación real de n8n desplaza a la copia local.
  useEffect(() => {
    let vigente = true
    leerCitaRemota().then((remota) => {
      if (vigente && remota) setCita(remota)
    })
    return () => {
      vigente = false
    }
  }, [])

  const enviar = async () => {
    setEnviando(true)
    setError(null)

    const fechaPropuesta = `${fecha} ${hora}`

    const resultado = await solicitarSesion({
      // No hay autenticación: el identificador estable del visitante es el
      // cliente anónimo que ya usa el servicio de diagnóstico.
      id_usuario: obtenerClienteAnonimo(),
      // El proyecto aún no tiene concepto de expediente ni devuelve el id
      // de la fila de `diagnosticos` (el insert anónimo no puede leerla),
      // así que viaja nulo hasta que exista.
      expediente_id: null,
      cliente_nombre: perfil?.contactoNombre || 'Ana López',
      cliente_email: perfil?.contactoEmail || 'josgoas@outlook.com',
      fecha_propuesta: fechaPropuesta,
      fase: respuestas?.fase_embudo || 'Tracción',
      score_total: respuestas?.score_total ?? 78,
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
    }
    guardarCitaLocal(guardada)
    setCita(normalizarCita(guardada))
  }

  // ── Estado confirmado ───────────────────────────────────────────────
  if (cita?.estado === ESTADO_CITA.CONFIRMADA) {
    const cuando = formatearFechaCita(cita.fecha)

    return (
      <Bloque fondo={VERDE_SUAVE} borde={`${VERDE}33`}>
        <Cabecera titulo="Sesión Estratégica Confirmada" icono={CheckCircle2}>
          Tu mentor ha aceptado la sesión
        </Cabecera>

        <p className="mt-4 text-sm leading-relaxed" style={{ color: TEXTO }}>
          {cuando ? (
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
  return (
    <Bloque fondo={SUPERFICIE}>
      <Cabecera>
        Reserva {DURACION_MIN} minutos con tu mentor para revisar el diagnóstico
      </Cabecera>

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

      <button
        type="button"
        onClick={enviar}
        disabled={enviando || !hayWebhookCita || !fecha}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
