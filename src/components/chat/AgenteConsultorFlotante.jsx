import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Coins, MessageSquare, Send, Sparkles, X } from 'lucide-react'
import { useOnboarding } from '../../context/OnboardingContext.jsx'
import { usePlan } from '../../context/PlanContext.jsx'
import { creditosDelPlan, siguientePlan, PLAN_INFO } from '../../utils/planes.js'
import { consultarAgente, hayWebhookAgente } from '../../services/agenteService.js'
import { obtenerClienteAnonimo } from '../../services/diagnosticoService.js'
import { dimensionMasDebil } from '../../utils/scoreDiagnostico.js'
import { derivarResumenGlobal } from '../../utils/resumenDiagnostico.js'

/** Retardo del modo local, para que la respuesta no aparezca de golpe. */
const RETARDO_RESPUESTA_MS = 900

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
  const fase = respuestas?.fase_embudo
  const score = respuestas?.score_total
  const debil = dimensionMasDebil(respuestas?.dimensiones)

  if (fase && Number.isFinite(score)) {
    const palanca = debil ? ` Tu punto más flojo ahora mismo es ${debil.etiqueta.toLowerCase()}.` : ''
    return `Hola, veo que tu proyecto está en fase de ${fase} con un score de viabilidad de ${score} sobre 100.${palanca} ¿En qué métrica del panel te ayudo hoy?`
  }
  if (fase) {
    return `Hola, veo que tu proyecto está en fase de ${fase}. ¿En qué métrica del panel te ayudo hoy?`
  }
  return 'Hola, soy tu consultor virtual. ¿En qué métrica del panel te ayudo hoy?'
}

/**
 * Respuesta local de respaldo, solo cuando no hay webhook configurado
 * (VITE_N8N_WEBHOOK_URL vacía): así un clon sin n8n sigue demostrable. Se
 * apoya en los datos ya adaptados del diagnóstico para que las
 * explicaciones citen las cifras reales que el usuario ve en los cuadrantes.
 *
 * @param {string} pregunta - Texto escrito por el usuario.
 * @param {ReturnType<typeof useOnboarding>} contexto - Diagnóstico y datos adaptados.
 */
function responderSimulado(pregunta, { respuestas, datos }) {
  const texto = pregunta.toLowerCase()
  // Mismas cifras que el Resumen General: el agente no puede citar una fase
  // ni una acción distintas de las que el usuario ve en el panel.
  const resumen = derivarResumenGlobal(respuestas)
  const fase_actual = resumen?.fase ?? 'sin diagnóstico'
  const proxima_accion = resumen?.proximaAccion ?? 'completar el diagnóstico'
  const debil = dimensionMasDebil(respuestas?.dimensiones)

  if (texto.includes('score') || texto.includes('puntuación') || texto.includes('diagnóstico')) {
    return respuestas?.score_total !== undefined
      ? `Tu score de viabilidad es ${respuestas.score_total} sobre 100, lo que sitúa el proyecto en fase de ${respuestas.fase_embudo}. Se calcula ponderando cuatro dimensiones: validación de mercado (35 %), modelo y competencia (25 %), solvencia financiera y legal (25 %) y operaciones y equipo (15 %).${debil ? ` La que más te penaliza es ${debil.etiqueta.toLowerCase()}, con ${debil.puntuacion} sobre 100.` : ''}`
      : 'Todavía no hay diagnóstico completado, así que el panel muestra datos de referencia.'
  }

  if (texto.includes('punto muerto') || texto.includes('equilibrio') || texto.includes('rentab')) {
    const meses = respuestas?.p19_meses_breakeven
    const colchon = respuestas?.p19_meses_colchon
    const aviso =
      meses !== undefined && colchon !== undefined && colchon < meses
        ? ` Ojo: declaraste ${colchon} meses de colchón frente a ${meses} hasta el equilibrio, así que hay una brecha de ${meses - colchon} meses que conviene cubrir.`
        : ''
    return `La pestaña Viabilidad no te muestra una cifra de punto muerto: el diagnóstico recoge tu horizonte hasta el equilibrio, no tus costes fijos mensuales ni tu margen de contribución, así que cualquier euro que pusiéramos ahí sería inventado.${aviso}`
  }

  if (texto.includes('inversión') || texto.includes('financiación') || texto.includes('colchón')) {
    const inversion = respuestas?.p18_inversion_total
    const propios = respuestas?.p18_recursos_propios
    return inversion !== undefined && propios !== undefined
      ? `Declaraste una inversión total de ${formatoEUR(inversion)} con ${formatoEUR(propios)} de recursos propios: cubres el ${Math.round((propios / (inversion || 1)) * 100)} % sin financiación externa. Esa cobertura es uno de los cuatro componentes de tu dimensión de solvencia.`
      : 'No hay cifras de inversión en el diagnóstico. Puedes reiniciar el cuestionario para añadirlas.'
  }

  if (texto.includes('estrategia') || texto.includes('came') || texto.includes('prior')) {
    return `En la pestaña Estrategia, la matriz CAME ordena las iniciativas por impacto frente a esfuerzo: empieza por el cuadrante de alto impacto y bajo esfuerzo. Con tu fase actual (${fase_actual}), la recomendación del panel es "${proxima_accion}".`
  }

  if (texto.includes('van') || texto.includes('tir') || texto.includes('escenario')) {
    return 'El VAN y la TIR aparecen en Viabilidad como pendientes de datos: harían falta tu serie de flujos de caja y una tasa de descuento, y el diagnóstico no las recoge. Lo que sí proyecta esa pestaña son tres escenarios de saldo de caja construidos con tu inversión y tus plazos declarados; léelos siempre en la clave "bajo estos supuestos".'
  }

  if (texto.includes('riesgo') || texto.includes('dafo')) {
    return `El medidor de Riesgo General está en ${datos.analisis.riesgoDafo.riesgoGeneral} sobre 100, calculado a partir de la matriz DAFO. Las debilidades y amenazas listadas son las que más peso tienen: revisa cuáles puedes mitigar en las próximas semanas.`
  }

  if (texto.includes('fase') || texto.includes('recorrido') || texto.includes('progreso')) {
    return `Tu recorrido está en "${fase_actual}". El siguiente paso que marca el panel es "${proxima_accion}"; hasta completarlo, los pasos posteriores permanecen bloqueados.`
  }

  return `Puedo ayudarte con el punto muerto, los escenarios de viabilidad, el riesgo DAFO o la priorización CAME. Con tu fase actual (${fase_actual}), lo más urgente según el panel es "${proxima_accion}".`
}

/**
 * Convierte los marcadores `**negrita**` del LLM en nodos React. No se
 * interpreta HTML: cada fragmento se inserta como texto, así que una
 * respuesta manipulada no puede inyectar marcado en el panel.
 *
 * @param {string} texto
 * @returns {Array<string|JSX.Element>}
 */
function conNegritas(texto) {
  return texto.split(/\*\*(.+?)\*\*/g).map((fragmento, indice) =>
    indice % 2 === 1 ? <strong key={indice}>{fragmento}</strong> : fragmento,
  )
}

/** Burbuja de un mensaje del hilo (el aviso de fallo se distingue en ámbar). */
function Burbuja({ autor, texto, esAviso }) {
  const esAgente = autor === 'agente'

  const estilo = esAviso
    ? 'border border-accent-amber/30 bg-accent-amber/5 text-main'
    : esAgente
      ? 'bg-canvas text-main'
      : 'bg-primary text-white'

  return (
    <div className={`flex ${esAgente ? 'justify-start' : 'justify-end'}`}>
      {/* El agente responde en Markdown ligero: se respetan sus saltos de
          línea y se resuelven las negritas. */}
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm leading-snug ${estilo}`}
      >
        {conNegritas(texto)}
      </div>
    </div>
  )
}

/** Segundos tras los que se avisa de que la respuesta puede tardar. */
const AVISO_ESPERA_LARGA_S = 8

/**
 * Indicador de espera mientras el consultor prepara la respuesta.
 *
 * Permanece visible durante toda la consulta. El flujo de n8n tarda de
 * forma habitual 20-25 segundos, y tres puntos animados sin más hacían
 * pensar que el chat se había quedado colgado: por eso dice qué ocurre y,
 * pasados unos segundos, que es normal que tarde.
 *
 * Es una región `status`: un lector de pantalla anuncia el texto, cosa que
 * no ocurría con el `aria-label` que llevaba antes sobre un `div`.
 */
function Escribiendo() {
  const [segundos, setSegundos] = useState(0)

  useEffect(() => {
    const intervalo = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(intervalo)
  }, [])

  const esperaLarga = segundos >= AVISO_ESPERA_LARGA_S

  return (
    <div className="flex justify-start">
      <div role="status" className="max-w-[85%] rounded-xl bg-canvas px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1" aria-hidden="true">
            {[0, 150, 300].map((retardo) => (
              <span
                key={retardo}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
                style={{ animationDelay: `${retardo}ms` }}
              />
            ))}
          </span>
          <span className="text-xs font-semibold text-main">Consultor pensando…</span>
        </div>
        {esperaLarga && (
          <p className="mt-1 text-[11px] leading-snug text-muted">
            Está analizando tu diagnóstico. Puede tardar hasta un minuto.
          </p>
        )}
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
 * regalar consultas ya realizadas. Solo se descuenta crédito cuando el
 * agente entrega una respuesta: un fallo de red no se cobra.
 *
 * Las respuestas las genera el webhook de n8n (VITE_N8N_WEBHOOK_URL). Sin
 * webhook configurado, el chat degrada a `responderSimulado`.
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
  const montado = useRef(true)

  /**
   * Identidad que viaja al webhook. En modo demo es el identificador
   * anónimo estable por navegador; cuando exista sesión real, aquí irá el
   * id del usuario autenticado.
   */
  const clienteId = useMemo(() => obtenerClienteAnonimo(), [])

  // Mantiene la conversación anclada al último mensaje.
  useEffect(() => {
    finDelHilo.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensajes, esperandoRespuesta])

  // Evita que una respuesta en vuelo se aplique sobre un componente desmontado.
  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  const cupo = creditosDelPlan(plan)
  const creditos = Math.max(0, cupo - consumidos)
  const planSuperior = siguientePlan(plan)
  const sinCreditos = creditos === 0
  const puedeEnviar = borrador.trim() !== '' && !sinCreditos && !esperandoRespuesta

  const enviar = async (e) => {
    e.preventDefault()
    if (!puedeEnviar) return

    const pregunta = borrador.trim()
    setMensajes((actuales) => [
      ...actuales,
      { id: `u-${Date.now()}`, autor: 'usuario', texto: pregunta },
    ])
    setBorrador('')
    setEsperandoRespuesta(true)

    let resultado
    if (hayWebhookAgente) {
      resultado = await consultarAgente({
        mensaje: pregunta,
        clienteId,
        respuestasDiagnostico: contexto.respuestas,
      })
    } else {
      // Sin webhook: explicación local, con un retardo que la haga natural.
      await esperar(RETARDO_RESPUESTA_MS)
      resultado = { ok: true, respuesta: responderSimulado(pregunta, contexto) }
    }

    if (!montado.current) return

    if (resultado.ok) {
      setMensajes((actuales) => [
        ...actuales,
        { id: `a-${Date.now()}`, autor: 'agente', texto: resultado.respuesta },
      ])
      // El crédito se cobra solo con una respuesta entregada.
      setConsumidos((actuales) => actuales + 1)
    } else {
      setMensajes((actuales) => [
        ...actuales,
        {
          id: `e-${Date.now()}`,
          autor: 'agente',
          esAviso: true,
          texto: `No he podido conectar con el consultor (${resultado.motivo}). No se ha descontado ningún crédito: vuelve a intentarlo en unos segundos.`,
        },
      ])
    }

    setEsperandoRespuesta(false)
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
          <Burbuja key={m.id} autor={m.autor} texto={m.texto} esAviso={m.esAviso} />
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
            Cada respuesta descuenta 1 crédito · {PLAN_INFO[plan].nombre}: {cupo} incluidos
          </p>
        </form>
      )}
    </div>
  )
}
