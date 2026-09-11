import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import {
  CAMPOS_CANTIDAD,
  ETIQUETAS_ESCALA,
  OPCIONES_AUTORIZACION,
  VALORES_POR_DEFECTO,
  calcularDiagnostico,
  normalizarVariables,
} from '../../utils/scoreDiagnostico.js'

/**
 * Las 20 variables del modelo de evaluación del TFM, repartidas en los 4
 * pasos del cuestionario. Los `id` coinciden exactamente con las columnas
 * de la tabla `diagnosticos`, de modo que el payload viaja sin traducción
 * ni a Supabase ni a n8n.
 */
export const BLOQUES = [
  {
    id: 'validacion_mercado',
    titulo: 'Validación y Mercado',
    descripcion: 'Qué sabes de tu cliente y qué has contrastado con él.',
    preguntas: [
      {
        id: 'p1_idea_negocio',
        texto: '¿Tienes definida tu idea de negocio?',
        ayuda: 'Qué vendes, a quién y cómo lo entregas.',
      },
      { id: 'p2_problema_necesidad', texto: '¿Has identificado el problema o la necesidad que resuelves?' },
      { id: 'p3_cliente_principal', texto: '¿Tienes definido tu cliente principal?' },
      { id: 'p4_hablado_clientes', texto: '¿Has hablado directamente con clientes potenciales?' },
      { id: 'p5_encuestas_entrevistas', texto: '¿Has realizado encuestas o entrevistas estructuradas?' },
      {
        id: 'p6_intencion_compra',
        texto: '¿Has obtenido señales reales de intención de compra?',
        ayuda: 'Reservas, preventas, cartas de intención o listas de espera.',
      },
      { id: 'p7_aprendizaje_cambios', texto: '¿Has cambiado algo del proyecto a partir de lo aprendido?' },
    ],
  },
  {
    id: 'modelo_competencia',
    titulo: 'Modelo Comercial y Competencia',
    descripcion: 'Cómo ganas dinero y en qué te diferencias.',
    preguntas: [
      { id: 'p8_identificado_competencia', texto: '¿Has identificado a tu competencia directa e indirecta?' },
      { id: 'p9_propuesta_valor', texto: '¿Tu propuesta de valor te diferencia de esa competencia?' },
      { id: 'p10_modelo_ingresos', texto: '¿Tienes definido tu modelo de ingresos?' },
      {
        id: 'p11_precio_logica',
        texto: '¿La lógica de tus precios está justificada?',
        ayuda: 'Con costes, márgenes y referencias de mercado.',
      },
      { id: 'p12_primeros_clientes', texto: '¿Tienes identificados a tus primeros clientes?' },
    ],
  },
  {
    id: 'operaciones_equipo',
    titulo: 'Operaciones y Equipo',
    descripcion: 'Con qué medios y con quién vas a ejecutarlo.',
    preguntas: [
      {
        id: 'p13_necesidades_operativas',
        texto: '¿Has definido tus necesidades operativas?',
        ayuda: 'Proveedores, herramientas, local, licencias o logística.',
      },
      { id: 'p14_mvp_prototipo', texto: '¿Dispones de un MVP, prototipo o servicio mínimo en marcha?' },
      { id: 'p15_experiencia_equipo', texto: '¿El equipo tiene experiencia en el sector o en gestión?' },
    ],
  },
  {
    id: 'solvencia_financiera',
    titulo: 'Viabilidad Financiera y Legal',
    descripcion: 'Con cuánto cuentas y durante cuánto tiempo puedes aguantar.',
    preguntas: [
      { id: 'p16_previsiones_financieras', texto: '¿Has elaborado previsiones financieras?' },
      {
        id: 'p17_autorizacion_espana',
        tipo: 'opciones',
        texto: '¿Dispones de autorización para trabajar y emprender en España?',
        opciones: OPCIONES_AUTORIZACION,
      },
      {
        id: 'p18_inversion_total',
        tipo: 'euros',
        texto: 'Inversión total estimada para arrancar',
        ayuda: 'Todo lo necesario hasta tener el negocio operativo.',
      },
      {
        id: 'p18_recursos_propios',
        tipo: 'euros',
        texto: 'De esa inversión, ¿cuánto son recursos propios?',
        ayuda: 'Ahorros o aportaciones que no tienes que devolver.',
      },
      {
        id: 'p19_meses_colchon',
        tipo: 'meses',
        texto: 'Meses de colchón financiero disponibles',
        ayuda: 'Cuánto tiempo puedes sostener gastos sin ingresos suficientes.',
      },
      {
        id: 'p19_meses_breakeven',
        tipo: 'meses',
        texto: 'Meses estimados hasta el punto de equilibrio',
      },
      {
        id: 'p20_incidencias_financieras',
        tipo: 'booleano',
        texto: '¿Tienes incidencias financieras activas?',
        ayuda: 'Impagos, inclusión en registros de morosidad o embargos.',
      },
    ],
  },
]

/** Índices de paso: 0 = consentimiento, 1..4 = bloques, 5 = pantalla final. */
const PASO_CONSENTIMIENTO = 0
const PASO_FINAL = BLOQUES.length + 1

/** Botón primario del wizard (verde corporativo; en gris cuando está deshabilitado). */
function BotonPrimario({ disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-card-border disabled:text-muted disabled:hover:bg-card-border"
    >
      {children}
    </button>
  )
}

/** Botón secundario de retroceso. */
function BotonAtras({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-canvas hover:text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </button>
  )
}

/** Casilla de verificación con etiqueta larga, alineada arriba. */
function CasillaLegal({ id, checked, onChange, children }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-card-border bg-canvas p-4 text-left transition-colors hover:border-primary/40"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-card-border text-primary focus:ring-primary/40"
      />
      <span className="text-sm leading-snug text-main">{children}</span>
    </label>
  )
}

/** Barra de progreso superior del cuestionario. */
function BarraProgreso({ pasoActual, totalPasos, titulo }) {
  const porcentaje = Math.round((pasoActual / totalPasos) * 100)

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
        <span>
          Paso {pasoActual} de {totalPasos} · {titulo}
        </span>
        <span>{porcentaje}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-card-border"
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso del cuestionario"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Escala Likert 1-5 en botones. Son radios reales (navegables con
 * teclado) con aspecto de píldora; debajo se recuerda qué significan los
 * extremos, para que el número no quede huérfano de sentido.
 */
function EscalaLikert({ idPregunta, valor, onCambiar }) {
  return (
    <div className="mt-3">
      <fieldset>
        <legend className="sr-only">Valora de 1 a 5</legend>
        <div className="flex flex-wrap gap-2">
          {ETIQUETAS_ESCALA.map((etiqueta, indice) => {
            const puntuacion = indice + 1
            const activa = Number(valor) === puntuacion
            return (
              <label key={puntuacion} htmlFor={`${idPregunta}-${puntuacion}`} className="cursor-pointer">
                <input
                  id={`${idPregunta}-${puntuacion}`}
                  type="radio"
                  name={idPregunta}
                  value={puntuacion}
                  checked={activa}
                  onChange={() => onCambiar(puntuacion)}
                  className="peer sr-only"
                />
                <span
                  title={etiqueta}
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2',
                    activa
                      ? 'border-primary bg-primary text-white'
                      : 'border-card-border bg-surface text-muted hover:border-primary/40',
                  ].join(' ')}
                >
                  {puntuacion}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}

/** Grupo de opciones excluyentes en píldoras (autorización legal, sí/no). */
function GrupoOpciones({ idPregunta, opciones, valor, onCambiar }) {
  return (
    <fieldset className="mt-3">
      <legend className="sr-only">Selecciona una opción</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((opcion) => {
          const activa = valor === opcion.valor
          return (
            <label
              key={String(opcion.valor)}
              htmlFor={`${idPregunta}-${opcion.valor}`}
              className="cursor-pointer"
            >
              <input
                id={`${idPregunta}-${opcion.valor}`}
                type="radio"
                name={idPregunta}
                checked={activa}
                onChange={() => onCambiar(opcion.valor)}
                className="peer sr-only"
              />
              <span
                className={[
                  'inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2',
                  activa
                    ? 'border-primary bg-primary text-white'
                    : 'border-card-border bg-surface text-muted hover:border-primary/40',
                ].join(' ')}
              >
                {opcion.etiqueta}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Campo numérico con sufijo (€ o meses) y aviso de validación en línea. */
function CampoNumerico({ idPregunta, valor, sufijo, onCambiar, error }) {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <input
          id={idPregunta}
          type="number"
          inputMode="numeric"
          min="0"
          step={sufijo === '€' ? '100' : '1'}
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          aria-invalid={Boolean(error)}
          className={[
            'w-40 rounded-xl border bg-surface px-3 py-2 text-sm font-semibold text-main focus:outline-none focus:ring-2 focus:ring-primary/20',
            error ? 'border-accent-red' : 'border-card-border focus:border-primary',
          ].join(' ')}
        />
        <span className="text-sm font-semibold text-muted">{sufijo}</span>
      </div>
      {error && <p className="mt-1 text-[11px] font-semibold text-accent-red">{error}</p>}
    </div>
  )
}

/** Una pregunta con el control que le corresponda según su tipo. */
function Pregunta({ pregunta, valor, onCambiar, error }) {
  return (
    <div className="border-b border-card-border pb-5 last:border-0 last:pb-0">
      <p className="text-sm font-semibold leading-snug text-main">{pregunta.texto}</p>
      {pregunta.ayuda && <p className="mt-0.5 text-xs text-muted">{pregunta.ayuda}</p>}

      {pregunta.tipo === 'opciones' && (
        <GrupoOpciones
          idPregunta={pregunta.id}
          opciones={pregunta.opciones}
          valor={valor}
          onCambiar={onCambiar}
        />
      )}

      {pregunta.tipo === 'booleano' && (
        <GrupoOpciones
          idPregunta={pregunta.id}
          opciones={[
            { valor: true, etiqueta: 'Sí' },
            { valor: false, etiqueta: 'No' },
          ]}
          valor={valor}
          onCambiar={onCambiar}
        />
      )}

      {(pregunta.tipo === 'euros' || pregunta.tipo === 'meses') && (
        <CampoNumerico
          idPregunta={pregunta.id}
          valor={valor}
          sufijo={pregunta.tipo === 'euros' ? '€' : 'meses'}
          onCambiar={onCambiar}
          error={error}
        />
      )}

      {!pregunta.tipo && (
        <EscalaLikert idPregunta={pregunta.id} valor={valor} onCambiar={onCambiar} />
      )}
    </div>
  )
}

/** Resultado del diagnóstico mostrado en la pantalla final. */
function ResumenScore({ score, fase }) {
  return (
    <div className="flex items-center justify-center gap-6 rounded-xl border border-card-border bg-canvas p-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Score</p>
        <p className="text-3xl font-extrabold text-main">{score}</p>
        <p className="text-[11px] text-muted">sobre 100</p>
      </div>
      <div className="h-12 w-px bg-card-border" />
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Fase del embudo</p>
        <p className="mt-1 text-lg font-bold text-primary">{fase}</p>
      </div>
    </div>
  )
}

/**
 * Wizard de Onboarding: consentimiento legal, las 20 variables del modelo
 * de evaluación del TFM repartidas en 4 pasos y una pantalla final que
 * muestra el score obtenido antes de entrar al Dashboard.
 *
 * Todas las preguntas arrancan con un valor por defecto razonable, así que
 * el usuario nunca queda bloqueado: puede avanzar y afinar solo lo que
 * conoce. La única validación dura son los campos numéricos del paso 4,
 * que deben ser números no negativos.
 *
 * Objeto entregado a `onComplete` (claves idénticas a las columnas de la
 * tabla `diagnosticos`):
 *   {
 *     p1_idea_negocio: 4, … p16_previsiones_financieras: 3,   // Likert 1-5
 *     p17_autorizacion_espana: 'si' | 'tramite' | 'no',
 *     p18_inversion_total: 12000, p18_recursos_propios: 5000,
 *     p19_meses_colchon: 6, p19_meses_breakeven: 9,
 *     p20_incidencias_financieras: false,
 *     score_total: 62, fase_embudo: 'Tracción',
 *     dimensiones: { validacion_mercado: 70, … },
 *     penalizaciones: [ … ],
 *     meta: { consentimientoDatos, terminosAceptados, completadoEn },
 *   }
 *
 * @param {{ onComplete: (respuestas: Record<string, unknown>) => void }} props
 */
export default function OnboardingWizard({ onComplete }) {
  const [paso, setPaso] = useState(PASO_CONSENTIMIENTO)
  const [consentimientoDatos, setConsentimientoDatos] = useState(false)
  const [terminosAceptados, setTerminosAceptados] = useState(false)
  const [valores, setValores] = useState(VALORES_POR_DEFECTO)

  const bloqueActual = paso > PASO_CONSENTIMIENTO && paso < PASO_FINAL ? BLOQUES[paso - 1] : null

  const irAtras = () => setPaso((actual) => Math.max(PASO_CONSENTIMIENTO, actual - 1))
  const irAdelante = () => setPaso((actual) => Math.min(PASO_FINAL, actual + 1))

  const cambiarValor = (id, valor) => setValores((actuales) => ({ ...actuales, [id]: valor }))

  /** Campos numéricos vacíos, no numéricos o negativos. */
  const errores = {}
  for (const id of CAMPOS_CANTIDAD) {
    const bruto = valores[id]
    const numero = Number(bruto)
    if (bruto === '' || bruto === null || !Number.isFinite(numero)) {
      errores[id] = 'Indica un número (0 si no aplica).'
    } else if (numero < 0) {
      errores[id] = 'No puede ser negativo.'
    }
  }

  const bloqueTieneErrores = Boolean(
    bloqueActual?.preguntas.some((pregunta) => errores[pregunta.id]),
  )

  /** Normaliza los tipos y añade score, fase y dimensiones al payload. */
  const construirRespuestas = () => {
    const variables = normalizarVariables(valores)
    const { score_total, fase_embudo, dimensiones, penalizaciones } = calcularDiagnostico(variables)

    return {
      ...variables,
      score_total,
      fase_embudo,
      dimensiones,
      penalizaciones,
      meta: {
        consentimientoDatos,
        terminosAceptados,
        completadoEn: new Date().toISOString(),
      },
    }
  }

  // El resultado se calcula en vivo para poder mostrarlo en la pantalla final.
  const resultado = calcularDiagnostico(valores)

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Cabecera sobria: solo marca, sin navegación (el Dashboard aún no está visible) */}
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 p-2">
            <img src="/logo-icon.png" alt="Isotipo Pyme Launch" className="h-full w-full object-contain" />
          </span>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold leading-none text-white">Pyme Launch</h1>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Evaluación diagnóstica
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        {/* ── Pantalla 0: consentimiento legal y anonimato ───────────────── */}
        {paso === PASO_CONSENTIMIENTO && (
          <Card className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-bold text-main">Antes de empezar</h2>
              <p className="max-w-md text-sm leading-relaxed text-muted">
                Evaluación diagnóstica para calibrar la madurez y viabilidad de tu emprendimiento.
                Son 20 preguntas repartidas en 4 bloques; todas parten de un valor orientativo que
                puedes ajustar.
              </p>
            </div>

            <CasillaLegal
              id="consentimiento-datos"
              checked={consentimientoDatos}
              onChange={setConsentimientoDatos}
            >
              Acepto el tratamiento de mis datos de forma anónima y confidencial con fines
              informativos.
            </CasillaLegal>

            <div className="flex justify-end">
              <BotonPrimario disabled={!consentimientoDatos} onClick={irAdelante}>
                Comenzar evaluación
                <ArrowRight className="h-4 w-4" />
              </BotonPrimario>
            </div>
          </Card>
        )}

        {/* ── Pasos 1..4: un bloque de variables por pantalla ────────────── */}
        {bloqueActual && (
          <Card className="flex flex-col">
            <BarraProgreso
              pasoActual={paso}
              totalPasos={BLOQUES.length}
              titulo={bloqueActual.titulo}
            />

            <h2 className="text-xl font-bold leading-snug text-main">{bloqueActual.titulo}</h2>
            <p className="mt-1 text-sm text-muted">{bloqueActual.descripcion}</p>

            {/* La leyenda de la escala se enuncia una vez por bloque, no bajo cada pregunta. */}
            {bloqueActual.preguntas.some((pregunta) => !pregunta.tipo) && (
              <p className="mt-3 inline-flex self-start rounded-full bg-canvas px-3 py-1 text-[11px] font-semibold text-muted">
                1 = {ETIQUETAS_ESCALA[0]} · 5 = {ETIQUETAS_ESCALA[4]}
              </p>
            )}

            <div className="mt-6 space-y-5">
              {bloqueActual.preguntas.map((pregunta) => (
                <Pregunta
                  key={pregunta.id}
                  pregunta={pregunta}
                  valor={valores[pregunta.id]}
                  error={errores[pregunta.id]}
                  onCambiar={(valor) => cambiarValor(pregunta.id, valor)}
                />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <BotonAtras onClick={irAtras}>Atrás</BotonAtras>

              <BotonPrimario disabled={bloqueTieneErrores} onClick={irAdelante}>
                {paso === BLOQUES.length ? 'Ver resultado' : 'Continuar'}
                <ArrowRight className="h-4 w-4" />
              </BotonPrimario>
            </div>
          </Card>
        )}

        {/* ── Pantalla final: validación, score y acceso al Dashboard ────── */}
        {paso === PASO_FINAL && (
          <Card className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-green/10 text-accent-green">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-bold text-main">
                Tus datos han sido validados con éxito por el sistema
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted">
                Hemos calculado tu score de viabilidad con las 20 variables del diagnóstico. Es una
                foto de tu punto de partida, no una calificación definitiva.
              </p>
            </div>

            <ResumenScore score={resultado.score_total} fase={resultado.fase_embudo} />

            <CasillaLegal
              id="terminos-servicio"
              checked={terminosAceptados}
              onChange={setTerminosAceptados}
            >
              He leído y acepto los términos del servicio y la política de privacidad de Pyme Launch.
            </CasillaLegal>

            <div className="flex items-center justify-between">
              <BotonAtras onClick={irAtras}>Revisar respuestas</BotonAtras>

              <BotonPrimario
                disabled={!terminosAceptados}
                onClick={() => onComplete(construirRespuestas())}
              >
                Acceder al Dashboard
                <ArrowRight className="h-4 w-4" />
              </BotonPrimario>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
