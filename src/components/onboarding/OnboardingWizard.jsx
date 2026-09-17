import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, History, ShieldCheck } from 'lucide-react'
import { prepararCuestionario, respuestasCambiadas } from '../../utils/reevaluacionDiagnostico.js'
import { Card } from '../ui/Card.jsx'
import {
  CAMPOS_CANTIDAD,
  DIMENSIONES,
  OPCIONES_AUTORIZACION,
  calcularDiagnostico,
  normalizarVariables,
} from '../../utils/scoreDiagnostico.js'
import { PREGUNTAS_TFM, preguntasDelBloque } from '../../data/preguntasDiagnostico.js'

/**
 * Campos heterogéneos del bloque 4 (permiso legal, euros, meses y un
 * booleano). No admiten tarjetas cualitativas, así que se definen aquí con
 * el control que les corresponde. Sus `id` coinciden con las columnas de
 * la tabla `diagnosticos`.
 */
const CAMPOS_FINANCIEROS = [
  {
    id: 'p17_autorizacion_espana',
    tipo: 'opciones',
    titulo: '¿Dispones de autorización para trabajar y emprender en España?',
    ayuda: 'Licencias de actividad, permisos sectoriales o situación administrativa legal para operar el negocio en España.',
    opciones: OPCIONES_AUTORIZACION,
  },
  {
    id: 'p18_inversion_total',
    tipo: 'euros',
    titulo: 'Inversión total estimada para arrancar',
    ayuda: 'Todo lo necesario hasta tener el negocio operativo.',
  },
  {
    id: 'p18_recursos_propios',
    tipo: 'euros',
    titulo: 'De esa inversión, ¿cuánto son recursos propios?',
    ayuda: 'Ahorros o aportaciones que no tienes que devolver.',
  },
  {
    id: 'p19_meses_colchon',
    tipo: 'meses',
    titulo: 'Meses de colchón financiero disponibles',
    ayuda: 'Cuánto tiempo puedes sostener gastos sin ingresos suficientes.',
  },
  {
    id: 'p19_meses_breakeven',
    tipo: 'meses',
    titulo: 'Meses estimados hasta el punto de equilibrio',
    ayuda: 'Mes en el que los ingresos igualan los costes y dejas de operar a pérdidas.',
  },
  {
    id: 'p20_incidencias_financieras',
    tipo: 'booleano',
    titulo: '¿Tienes incidencias financieras activas?',
    ayuda: 'Impagos, inclusión en registros de morosidad o embargos.',
  },
]

/**
 * Los 4 pasos del cuestionario. Las preguntas cualitativas vienen del
 * catálogo del TFM (src/data/preguntasDiagnostico.js); el paso 4 añade
 * después los campos financieros y legales.
 */
export const BLOQUES = [
  {
    id: 'validacion_mercado',
    titulo: 'Validación y Mercado',
    descripcion: 'Qué sabes de tu cliente y qué has contrastado con él.',
    preguntas: preguntasDelBloque(1),
  },
  {
    id: 'modelo_competencia',
    titulo: 'Modelo Comercial y Competencia',
    descripcion: 'Cómo ganas dinero y en qué te diferencias.',
    preguntas: preguntasDelBloque(2),
  },
  {
    id: 'operaciones_equipo',
    titulo: 'Operaciones y Equipo',
    descripcion: 'Con qué medios y con quién vas a ejecutarlo.',
    preguntas: preguntasDelBloque(3),
  },
  {
    id: 'solvencia_financiera',
    titulo: 'Viabilidad Financiera y Legal',
    descripcion: 'Con cuánto cuentas y durante cuánto tiempo puedes aguantar.',
    preguntas: [...preguntasDelBloque(4), ...CAMPOS_FINANCIEROS],
  },
]

/** Índices de paso: 0 = consentimiento, 1..4 = bloques, 5 = pantalla final. */
const PASO_CONSENTIMIENTO = 0
const PASO_FINAL = BLOQUES.length + 1

/**
 * Botón primario del wizard (verde corporativo; en gris cuando está
 * deshabilitado). El estado deshabilitado usa gris claro con texto gris
 * oscuro (contraste ~6:1) para que el rótulo se lea también mientras la
 * casilla de consentimiento sigue sin marcar.
 */
function BotonPrimario({ disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#4B5563] disabled:hover:bg-[#E5E7EB]"
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
      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-[#F3F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      style={{ color: '#374151' }}
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </button>
  )
}

/**
 * Colores literales de las pantallas de entrada y de cierre.
 *
 * Se aplican con `style` en lugar de con clases de color (`text-main`,
 * `text-muted`, `bg-canvas`…) porque esos tokens se resuelven a través de
 * tailwind.config.js: si la configuración se regenera o el navegador
 * fuerza un modo oscuro, la clase desaparece o cambia de significado y el
 * texto de las casillas se queda sin contraste. Con valores literales el
 * contraste está garantizado desde el primer render.
 */
const TEXTO_FUERTE = '#1F2937' // Títulos y etiquetas de casilla
const TEXTO_SUAVE = '#4B5563'  // Descripciones (contraste 7:1 sobre blanco)
const BORDE_CAJA = '#E5E7EB'
const FONDO_CAJA = '#FFFFFF'
const VERDE_CORPORATIVO = '#1B4D3E'

/** Enunciado de reserva: la casilla nunca debe quedarse sin texto. */
const TEXTO_CASILLA_POR_DEFECTO =
  'Acepto continuar con el diagnóstico y el tratamiento de mis datos de forma anónima y confidencial.'

/**
 * Estilo del texto de una casilla legal.
 *
 * Es una constante a nivel de módulo, no una expresión dentro del
 * componente: así queda explícito que NO puede derivar de `checked`. El
 * enunciado del consentimiento se lee igual marcado que desmarcado.
 *
 * Tres propiedades, tres vectores de anulación distintos:
 *  - `color`: el propio color del texto.
 *  - `WebkitTextFillColor`: se hereda y, donde está definido, gana sobre
 *    `color` al pintar los glifos. Si un contenedor superior lo dejara en
 *    `transparent` (el truco habitual de los títulos con degradado), el
 *    `color` de este span no bastaría para verse.
 *  - `opacity`: neutraliza cualquier regla heredada que atenúe el bloque.
 *
 * Al ir en línea, sólo una regla `!important` podría sobreescribirlas, y
 * la hoja de estilos compilada no contiene ninguna.
 */
const ESTILO_TEXTO_CASILLA = {
  color: TEXTO_FUERTE,
  WebkitTextFillColor: TEXTO_FUERTE,
  opacity: 1,
}

/**
 * Casilla de verificación con etiqueta larga, alineada arriba.
 *
 * `checked` gobierna únicamente el estado del `<input>`. No interviene en
 * el renderizado ni en el color del enunciado: el texto se pinta siempre,
 * desde el primer render, sin depender de pseudo-clases (`peer-checked`),
 * de transiciones ni de los tokens de color del tema. Si `children`
 * llegara vacío se muestra `TEXTO_CASILLA_POR_DEFECTO`, de modo que la
 * caja no puede aparecer en blanco.
 *
 * `colorScheme: light` en la etiqueta evita que el modo oscuro automático
 * del navegador repinte la caja y el control nativo.
 */
function CasillaLegal({ id, checked, onChange, children }) {
  const texto = children || TEXTO_CASILLA_POR_DEFECTO

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left shadow-sm"
      style={{
        backgroundColor: FONDO_CAJA,
        borderColor: BORDE_CAJA,
        colorScheme: 'light',
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded"
        style={{ accentColor: VERDE_CORPORATIVO, colorScheme: 'light' }}
      />
      <span className="select-none text-sm font-medium leading-relaxed" style={ESTILO_TEXTO_CASILLA}>
        {texto}
      </span>
    </label>
  )
}

/**
 * Caja informativa de las pantallas de entrada y cierre: un rótulo corto
 * y un texto descriptivo, ambos con color literal para que siempre se
 * lean. `descripcion` admite un valor de reserva porque estas cajas se
 * pintan antes de que existan respuestas del cuestionario.
 */
function CajaInformativa({ rotulo, titulo, descripcion, children }) {
  return (
    <div
      className="rounded-xl border p-4 text-left"
      style={{ backgroundColor: '#F9FAFB', borderColor: BORDE_CAJA }}
    >
      {rotulo && (
        <p
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: VERDE_CORPORATIVO }}
        >
          {rotulo}
        </p>
      )}
      <p className="mt-1 text-sm font-bold leading-snug" style={{ color: TEXTO_FUERTE }}>
        {titulo || 'Bloque del cuestionario'}
      </p>
      <p className="mt-1 text-xs leading-relaxed" style={{ color: TEXTO_SUAVE }}>
        {descripcion || 'Sin información adicional.'}
      </p>
      {children}
    </div>
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
 * Opciones cualitativas del TFM como tarjetas seleccionables: etiqueta en
 * negrita y descripción debajo. Son radios reales, navegables con teclado.
 *
 * La selección se identifica por el ÍNDICE de la opción, no por su
 * puntuación: en p1 las cinco opciones valen 4, así que comparar por valor
 * marcaría las cinco a la vez.
 */
function TarjetasOpciones({ idPregunta, opciones, indiceElegido, indiceAnterior = null, onElegir }) {
  return (
    <fieldset className="mt-3">
      <legend className="sr-only">Selecciona la opción que mejor te describe</legend>
      <div className="flex flex-col gap-2">
        {opciones.map((opcion, indice) => {
          const activa = indiceElegido === indice
          return (
            <label
              key={`${idPregunta}-${indice}`}
              htmlFor={`${idPregunta}-${indice}`}
              className="block cursor-pointer"
            >
              <input
                id={`${idPregunta}-${indice}`}
                type="radio"
                name={idPregunta}
                checked={activa}
                onChange={() => onElegir(indice, opcion)}
                className="peer sr-only"
              />
              <span
                className={[
                  'flex flex-col gap-0.5 rounded-xl border p-3 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2',
                  activa
                    ? 'border-primary bg-primary/5'
                    : 'border-card-border bg-surface hover:border-primary/40',
                ].join(' ')}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold leading-snug text-main">{opcion.etiqueta}</span>
                  {/* En una reevaluación se señala la opción elegida la vez
                      anterior, esté o no marcada ahora: así se ve de dónde
                      se parte al cambiarla. */}
                  {indiceAnterior === indice && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                    >
                      <History className="h-3 w-3" aria-hidden="true" />
                      Tu respuesta anterior
                    </span>
                  )}
                </span>
                <span className="text-xs leading-snug text-muted">{opcion.desc}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
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

const formatoEuros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

/**
 * Respuesta anterior en texto, para los campos que no son tarjetas
 * (autorización, cantidades y sí/no). En las tarjetas la anterior se señala
 * sobre la propia opción.
 */
function textoRespuestaAnterior(pregunta, valorAnterior) {
  if (valorAnterior === undefined || valorAnterior === null) return null
  if (pregunta.tipo === 'opciones') {
    return pregunta.opciones.find((o) => o.valor === valorAnterior)?.etiqueta ?? null
  }
  if (pregunta.tipo === 'booleano') return valorAnterior ? 'Sí' : 'No'
  if (pregunta.tipo === 'euros') return formatoEuros.format(Number(valorAnterior))
  if (pregunta.tipo === 'meses') return `${Number(valorAnterior)} ${Number(valorAnterior) === 1 ? 'mes' : 'meses'}`
  return null
}

/**
 * Una pregunta con el control que le corresponda según su tipo.
 *
 * `reevaluacion` (solo al reevaluar) aporta la respuesta anterior y si ha
 * cambiado: la pregunta se marca como "Modificada" en cuanto el usuario la
 * cambia, para que al repasar los bloques vea qué ha actualizado.
 */
function Pregunta({ pregunta, valor, indiceElegido, onCambiar, onElegirOpcion, error, reevaluacion = null }) {
  const anteriorEnTexto = reevaluacion ? textoRespuestaAnterior(pregunta, reevaluacion.valorAnterior) : null

  return (
    <div className="border-b border-card-border pb-5 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug text-main">{pregunta.titulo}</p>
        {reevaluacion?.cambiada && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            Modificada
          </span>
        )}
      </div>
      {pregunta.ayuda && <p className="mt-0.5 text-xs text-muted">{pregunta.ayuda}</p>}

      {/* Preguntas cualitativas del TFM: sin `tipo` y con opciones descritas. */}
      {!pregunta.tipo && pregunta.opciones && (
        <TarjetasOpciones
          idPregunta={pregunta.id}
          opciones={pregunta.opciones}
          indiceElegido={indiceElegido}
          indiceAnterior={reevaluacion?.indiceAnterior ?? null}
          onElegir={onElegirOpcion}
        />
      )}

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

      {anteriorEnTexto && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs" style={{ color: '#92400E' }}>
          <History className="h-3 w-3 shrink-0" aria-hidden="true" />
          Tu respuesta anterior: <span className="font-semibold">{anteriorEnTexto}</span>
        </p>
      )}
    </div>
  )
}

/**
 * Accesos directos a los bloques durante una reevaluación.
 *
 * En un diagnóstico nuevo el recorrido es lineal; al reevaluar, todas las
 * respuestas ya existen y lo natural es ir directo a lo que ha cambiado
 * (validación, modelo, operaciones o tesorería). Cada acceso indica cuántas
 * respuestas se han modificado en ese bloque.
 */
function NavegacionBloques({ pasoActual, cambiosPorBloque, puedeVerResultado, onIr }) {
  return (
    <nav aria-label="Bloques del cuestionario" className="mb-6">
      <ol className="flex flex-wrap gap-2">
        {BLOQUES.map((bloque, indice) => {
          const paso = indice + 1
          const actual = paso === pasoActual
          const cambios = cambiosPorBloque[bloque.id] ?? 0
          return (
            <li key={bloque.id}>
              <button
                type="button"
                onClick={() => onIr(paso)}
                aria-current={actual ? 'step' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  actual ? 'border-primary bg-primary text-white' : 'border-card-border bg-surface text-main hover:border-primary/40'
                }`}
              >
                {paso}. {bloque.titulo}
                {cambios > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-bold ${actual ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}
                  >
                    {cambios}
                    <span className="sr-only"> {cambios === 1 ? 'respuesta modificada' : 'respuestas modificadas'}</span>
                  </span>
                )}
              </button>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            onClick={() => onIr(PASO_FINAL)}
            disabled={!puedeVerResultado}
            aria-current={pasoActual === PASO_FINAL ? 'step' : undefined}
            title={puedeVerResultado ? undefined : 'Corrige los campos marcados antes de ver el resultado'}
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 ${
              pasoActual === PASO_FINAL ? 'border-primary bg-primary text-white' : 'border-card-border bg-surface text-main hover:border-primary/40'
            }`}
          >
            Ver resultado
          </button>
        </li>
      </ol>
    </nav>
  )
}

/**
 * Resultado del diagnóstico mostrado en la pantalla final.
 *
 * Las dos cifras se sanean antes de pintarse: si el score no fuese un
 * número (campo numérico a medio escribir) o la fase llegase vacía, la
 * caja mostraría un hueco en blanco en lugar de un dato. Con los valores
 * de reserva siempre hay algo legible.
 */
function ResumenScore({ score, fase, dimensiones }) {
  const scoreVisible = Number.isFinite(Number(score)) ? Math.round(Number(score)) : 0
  const faseVisible = typeof fase === 'string' && fase.trim() ? fase : 'Idea'

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex items-center justify-center gap-6 rounded-xl border p-4"
        style={{ backgroundColor: '#F9FAFB', borderColor: BORDE_CAJA }}
      >
        <div className="text-center">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: TEXTO_SUAVE }}
          >
            Score
          </p>
          <p className="text-3xl font-extrabold" style={{ color: TEXTO_FUERTE }}>
            {scoreVisible}
          </p>
          <p className="text-[11px]" style={{ color: TEXTO_SUAVE }}>
            sobre 100
          </p>
        </div>
        <div className="h-12 w-px" style={{ backgroundColor: BORDE_CAJA }} />
        <div className="text-center">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: TEXTO_SUAVE }}
          >
            Fase del embudo
          </p>
          <p className="mt-1 text-lg font-bold" style={{ color: VERDE_CORPORATIVO }}>
            {faseVisible}
          </p>
        </div>
      </div>

      {/* Desglose por dimensión: se recorre el catálogo del modelo, no las
          claves del resultado, así que las 4 cajas existen aunque el
          diagnóstico devolviese un objeto incompleto. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {DIMENSIONES.map((dimension) => {
          const bruto = Number(dimensiones?.[dimension.id])
          const valor = Number.isFinite(bruto) ? Math.round(bruto) : 0
          return (
            <div
              key={dimension.id}
              className="rounded-xl border p-3"
              style={{ backgroundColor: FONDO_CAJA, borderColor: BORDE_CAJA }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold leading-snug" style={{ color: TEXTO_FUERTE }}>
                  {dimension.etiqueta}
                </p>
                <p className="text-sm font-extrabold" style={{ color: VERDE_CORPORATIVO }}>
                  {valor}
                </p>
              </div>
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: BORDE_CAJA }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${valor}%`, backgroundColor: VERDE_CORPORATIVO }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Comparación con la evaluación anterior en la pantalla final.
 *
 * Dice cuánto ha variado el score y si cambia la fase, y cuántas respuestas
 * se han modificado. Si no se ha cambiado ninguna lo advierte: guardar
 * registrará igualmente una evaluación con la fecha de hoy.
 */
function ComparacionReevaluacion({ scoreAnterior, faseAnterior, scoreNuevo, faseNueva, cambios }) {
  const diferencia = scoreAnterior !== null ? Math.round(scoreNuevo) - Math.round(scoreAnterior) : null
  const colorDiferencia = diferencia > 0 ? '#047857' : diferencia < 0 ? '#B91C1C' : TEXTO_SUAVE

  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#92400E' }}>
        Frente a tu evaluación anterior
      </p>
      {diferencia !== null && (
        <p className="mt-1 text-sm" style={{ color: TEXTO_FUERTE }}>
          Score <span className="font-bold">{Math.round(scoreAnterior)}</span> →{' '}
          <span className="font-bold">{Math.round(scoreNuevo)}</span>{' '}
          <span className="font-bold" style={{ color: colorDiferencia }}>
            ({diferencia > 0 ? `+${diferencia}` : diferencia === 0 ? 'sin cambios' : diferencia})
          </span>
          {faseAnterior && faseAnterior !== faseNueva && (
            <>
              {' '}· fase <span className="font-bold">{faseAnterior}</span> →{' '}
              <span className="font-bold">{faseNueva}</span>
            </>
          )}
        </p>
      )}
      <p className="mt-1 text-xs" style={{ color: TEXTO_SUAVE }}>
        {cambios > 0
          ? `Has modificado ${cambios} ${cambios === 1 ? 'respuesta' : 'respuestas'}.`
          : 'No has modificado ninguna respuesta: se guardará igualmente una evaluación con la fecha de hoy.'}
      </p>
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
 *     meta: { consentimientoDatos, terminosAceptados, completadoEn, reevaluacion? },
 *   }
 *
 * Reevaluación: con `respuestasPrevias` el cuestionario se abre con las
 * respuestas del último diagnóstico ya marcadas. Cada pregunta señala la
 * respuesta anterior y se marca como "Modificada" al cambiarla; se puede
 * saltar directamente a cualquier bloque, y la pantalla final compara el
 * score nuevo con el anterior. Las casillas legales NO se precargan: el
 * consentimiento tiene que darse de forma expresa en cada envío.
 *
 * @param {{
 *   onComplete: (respuestas: Record<string, unknown>) => void,
 *   respuestasPrevias?: Record<string, unknown>|null,
 *   expedienteAnteriorId?: string|null,
 *   onCancelar?: (() => void)|null,
 * }} props
 */
export default function OnboardingWizard({
  onComplete,
  respuestasPrevias = null,
  expedienteAnteriorId = null,
  onCancelar = null,
}) {
  /** Estado inicial: en blanco o con las respuestas del último diagnóstico. */
  const [inicial] = useState(() => prepararCuestionario(respuestasPrevias))
  const anteriores = inicial.anteriores
  const reevaluando = anteriores !== null

  const [paso, setPaso] = useState(PASO_CONSENTIMIENTO)
  const [consentimientoDatos, setConsentimientoDatos] = useState(false)
  const [terminosAceptados, setTerminosAceptados] = useState(false)
  /** Puntuaciones internas (lo que consumen el score y Supabase). */
  const [valores, setValores] = useState(inicial.valores)

  /**
   * Opción elegida en cada pregunta cualitativa, por índice. Se guarda
   * aparte porque la puntuación no identifica la opción (en p1 todas
   * valen 4) y porque su etiqueta es contexto útil para el agente.
   */
  const [seleccion, setSeleccion] = useState(inicial.seleccion)

  const cambiadas = respuestasCambiadas(anteriores, valores, seleccion)
  const cambiosPorBloque = Object.fromEntries(
    BLOQUES.map((bloque) => [bloque.id, bloque.preguntas.filter((p) => cambiadas.includes(p.id)).length]),
  )

  const bloqueActual = paso > PASO_CONSENTIMIENTO && paso < PASO_FINAL ? BLOQUES[paso - 1] : null

  const irAtras = () => setPaso((actual) => Math.max(PASO_CONSENTIMIENTO, actual - 1))
  const irAdelante = () => setPaso((actual) => Math.min(PASO_FINAL, actual + 1))

  const cambiarValor = (id, valor) => setValores((actuales) => ({ ...actuales, [id]: valor }))

  /** Al elegir una tarjeta se guardan a la vez su índice y su puntuación. */
  const elegirOpcion = (id, indice, opcion) => {
    setSeleccion((actuales) => ({ ...actuales, [id]: indice }))
    cambiarValor(id, opcion.valor)
  }

  /** Etiqueta cualitativa elegida en cada pregunta del TFM. */
  const etiquetasElegidas = () =>
    Object.fromEntries(
      PREGUNTAS_TFM.map((pregunta) => [
        pregunta.id,
        pregunta.opciones[seleccion[pregunta.id]]?.etiqueta ?? null,
      ]),
    )

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
  const hayErrores = Object.keys(errores).length > 0

  /** Salto directo a un bloque (solo en reevaluación). */
  const irAPaso = (destino) => {
    if (destino === PASO_FINAL && hayErrores) return
    setPaso(destino)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
      // Contexto cualitativo para el agente: la puntuación sola no dice
      // qué respondió el usuario (en p1, las 5 opciones valen igual).
      etiquetas: etiquetasElegidas(),
      meta: {
        consentimientoDatos,
        terminosAceptados,
        completadoEn: new Date().toISOString(),
        // Trazabilidad: de qué evaluación parte esta y qué cambió. Cada
        // diagnóstico sigue siendo una fila nueva; esto permite reconstruir
        // la evolución sin comparar filas a ciegas.
        ...(reevaluando && {
          reevaluacion: {
            diagnosticoAnteriorId: expedienteAnteriorId,
            scoreAnterior: anteriores.score,
            faseAnterior: anteriores.fase,
            completadoAnteriorEn: anteriores.completadoEn,
            respuestasCambiadas: cambiadas,
          },
        }),
      },
    }
  }

  // El resultado se calcula en vivo para poder mostrarlo en la pantalla
  // final. Se normaliza antes (igual que en `construirRespuestas`) para que
  // el score que se muestra sea exactamente el que se persiste, aunque los
  // campos numéricos aún contengan el texto crudo del input.
  const resultado = calcularDiagnostico(normalizarVariables(valores))
  const penalizaciones = resultado.penalizaciones ?? []

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Cabecera sobria: solo marca, sin navegación (el Dashboard aún no está visible) */}
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-5">
          {/* Misma identidad que el Dashboard: logotipo sobre fondo claro
              para que el verde corporativo contraste con la cabecera. */}
          <h1 className="inline-flex shrink-0 items-center rounded-lg bg-white px-3 py-1 shadow-sm">
            <img
              src="/logo-pymelaunch.png"
              alt="Pyme Launch"
              className="h-8 w-auto object-contain md:h-9"
            />
          </h1>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            {reevaluando ? 'Reevaluación de proyecto' : 'Evaluación diagnóstica'}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        {/* Sin respuestas previas no hay aviso de reevaluación, pero si se
            llega desde el panel (cliente con proyecto que aún no tiene
            diagnóstico) tiene que poder volver sin completarlo. */}
        {!reevaluando && onCancelar && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={onCancelar}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              style={{ color: VERDE_CORPORATIVO }}
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Volver al panel sin guardar
            </button>
          </div>
        )}

        {/* Aviso sutil de reevaluación: presente en todas las pantallas para
            que quede claro que se parte de las respuestas anteriores. */}
        {reevaluando && (
          <div
            role="note"
            className="mb-6 flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3"
            style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <History className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#92400E' }} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: TEXTO_FUERTE }}>
                  Reevaluación de proyecto
                </p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: TEXTO_SUAVE }}>
                  Modifica solo los aspectos que hayan evolucionado. Partes de tus respuestas anteriores
                  {anteriores.score !== null
                    ? ` (score ${Math.round(anteriores.score)}${anteriores.fase ? `, fase ${anteriores.fase}` : ''})`
                    : ''}
                  .
                  {cambiadas.length > 0 &&
                    ` Llevas ${cambiadas.length} ${cambiadas.length === 1 ? 'respuesta modificada' : 'respuestas modificadas'}.`}
                </p>
              </div>
            </div>
            {onCancelar && (
              <button
                type="button"
                onClick={onCancelar}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                style={{ color: VERDE_CORPORATIVO }}
              >
                Volver al panel sin guardar
              </button>
            )}
          </div>
        )}

        {/* ── Pantalla 0: consentimiento legal y anonimato ───────────────── */}
        {paso === PASO_CONSENTIMIENTO && (
          <Card className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: '#E7EEEB', color: VERDE_CORPORATIVO }}
              >
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-bold" style={{ color: TEXTO_FUERTE }}>
                {reevaluando ? 'Actualiza tu diagnóstico' : 'Antes de empezar'}
              </h2>
              <p className="max-w-md text-sm leading-relaxed" style={{ color: TEXTO_SUAVE }}>
                {reevaluando
                  ? 'Tus respuestas anteriores ya están marcadas. Revisa los bloques donde tu proyecto haya avanzado y cambia solo lo necesario; se guardará como una evaluación nueva y la anterior se conserva.'
                  : 'Evaluación diagnóstica para calibrar la madurez y viabilidad de tu emprendimiento. Son 20 preguntas repartidas en 4 bloques; todas parten de un valor orientativo que puedes ajustar.'}
              </p>
            </div>

            {/* Qué se va a preguntar en cada paso. Se genera a partir de
                BLOQUES, la misma fuente que pinta el cuestionario, así que
                las cajas nunca quedan vacías ni se desincronizan. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BLOQUES.map((bloque, indice) => (
                <CajaInformativa
                  key={bloque.id}
                  rotulo={`Bloque ${indice + 1}`}
                  titulo={bloque.titulo}
                  descripcion={bloque.descripcion}
                >
                  <p className="mt-2 text-[11px] font-semibold" style={{ color: TEXTO_SUAVE }}>
                    {bloque.preguntas.length} preguntas
                  </p>
                </CajaInformativa>
              ))}
            </div>

            <CasillaLegal
              id="consentimiento-datos"
              checked={consentimientoDatos}
              onChange={setConsentimientoDatos}
            >
              Acepto el tratamiento de mis datos de forma anónima y confidencial con fines
              informativos y de diagnóstico.
            </CasillaLegal>

            <div className="flex justify-end">
              <BotonPrimario disabled={!consentimientoDatos} onClick={irAdelante}>
                {reevaluando ? 'Revisar respuestas' : 'Comenzar evaluación'}
                <ArrowRight className="h-4 w-4" />
              </BotonPrimario>
            </div>
          </Card>
        )}

        {/* ── Pasos 1..4: un bloque de variables por pantalla ────────────── */}
        {bloqueActual && (
          <Card className="flex flex-col">
            {reevaluando && (
              <NavegacionBloques
                pasoActual={paso}
                cambiosPorBloque={cambiosPorBloque}
                puedeVerResultado={!hayErrores}
                onIr={irAPaso}
              />
            )}

            <BarraProgreso
              pasoActual={paso}
              totalPasos={BLOQUES.length}
              titulo={bloqueActual.titulo}
            />

            <h2 className="text-xl font-bold leading-snug text-main">{bloqueActual.titulo}</h2>
            <p className="mt-1 text-sm text-muted">{bloqueActual.descripcion}</p>

            <div className="mt-6 space-y-5">
              {bloqueActual.preguntas.map((pregunta) => (
                <Pregunta
                  key={pregunta.id}
                  pregunta={pregunta}
                  valor={valores[pregunta.id]}
                  indiceElegido={seleccion[pregunta.id]}
                  error={errores[pregunta.id]}
                  onCambiar={(valor) => cambiarValor(pregunta.id, valor)}
                  onElegirOpcion={(indice, opcion) => elegirOpcion(pregunta.id, indice, opcion)}
                  reevaluacion={
                    reevaluando
                      ? {
                          cambiada: cambiadas.includes(pregunta.id),
                          indiceAnterior: anteriores.seleccion[pregunta.id] ?? null,
                          valorAnterior: anteriores.valores[pregunta.id],
                        }
                      : null
                  }
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
            {reevaluando && (
              <NavegacionBloques
                pasoActual={paso}
                cambiosPorBloque={cambiosPorBloque}
                puedeVerResultado={!hayErrores}
                onIr={irAPaso}
              />
            )}

            <div className="flex flex-col items-center gap-3 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: '#E3F5EE', color: '#10B981' }}
              >
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-bold" style={{ color: TEXTO_FUERTE }}>
                Tus datos han sido validados con éxito por el sistema
              </h2>
              <p className="max-w-md text-sm leading-relaxed" style={{ color: TEXTO_SUAVE }}>
                {reevaluando
                  ? 'Hemos recalculado tu score con las respuestas actualizadas. Al guardar se registrará como una evaluación nueva y la anterior quedará en tu histórico.'
                  : 'Hemos calculado tu score de viabilidad con las 20 variables del diagnóstico. Es una foto de tu punto de partida, no una calificación definitiva.'}
              </p>
            </div>

            {reevaluando && (
              <ComparacionReevaluacion
                scoreAnterior={anteriores.score}
                faseAnterior={anteriores.fase}
                scoreNuevo={resultado.score_total}
                faseNueva={resultado.fase_embudo}
                cambios={cambiadas.length}
              />
            )}

            <ResumenScore
              score={resultado.score_total}
              fase={resultado.fase_embudo}
              dimensiones={resultado.dimensiones}
            />

            {/* Penalizaciones detectadas. Cuando no hay ninguna la caja
                sigue presente con el texto de reserva: así el usuario ve
                que el bloque se ha evaluado y no un hueco en blanco. */}
            <CajaInformativa
              rotulo="Puntos de atención"
              titulo={
                penalizaciones.length > 0
                  ? `${penalizaciones.length} aspecto${penalizaciones.length > 1 ? 's' : ''} penaliza${penalizaciones.length > 1 ? 'n' : ''} tu score`
                  : 'Sin penalizaciones detectadas'
              }
              descripcion={
                penalizaciones.length > 0
                  ? 'El diagnóstico ha restado puntos por lo siguiente:'
                  : 'Ninguna de tus respuestas activa las penalizaciones del modelo (autorización legal, colchón financiero o incidencias).'
              }
            >
              {penalizaciones.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {penalizaciones.map((penalizacion) => (
                    <li
                      key={penalizacion}
                      className="text-xs font-semibold leading-snug"
                      style={{ color: '#E53E3E' }}
                    >
                      · {penalizacion}
                    </li>
                  ))}
                </ul>
              )}
            </CajaInformativa>

            <CasillaLegal
              id="terminos-servicio"
              checked={terminosAceptados}
              onChange={setTerminosAceptados}
            >
              Confirmo que deseo generar el informe y acceder al panel de control con estos datos.
            </CasillaLegal>

            <div className="flex items-center justify-between">
              <BotonAtras onClick={irAtras}>Revisar respuestas</BotonAtras>

              <BotonPrimario
                disabled={!terminosAceptados}
                onClick={() => onComplete(construirRespuestas())}
              >
                {reevaluando ? 'Guardar y volver al panel' : 'Acceder al Dashboard'}
                <ArrowRight className="h-4 w-4" />
              </BotonPrimario>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
