import { useEffect, useRef, useState } from 'react'
import { Bot, Coins, MessageSquare, Send, Sparkles, X } from 'lucide-react'
import { useOnboarding } from '../../context/OnboardingContext.jsx'
import { usePlan } from '../../context/PlanContext.jsx'
import { creditosDelPlan, siguientePlan, PLAN_INFO } from '../../utils/planes.js'

/** Retardo simulado de la respuesta del agente, hasta conectar la API real. */
const RETARDO_RESPUESTA_MS = 900

const formatoEUR = (n) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)

/**
 * Saludo inicial contextualizado con el diagnóstico del onboarding.
 * Si faltara alguna respuesta, degrada a una bienvenida genérica.
 */
function construirBienvenida(respuestas) {
  const fase = respuestas?.fase_proyecto?.etiqueta
  const modelo = respuestas?.modelo_negocio?.etiqueta

  if (fase && modelo) {
    return `Hola, veo que tu proyecto está en fase de ${fase} con un modelo ${modelo}. ¿En qué métrica del panel te ayudo hoy?`
  }
  if (fase) {
    return `Hola, veo que tu proyecto está en fase de ${fase}. ¿En qué métrica del panel te ayudo hoy?`
  }
  return 'Hola, soy tu consultor virtual. ¿En qué métrica del panel te ayudo hoy?'
}

/**
 * Respuesta simulada del agente (Fase 1 de UI, sin API). Se apoya en los
 * datos ya adaptados del diagnóstico para que las explicaciones citen las
 * cifras reales que el usuario está viendo en los cuadrantes.
 *
 * @param {string} pregunta - Texto escrito por el usuario.
 * @param {ReturnType<typeof useOnboarding>} contexto - Diagnóstico y datos adaptados.
 */
function responderSimulado(pregunta, { respuestas, datos }) {
  const texto = pregunta.toLowerCase()
  const { puntoMuerto } = datos.viabilidad.metricasProyectadas
  const { fase_actual, proxima_accion } = datos.inicio.controlProyecto
  const canalPrincipal = datos.estrategia.canalesCaptacion.find((c) => c.esPrincipal)

  if (texto.includes('punto muerto') || texto.includes('equilibrio') || texto.includes('rentab')) {
    return `Tu punto muerto proyectado es de ${formatoEUR(puntoMuerto)}/mes: por debajo de esa facturación tus costes fijos no quedan cubiertos. Se calcula dividiendo los costes fijos que declaraste entre el margen de contribución de tu modelo, así que baja si recortas estructura o si mejoras el margen.`
  }

  if (texto.includes('canal') || texto.includes('capta') || texto.includes('cac')) {
    const nombre = canalPrincipal?.canal ?? respuestas?.canal_captacion?.etiqueta
    return nombre
      ? `Tu canal principal declarado es ${nombre}, y aparece el primero en la matriz de captación. Antes de invertir más ahí, contrasta el CAC estimado con una prueba real: en la Fase Semilla esas cifras son referencias del sector, no datos tuyos.`
      : 'Aún no has declarado un canal principal en el diagnóstico. Puedes reiniciar el cuestionario para añadirlo y personalizar la matriz de captación.'
  }

  if (texto.includes('estrategia') || texto.includes('came') || texto.includes('prior')) {
    return `En la pestaña Estrategia, la matriz CAME ordena las iniciativas por impacto frente a esfuerzo: empieza por el cuadrante de alto impacto y bajo esfuerzo. Con tu fase actual (${fase_actual}), la recomendación del panel es "${proxima_accion}".`
  }

  if (texto.includes('van') || texto.includes('tir') || texto.includes('escenario')) {
    return 'El VAN y la TIR de la pestaña Viabilidad son proyecciones bajo los Supuestos Clave del panel lateral, no resultados garantizados. Léelos siempre en la clave "bajo estos supuestos": si cambias precio o crecimiento, cambian los tres escenarios.'
  }

  if (texto.includes('riesgo') || texto.includes('dafo')) {
    return `El medidor de Riesgo General está en ${datos.analisis.riesgoDafo.riesgoGeneral} sobre 100, calculado a partir de la matriz DAFO. Las debilidades y amenazas listadas son las que más peso tienen: revisa cuáles puedes mitigar en las próximas semanas.`
  }

  if (texto.includes('fase') || texto.includes('recorrido') || texto.includes('progreso')) {
    return `Tu recorrido está en "${fase_actual}". El siguiente paso que marca el panel es "${proxima_accion}"; hasta completarlo, los pasos posteriores permanecen bloqueados.`
  }

  return `Puedo ayudarte con el punto muerto, los escenarios de viabilidad, el riesgo DAFO o la priorización CAME. Con tu fase actual (${fase_actual}), lo más urgente según el panel es "${proxima_accion}".`
}

/** Burbuja de un mensaje del hilo. */
function Burbuja({ autor, texto }) {
  const esAgente = autor === 'agente'

  return (
    <div className={`flex ${esAgente ? 'justify-start' : 'justify-end'}`}>
      <div
        className={[
          'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-snug',
          esAgente ? 'bg-canvas text-main' : 'bg-primary text-white',
        ].join(' ')}
      >
        {texto}
      </div>
    </div>
  )
}

/** Indicador de "escribiendo…" mientras se simula la respuesta. */
function Escribiendo() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-xl bg-canvas px-3 py-2.5" aria-label="El consultor está escribiendo">
        {[0, 150, 300].map((retardo) => (
          <span
            key={retardo}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
            style={{ animationDelay: `${retardo}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Tarjeta de paywall que sustituye al input cuando se agotan los créditos.
 * Si existe un plan superior, el CTA sube de plan (y con él, el cupo); en el
 * plan más alto se limita a reponer el paquete.
 */
function CreditosAgotados({ planSuperior, onAccion }) {
  return (
    <div className="border-t border-card-border bg-accent-amber/5 p-4 text-center">
      <p className="text-sm font-bold text-main">Has agotado tus créditos de consulta</p>
      <p className="mt-1 text-xs leading-snug text-muted">
        Se han consumido las consultas incluidas en tu plan.{' '}
        {planSuperior
          ? `${PLAN_INFO[planSuperior].nombre} incluye ${creditosDelPlan(planSuperior)} créditos de consulta.`
          : 'Recarga el paquete para seguir conversando con el consultor.'}
      </p>
      <button
        type="button"
        onClick={onAccion}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Recargar créditos / Mejorar Plan
      </button>
    </div>
  )
}

/**
 * Agente IA consultor flotante: botón fijo en la esquina inferior derecha
 * que abre un panel de chat de 380 px sobre el Dashboard, sin taparlo.
 *
 * Consume el diagnóstico del onboarding para saludar en contexto y para
 * citar las cifras reales del panel en sus respuestas. Cada mensaje del
 * usuario consume un crédito; al llegar a cero, el input se sustituye por
 * la tarjeta de recarga.
 *
 * Los créditos dependen del plan contratado: se guarda el consumo, no el
 * saldo, de modo que al cambiar de plan el cupo se recalcula sin perder ni
 * regalar consultas ya realizadas.
 *
 * Fase 1 (UI): las respuestas están simuladas con un retardo natural; el
 * punto de conexión con la API real es `responderSimulado`.
 */
export default function AgenteConsultorFlotante() {
  const contexto = useOnboarding()
  const { plan, setPlan } = usePlan()
  const [abierto, setAbierto] = useState(false)
  const [consumidos, setConsumidos] = useState(0)
  const [borrador, setBorrador] = useState('')
  const [esperandoRespuesta, setEsperandoRespuesta] = useState(false)
  const [mensajes, setMensajes] = useState(() => [
    { id: 'bienvenida', autor: 'agente', texto: construirBienvenida(contexto.respuestas) },
  ])

  const finDelHilo = useRef(null)
  const temporizador = useRef(null)

  // Mantiene la conversación anclada al último mensaje.
  useEffect(() => {
    finDelHilo.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensajes, esperandoRespuesta])

  // Evita que una respuesta pendiente se resuelva sobre un componente ya desmontado.
  useEffect(() => () => clearTimeout(temporizador.current), [])

  const cupo = creditosDelPlan(plan)
  const creditos = Math.max(0, cupo - consumidos)
  const planSuperior = siguientePlan(plan)
  const sinCreditos = creditos === 0
  const puedeEnviar = borrador.trim() !== '' && !sinCreditos && !esperandoRespuesta

  const enviar = (e) => {
    e.preventDefault()
    if (!puedeEnviar) return

    const pregunta = borrador.trim()
    setMensajes((actuales) => [
      ...actuales,
      { id: `u-${Date.now()}`, autor: 'usuario', texto: pregunta },
    ])
    setBorrador('')
    setConsumidos((actuales) => actuales + 1)
    setEsperandoRespuesta(true)

    // Simulación temporal: sustituir por la llamada al webhook de n8n.
    temporizador.current = setTimeout(() => {
      setMensajes((actuales) => [
        ...actuales,
        { id: `a-${Date.now()}`, autor: 'agente', texto: responderSimulado(pregunta, contexto) },
      ])
      setEsperandoRespuesta(false)
    }, RETARDO_RESPUESTA_MS)
  }

  /**
   * CTA de la tarjeta de agotamiento: sube al plan siguiente cuando lo hay
   * (su cupo mayor libera consultas al instante) y, en el plan más alto,
   * repone el paquete. Simulación local: todavía no hay checkout.
   */
  const recargarOMejorarPlan = () => {
    if (planSuperior) setPlan(planSuperior)
    else setConsumidos(0)
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir el consultor virtual"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-label="Consultor virtual de Pyme Launch"
      className="fixed bottom-6 right-6 z-40 flex max-h-[min(70vh,600px)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-card-border bg-surface shadow-2xl"
    >
      {/* Cabecera: identidad del agente + contador de créditos */}
      <header className="shrink-0 bg-primary px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Bot className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight">Consultor Pyme Launch</p>
            <p className="truncate text-[11px] text-white/70">Prediagnóstico asistido por IA</p>
          </div>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar el consultor virtual"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p
          className={[
            'mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
            sinCreditos ? 'bg-accent-red/20 text-white' : 'bg-white/15 text-white',
          ].join(' ')}
        >
          <Coins className="h-3 w-3 shrink-0" />
          Créditos disponibles: {creditos}
        </p>
      </header>

      {/* Hilo de la conversación */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {mensajes.map((m) => (
          <Burbuja key={m.id} autor={m.autor} texto={m.texto} />
        ))}
        {esperandoRespuesta && <Escribiendo />}
        <div ref={finDelHilo} />
      </div>

      {/* Pie: input o tarjeta de créditos agotados */}
      {sinCreditos ? (
        <CreditosAgotados planSuperior={planSuperior} onAccion={recargarOMejorarPlan} />
      ) : (
        <form onSubmit={enviar} className="shrink-0 border-t border-card-border p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              placeholder="Pregunta por tu punto muerto, riesgos…"
              aria-label="Escribe tu consulta"
              className="min-w-0 flex-1 rounded-full border border-card-border bg-canvas px-4 py-2 text-sm text-main placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={!puedeEnviar}
              aria-label="Enviar consulta"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:bg-card-border disabled:text-muted"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted">
            Cada consulta descuenta 1 crédito · {PLAN_INFO[plan].nombre}: {cupo} incluidos
          </p>
        </form>
      )}
    </div>
  )
}
