import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Card } from '../ui/Card.jsx'

/**
 * Cuestionario diagnóstico previo al Dashboard.
 * Fuente única de verdad de las 6 preguntas: cada una con selección única
 * (A, B, C, D). `valor` es la clave estable que consumirá el Dashboard;
 * `etiqueta` es el texto legible para mostrar en pantalla o en informes.
 */
export const PREGUNTAS = [
  {
    id: 'fase_proyecto',
    titulo: '¿En qué fase se encuentra tu proyecto?',
    ayuda: 'Nos permite calibrar el nivel de madurez del recorrido.',
    opciones: [
      { id: 'A', valor: 'idea', etiqueta: 'Idea', descripcion: 'Concepto definido, todavía sin clientes.' },
      { id: 'B', valor: 'validacion', etiqueta: 'Validación', descripcion: 'Primeras ventas o pruebas con clientes reales.' },
      { id: 'C', valor: 'traccion', etiqueta: 'Tracción', descripcion: 'Ingresos recurrentes y demanda sostenida.' },
      { id: 'D', valor: 'consolidacion', etiqueta: 'Consolidación', descripcion: 'Negocio estable que busca escalar.' },
    ],
  },
  {
    id: 'modelo_negocio',
    titulo: '¿Cuál es tu modelo de negocio principal?',
    ayuda: 'Determina los comparables sectoriales del análisis.',
    opciones: [
      { id: 'A', valor: 'b2b_servicios', etiqueta: 'B2B Servicios', descripcion: 'Servicios profesionales a otras empresas.' },
      { id: 'B', valor: 'saas_digital', etiqueta: 'SaaS / Digital', descripcion: 'Producto digital o suscripción de software.' },
      { id: 'C', valor: 'comercio_b2c', etiqueta: 'Comercio / B2C', descripcion: 'Venta directa al consumidor final.' },
      { id: 'D', valor: 'otro', etiqueta: 'Otro', descripcion: 'Modelo mixto o distinto a los anteriores.' },
    ],
  },
  {
    id: 'canal_captacion',
    titulo: '¿Cuál es tu canal principal de captación?',
    ayuda: 'Alimenta la matriz de canales y el embudo de conversión.',
    opciones: [
      { id: 'A', valor: 'meta_ads', etiqueta: 'Meta Ads', descripcion: 'Publicidad de pago en Facebook e Instagram.' },
      { id: 'B', valor: 'seo_contenido', etiqueta: 'SEO / Contenido', descripcion: 'Posicionamiento orgánico y contenidos.' },
      { id: 'C', valor: 'contacto_directo', etiqueta: 'Contacto directo', descripcion: 'Prospección comercial, red de contactos o referidos.' },
      { id: 'D', valor: 'redes_organicas', etiqueta: 'Redes sociales', descripcion: 'Comunidad y publicaciones orgánicas.' },
    ],
  },
  {
    id: 'facturacion_mensual',
    titulo: '¿Cuál es tu facturación mensual estimada actualmente?',
    ayuda: 'Base de cálculo del punto de equilibrio y de las proyecciones.',
    opciones: [
      { id: 'A', valor: 'sin_ingresos', etiqueta: 'Todavía sin ingresos', descripcion: 'Aún no hay facturación recurrente.' },
      { id: 'B', valor: 'hasta_3k', etiqueta: 'Hasta 3.000 €/mes', descripcion: 'Primeros ingresos irregulares.' },
      { id: 'C', valor: 'de_3k_a_15k', etiqueta: 'Entre 3.000 € y 15.000 €/mes', descripcion: 'Facturación consolidada en crecimiento.' },
      { id: 'D', valor: 'mas_de_15k', etiqueta: 'Más de 15.000 €/mes', descripcion: 'Volumen estable y estructura definida.' },
    ],
  },
  {
    id: 'costes_fijos',
    titulo: '¿A cuánto ascienden tus costes fijos mensuales?',
    ayuda: 'Imprescindible para el umbral de rentabilidad y el margen de seguridad.',
    opciones: [
      { id: 'A', valor: 'menos_1k', etiqueta: 'Menos de 1.000 €', descripcion: 'Estructura mínima, sin cargas relevantes.' },
      { id: 'B', valor: 'de_1k_a_3k', etiqueta: 'Entre 1.000 € y 3.000 €', descripcion: 'Autónomo con gastos recurrentes.' },
      { id: 'C', valor: 'de_3k_a_10k', etiqueta: 'Entre 3.000 € y 10.000 €', descripcion: 'Equipo reducido o local propio.' },
      { id: 'D', valor: 'mas_de_10k', etiqueta: 'Más de 10.000 €', descripcion: 'Estructura consolidada con equipo.' },
    ],
  },
  {
    id: 'reto_prioritario',
    titulo: '¿Cuál es hoy el reto prioritario de tu negocio?',
    ayuda: 'Ordena las recomendaciones de la matriz de priorización CAME.',
    opciones: [
      { id: 'A', valor: 'captar_clientes', etiqueta: 'Captar clientes de forma constante', descripcion: 'La demanda es irregular o insuficiente.' },
      { id: 'B', valor: 'rentabilidad', etiqueta: 'Alcanzar la rentabilidad', descripcion: 'Hay ventas, pero el margen no cubre la estructura.' },
      { id: 'C', valor: 'procesos_equipo', etiqueta: 'Ordenar procesos y equipo', descripcion: 'El crecimiento supera la capacidad operativa.' },
      { id: 'D', valor: 'financiacion', etiqueta: 'Financiación y tesorería', descripcion: 'Se necesita liquidez o capital para avanzar.' },
    ],
  },
]

/** Índices de paso: 0 = consentimiento, 1..N = preguntas, N + 1 = pantalla final. */
const PASO_CONSENTIMIENTO = 0
const PASO_FINAL = PREGUNTAS.length + 1

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
function BarraProgreso({ pasoActual, totalPasos }) {
  const porcentaje = Math.round((pasoActual / totalPasos) * 100)

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
        <span>
          Pregunta {pasoActual} de {totalPasos}
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

/** Lista de opciones de selección única (radios accesibles con aspecto de tarjeta). */
function OpcionesPregunta({ pregunta, seleccion, onSeleccionar }) {
  return (
    <fieldset className="mt-6">
      <legend className="sr-only">{pregunta.titulo}</legend>
      <div className="flex flex-col gap-3">
        {pregunta.opciones.map((opcion) => {
          const activa = seleccion === opcion.id
          return (
            <label key={opcion.id} htmlFor={`${pregunta.id}-${opcion.id}`} className="block cursor-pointer">
              <input
                id={`${pregunta.id}-${opcion.id}`}
                type="radio"
                name={pregunta.id}
                value={opcion.id}
                checked={activa}
                onChange={() => onSeleccionar(opcion.id)}
                className="peer sr-only"
              />
              <span
                className={[
                  'flex items-start gap-3 rounded-xl border p-4 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2',
                  activa
                    ? 'border-primary bg-primary/5'
                    : 'border-card-border bg-surface hover:border-primary/40',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    activa ? 'bg-primary text-white' : 'bg-canvas text-muted',
                  ].join(' ')}
                >
                  {opcion.id}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-main">{opcion.etiqueta}</span>
                  <span className="text-xs leading-snug text-muted">{opcion.descripcion}</span>
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * Wizard de Onboarding: consentimiento legal, 6 preguntas de diagnóstico
 * (una por pantalla) y pantalla final de validación. Al terminar entrega las
 * respuestas al contenedor mediante `onComplete`, para que éste habilite el
 * AppLayout con los datos ya calibrados.
 *
 * Forma del objeto entregado a `onComplete`:
 *   {
 *     fase_proyecto:       { opcion: 'B', valor: 'validacion', etiqueta: 'Validación' },
 *     modelo_negocio:      { opcion, valor, etiqueta },
 *     canal_captacion:     { opcion, valor, etiqueta },
 *     facturacion_mensual: { opcion, valor, etiqueta },
 *     costes_fijos:        { opcion, valor, etiqueta },
 *     reto_prioritario:    { opcion, valor, etiqueta },
 *     meta: { consentimientoDatos, terminosAceptados, completadoEn },
 *   }
 *
 * @param {{ onComplete: (respuestas: Record<string, unknown>) => void }} props
 */
export default function OnboardingWizard({ onComplete }) {
  const [paso, setPaso] = useState(PASO_CONSENTIMIENTO)
  const [consentimientoDatos, setConsentimientoDatos] = useState(false)
  const [terminosAceptados, setTerminosAceptados] = useState(false)
  /** Respuestas en bruto: { [idPregunta]: 'A' | 'B' | 'C' | 'D' } */
  const [selecciones, setSelecciones] = useState({})

  const preguntaActual = paso > PASO_CONSENTIMIENTO && paso < PASO_FINAL ? PREGUNTAS[paso - 1] : null
  const seleccionActual = preguntaActual ? selecciones[preguntaActual.id] : undefined

  const irAtras = () => setPaso((actual) => Math.max(PASO_CONSENTIMIENTO, actual - 1))
  const irAdelante = () => setPaso((actual) => Math.min(PASO_FINAL, actual + 1))

  const seleccionar = (idPregunta, idOpcion) =>
    setSelecciones((actuales) => ({ ...actuales, [idPregunta]: idOpcion }))

  /** Traduce las selecciones (A/B/C/D) al objeto enriquecido que consume el Dashboard. */
  const construirRespuestas = () => {
    const respuestas = PREGUNTAS.reduce((acc, pregunta) => {
      const opcion = pregunta.opciones.find((o) => o.id === selecciones[pregunta.id])
      if (opcion) {
        acc[pregunta.id] = { opcion: opcion.id, valor: opcion.valor, etiqueta: opcion.etiqueta }
      }
      return acc
    }, {})

    return {
      ...respuestas,
      meta: {
        consentimientoDatos,
        terminosAceptados,
        completadoEn: new Date().toISOString(),
      },
    }
  }

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
                Son 6 preguntas breves y no te llevará más de dos minutos.
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

        {/* ── Pasos 1..6: una pregunta por pantalla ──────────────────────── */}
        {preguntaActual && (
          <Card className="flex flex-col">
            <BarraProgreso pasoActual={paso} totalPasos={PREGUNTAS.length} />

            <h2 className="text-xl font-bold leading-snug text-main">{preguntaActual.titulo}</h2>
            <p className="mt-1 text-sm text-muted">{preguntaActual.ayuda}</p>

            <OpcionesPregunta
              pregunta={preguntaActual}
              seleccion={seleccionActual}
              onSeleccionar={(idOpcion) => seleccionar(preguntaActual.id, idOpcion)}
            />

            <div className="mt-8 flex items-center justify-between">
              <BotonAtras onClick={irAtras}>Atrás</BotonAtras>

              <BotonPrimario disabled={!seleccionActual} onClick={irAdelante}>
                Continuar
                <ArrowRight className="h-4 w-4" />
              </BotonPrimario>
            </div>
          </Card>
        )}

        {/* ── Pantalla final: validación y acceso al Dashboard ───────────── */}
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
                Hemos calibrado tu panel con las respuestas del diagnóstico. Ya puedes consultar el
                estado del plan, el punto de equilibrio y los indicadores de viabilidad.
              </p>
            </div>

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
