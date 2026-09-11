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

/** Usuario autenticado actual, o `null` en modo anónimo. */
async function usuarioActual() {
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

  // Sin columna para el visitante anónimo, el identificador viaja dentro
  // del propio JSON para no perder la trazabilidad del registro.
  const json = usuario
    ? respuestas
    : {
        ...respuestas,
        meta: { ...(respuestas?.meta ?? {}), cliente_anonimo: obtenerClienteAnonimo() },
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

    // Con sesión se pide la fila de vuelta; en modo anónimo NO. Un insert
    // con `.select()` genera un INSERT ... RETURNING, y leer esa fila se
    // evalúa contra la política de SELECT: como el visitante anónimo no
    // puede verla, PostgreSQL devuelve 42501 aunque la escritura sea
    // legítima. Sin retorno, la inserción se completa con 201.
    const consulta = supabase.from('diagnosticos').insert(fila)

    const { data, error } = usuario ? await consulta.select('id').single() : await consulta

    if (error) return encolar(respuestas, error.message)

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
