/**
 * Servicio de persistencia del diagnóstico y del consumo de créditos.
 *
 * Principio de diseño: la persistencia nunca puede romper la experiencia.
 * Si faltan credenciales, no hay red o RLS rechaza la escritura, el
 * Dashboard sigue funcionando y el diagnóstico queda en una cola en
 * memoria para reintentarlo más tarde. Ninguna función lanza excepciones:
 * todas devuelven un resultado describiendo qué pasó.
 *
 * Esquema real del proyecto Supabase (verificado contra la instancia):
 *
 *   diagnosticos: id, user_id, respuestas (jsonb), las 22 columnas de
 *                 variables del modelo TFM (p1…p20), score_total y fase_embudo
 *   perfiles:     id, email, nombre, plan_activo, creditos_consumidos, created_at
 *
 * El JSON se conserva además de las columnas: es el registro íntegro de lo
 * que respondió el usuario (incluidas dimensiones, penalizaciones y
 * consentimientos) y sobrevive a cualquier cambio del modelo de columnas.
 *
 * `diagnosticos` no tiene columna para el visitante anónimo, así que el
 * identificador viaja dentro del propio JSON (`respuestas.meta`). Si más
 * adelante prefieres una columna dedicada:
 *
 *   alter table diagnosticos add column cliente_anonimo text;
 *
 * RLS: el modo demo escribe sin sesión, así que `diagnosticos` necesita una
 * política de INSERT concedida al rol `anon` y con cláusula `with check`
 * (en INSERT, `using` no se evalúa: sin `with check` la fila se rechaza):
 *
 *   create policy "insercion anonima de diagnosticos"
 *     on public.diagnosticos for insert to anon
 *     with check (user_id is null);
 *
 * Mientras esa política no esté activa, la escritura devuelve 42501 y el
 * diagnóstico queda en la cola en memoria. La alternativa más sólida es
 * activar el inicio de sesión anónimo (supabase.auth.signInAnonymously) y
 * exigir `user_id = auth.uid()`.
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'
import { VARIABLES_DIAGNOSTICO, calcularDiagnostico, normalizarVariables } from '../utils/scoreDiagnostico.js'
import { guardarExpedienteId, esDiagnosticoValido } from '../utils/persistenciaDiagnostico.js'
import { parsearRespuestas } from '../utils/citaDiagnostico.js'

const CLAVE_CLIENTE_ANONIMO = 'pyme-launch:cliente-anonimo'

/**
 * Diagnósticos que no se pudieron guardar (sin credenciales, sin red o
 * rechazados por RLS). Se conservan en memoria para reintentarlos.
 * @type {Array<{ respuestas: Record<string, unknown>, intentadoEn: string }>}
 */
const pendientes = []

/**
 * Identificador estable del visitante mientras no haya sesión (modo
 * demo/anónimo). Se guarda en localStorage para que el mismo navegador
 * conserve su identidad entre recargas; si el almacenamiento no está
 * disponible, se genera uno efímero para esta sesión.
 *
 * @returns {string|null}
 */
export function obtenerClienteAnonimo() {
  const nuevoId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`

  try {
    const guardado = localStorage.getItem(CLAVE_CLIENTE_ANONIMO)
    if (guardado) return guardado

    const id = nuevoId()
    localStorage.setItem(CLAVE_CLIENTE_ANONIMO, id)
    return id
  } catch {
    // Navegación privada o almacenamiento bloqueado.
    return nuevoId()
  }
}

/**
 * ¿Este usuario ya completó un diagnóstico?
 *
 * Lo consulta el enrutado tras iniciar sesión: decide si al usuario le toca
 * el cuestionario por primera vez o el panel directamente.
 *
 * Solo se pide el `id` y una fila: basta con saber si existe alguna, y
 * traerse el JSON completo para contar sería tirar ancho de banda.
 *
 * Ante un fallo de red o de permisos devuelve `null` —"no se sabe"—, y no
 * `false`: tratar un error como "no tiene diagnóstico" mandaría a repetir
 * el cuestionario a alguien que ya lo hizo.
 *
 * @param {string|null} userId
 * @returns {Promise<boolean|null>} `null` si no se pudo averiguar.
 */
export async function tieneDiagnosticoPrevio(userId) {
  if (!haySupabase || !userId) return false

  try {
    const { data, error } = await supabase
      .from('diagnosticos')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (error) return null
    return Boolean(data?.length)
  } catch {
    return null
  }
}

/**
 * Filas que se revisan al buscar el último diagnóstico utilizable.
 *
 * No basta con una: si la más reciente tuviera el JSON dañado, quedarse
 * solo con ella llevaría al cuestionario a alguien que sí tiene historial.
 */
const FILAS_HISTORIAL = 5

/**
 * Resultado de buscar el historial de un usuario.
 *
 * @typedef {(
 *   { estado: 'encontrado', id: string, completadoEn: string|null, respuestas: Record<string, unknown> }
 *   | { estado: 'sin-diagnostico' }
 *   | { estado: 'ilegible' }
 *   | { estado: 'error' }
 * )} HistorialDiagnostico
 */

/**
 * Último diagnóstico guardado por este usuario, para decidir a dónde va
 * tras iniciar sesión: al panel si ya tiene uno, al cuestionario si no.
 *
 * Distingue los casos que antes se confundían en un único `null`, porque
 * cada uno lleva a un sitio distinto:
 *   - `encontrado`: tiene diagnóstico → panel con sus datos.
 *   - `sin-diagnostico`: consulta correcta y sin filas → cuestionario.
 *   - `ilegible`: tiene filas pero ninguna con un diagnóstico utilizable.
 *   - `error`: no se pudo consultar (red, permisos).
 *
 * Los dos últimos **no** llevan al cuestionario: tratar un fallo como "no
 * tiene diagnóstico" haría repetirlo a quien ya lo hizo, que es justo lo
 * que no debe pasar.
 *
 * También permite recuperar el panel en un navegador distinto al que
 * respondió el cuestionario, con el `localStorage` vacío.
 *
 * @param {string|null} userId
 * @returns {Promise<HistorialDiagnostico>}
 */
export async function buscarDiagnosticoPrevio(userId) {
  if (!haySupabase || !userId) return { estado: 'sin-diagnostico' }

  try {
    const { data, error } = await supabase
      .from('diagnosticos')
      .select('id, completado_en, respuestas')
      .eq('user_id', userId)
      .order('completado_en', { ascending: false })
      .limit(FILAS_HISTORIAL)

    if (error) return { estado: 'error' }
    if (!data?.length) return { estado: 'sin-diagnostico' }

    for (const fila of data) {
      // `respuestas` llega unas veces como objeto y otras como cadena JSON,
      // según quién escribiera la fila.
      const respuestas = parsearRespuestas(fila.respuestas)
      if (respuestas && esDiagnosticoValido(respuestas)) {
        return { estado: 'encontrado', id: fila.id, completadoEn: fila.completado_en ?? null, respuestas }
      }
    }

    return { estado: 'ilegible' }
  } catch {
    return { estado: 'error' }
  }
}

/** Usuario autenticado actual, o `null` en modo anónimo. */
export async function usuarioActual() {
  if (!supabase) return null
  try {
    const { data } = await supabase.auth.getUser()
    return data?.user ?? null
  } catch {
    return null
  }
}

/**
 * Convierte las respuestas del cuestionario en la fila de `diagnosticos`:
 * el JSON íntegro más las 22 columnas de variables y las dos calculadas
 * (`score_total`, `fase_embudo`).
 *
 * El score se recalcula aquí salvo que venga ya en las respuestas. Así una
 * llamada programática (una migración, una prueba) obtiene el mismo
 * resultado que el wizard sin tener que calcularlo por su cuenta.
 *
 * Se exporta para poder inspeccionar el contrato de la fila sin escribir
 * en la base de datos.
 *
 * @param {Record<string, unknown>} respuestas
 * @param {{ id: string } | null} [usuario]
 * @returns {Record<string, unknown>} Fila lista para insertar.
 */
export function construirFila(respuestas, usuario = null) {
  const variables = normalizarVariables(respuestas)
  const calculado = calcularDiagnostico(variables)

  const columnas = {}
  for (const id of VARIABLES_DIAGNOSTICO) columnas[id] = variables[id]

  // El identificador viaja también dentro del JSON: con sesión es el
  // `user_id` real y sin ella, el cliente anónimo del navegador. Duplicarlo
  // en `meta` no es redundante — es lo que permite correlacionar la fila
  // con las que crea n8n, que solo ven el payload del webhook y no la
  // columna `user_id`.
  const json = {
    ...respuestas,
    meta: {
      ...(respuestas?.meta ?? {}),
      ...(usuario ? { user_id: usuario.id } : { cliente_anonimo: obtenerClienteAnonimo() }),
    },
  }

  return {
    ...columnas,
    respuestas: json,
    user_id: usuario?.id ?? null,
    score_total: respuestas?.score_total ?? calculado.score_total,
    fase_embudo: respuestas?.fase_embudo ?? calculado.fase_embudo,
  }
}

/** Encola un diagnóstico que no se pudo persistir. */
function encolar(respuestas, motivo) {
  pendientes.push({ respuestas, intentadoEn: new Date().toISOString() })
  console.warn(`[Supabase] Diagnóstico no guardado (${motivo}). Queda en memoria para reintentar.`)
  return { ok: false, motivo, pendientes: pendientes.length }
}

/**
 * Guarda el diagnóstico del onboarding en la tabla `diagnosticos`: el JSON
 * completo, las 22 variables del modelo en sus columnas y el `score_total`
 * con su `fase_embudo`.
 *
 * Con sesión activa asocia el `user_id`; sin ella escribe como anónimo con
 * un `cliente_anonimo` estable por navegador (requiere que la política RLS
 * permita insertar al rol `anon`). Si la escritura falla por cualquier
 * motivo, el registro queda en la cola en memoria.
 *
 * @param {Record<string, unknown>} respuestas - Respuestas del OnboardingWizard.
 * @returns {Promise<{ ok: boolean, id?: string, motivo?: string, pendientes?: number }>}
 */
export async function guardarDiagnostico(respuestas) {
  if (!haySupabase) return encolar(respuestas, 'sin credenciales')

  try {
    const usuario = await usuarioActual()
    const fila = construirFila(respuestas, usuario)

    // Se pide la fila de vuelta también en modo anónimo. Antes no se
    // podía: `.select()` genera un INSERT ... RETURNING y leer esa fila se
    // evalúa contra la política de SELECT, que rechazaba al visitante
    // anónimo con un 42501. Con la política pública de lectura activa, el
    // insert ya devuelve su `id`, y ese id es el expediente que permite
    // consultar después el estado de la cita sin rastrear la tabla.
    let { data, error } = await supabase.from('diagnosticos').insert(fila).select('id').single()

    // Si la lectura de vuelta sigue bloqueada en algún entorno, se reintenta
    // sin retorno: perder el id es peor que perder el diagnóstico entero.
    if (error) {
      const reintento = await supabase.from('diagnosticos').insert(fila)
      if (reintento.error) return encolar(respuestas, reintento.error.message)
      data = null
      error = null
    }

    if (data?.id) guardarExpedienteId(data.id)

    return { ok: true, id: data?.id }
  } catch (e) {
    // Fallo de red: fetch rechaza antes de que Supabase devuelva error.
    return encolar(respuestas, e?.message ?? 'error de red')
  }
}

/**
 * Actualiza el consumo de créditos del Agente IA en la tabla `perfiles`.
 * El cupo disponible se deriva del plan (src/utils/planes.js); aquí solo
 * se persiste cuántas consultas se han gastado.
 *
 * @param {string} userId - Identificador del usuario autenticado.
 * @param {number} creditosConsumidos - Total acumulado de consultas gastadas.
 * @returns {Promise<{ ok: boolean, motivo?: string }>}
 */
export async function actualizarConsumoCreditos(userId, creditosConsumidos) {
  if (!haySupabase) return { ok: false, motivo: 'sin credenciales' }
  if (!userId) return { ok: false, motivo: 'sin usuario autenticado' }

  try {
    const { error } = await supabase
      .from('perfiles')
      .update({ creditos_consumidos: creditosConsumidos })
      .eq('id', userId)

    if (error) {
      console.warn(`[Supabase] Consumo de créditos no actualizado: ${error.message}`)
      return { ok: false, motivo: error.message }
    }

    return { ok: true }
  } catch (e) {
    return { ok: false, motivo: e?.message ?? 'error de red' }
  }
}

/** Diagnósticos aún sin persistir (solo lectura, para diagnóstico y reintentos). */
export function diagnosticosPendientes() {
  return [...pendientes]
}

/**
 * Reintenta guardar los diagnósticos encolados. Útil al recuperar la
 * conexión o una vez creadas las tablas en Supabase.
 *
 * @returns {Promise<{ guardados: number, pendientes: number }>}
 */
export async function reintentarPendientes() {
  if (!haySupabase || pendientes.length === 0) {
    return { guardados: 0, pendientes: pendientes.length }
  }

  const cola = pendientes.splice(0, pendientes.length)
  let guardados = 0

  for (const registro of cola) {
    const resultado = await guardarDiagnostico(registro.respuestas)
    if (resultado.ok) guardados += 1
  }

  return { guardados, pendientes: pendientes.length }
}
