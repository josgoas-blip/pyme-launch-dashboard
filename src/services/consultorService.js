/**
 * Carga del expediente en Modo Consultor.
 *
 * El mentor entra por un enlace, sin sesión, así que aquí no se usa ni el
 * cliente anónimo ni el `user_id` del navegador: todo se resuelve con el
 * identificador del expediente que viaja en la URL.
 *
 * El enlace identifica al CLIENTE, no una foto fija: se muestra siempre su
 * diagnóstico más reciente. Un enlace enviado hace días seguía mostrando la
 * evaluación a la que apuntaba (por ejemplo, score 51) aunque el
 * emprendedor la hubiera actualizado después (score 85).
 *
 * Como el resto de servicios, nunca lanza: devuelve un resultado con el
 * motivo, para que la vista pueda distinguir "no existe" de "no se pudo
 * consultar" y decir algo útil en cada caso.
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'
import { filaDelVisitante, identidadesDeFila, parsearRespuestas } from '../utils/citaDiagnostico.js'
import { tokenCoincide } from '../utils/modoConsultor.js'
import {
  COLUMNAS_HIDRATACION,
  elegirDiagnosticoVigente,
  hidratarExpediente,
} from '../utils/hidratacionDiagnostico.js'

/** Columnas del expediente: las de la hidratación más el dueño. */
const COLUMNAS_EXPEDIENTE = `user_id, ${COLUMNAS_HIDRATACION}`

/** Filas recientes que se revisan para encontrar las del mismo cliente. */
const LIMITE_RASTREO = 300

/** Formato de UUID: solo estos identificadores pueden ser un `user_id`. */
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Expediente cargado para el consultor.
 *
 * @typedef {Object} ExpedienteConsultor
 * @property {string} id - Diagnóstico que se muestra (el más reciente).
 * @property {Record<string, unknown>} respuestas - Diagnóstico completo.
 * @property {string} nombreCliente
 * @property {Date|null} completadoEn
 * @property {string|null} clienteUserId - Cuenta del cliente, si se conoce.
 * @property {{ id: string, completadoEn: Date|null }|null} enlaceAnterior -
 *   Si el enlace apuntaba a una evaluación más antigua que la mostrada.
 */

/** Convierte una fecha ISO en `Date`, o `null`. */
function aFecha(valor) {
  const fecha = valor ? new Date(valor) : null
  return fecha && Number.isFinite(fecha.getTime()) ? fecha : null
}

/**
 * Nombre del emprendedor, con la cadena de respaldo habitual.
 *
 * `profiles` es el dato editable del producto; si no hay fila —o no se
 * puede leer— se recurre a lo que quedó en el JSON del expediente, que es
 * lo que n8n copia del payload del webhook.
 */
async function resolverNombreCliente(userId, respuestas, contacto = {}) {
  const delJson = [respuestas?.cliente_nombre, respuestas?.meta?.cliente_nombre, contacto.nombre]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .find(Boolean)

  if (userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('nombre, apellidos, email')
        .eq('id', userId)
        .maybeSingle()

      const completo = [data?.nombre, data?.apellidos]
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean)
        .join(' ')

      if (completo) return completo
      if (data?.email) return data.email
    } catch {
      // Sin perfil legible se sigue con el respaldo del JSON.
    }
  }

  return delJson || respuestas?.cliente_email || contacto.email || 'Cliente sin identificar'
}

/**
 * Busca el diagnóstico más reciente del mismo cliente que la fila del enlace.
 *
 * Identidades que se usan, todas tomadas de filas ligadas al enlace:
 *   - la de la propia fila (`user_id`, `meta.user_id`,
 *     `meta.cliente_anonimo` o, en filas de n8n, `id_usuario`);
 *   - si la fila es una solicitud de sesión de n8n, las del expediente al
 *     que apunta su `expediente_id`.
 *
 * Solo se da ese salto, y no se siguen encadenando identidades a partir de
 * las filas encontradas: un navegador compartido podría unir así a dos
 * personas distintas y enseñar al mentor el diagnóstico de otra.
 *
 * De paso recoge el nombre y el correo que n8n copió en las solicitudes de
 * sesión de ese cliente: sin sesión, el mentor no puede leer `profiles`, y
 * es el único nombre disponible.
 *
 * @param {Record<string, unknown>} filaEnlace
 * @returns {Promise<{ vigente: ReturnType<typeof hidratarExpediente>, contacto: { nombre: string|null, email: string|null } }>}
 */
async function buscarDiagnosticoVigente(filaEnlace) {
  const candidatos = [hidratarExpediente(filaEnlace)]
  const identidades = new Set(identidadesDeFila(filaEnlace))
  const contacto = { nombre: null, email: null }
  const anotarContacto = (fila) => {
    const json = parsearRespuestas(fila?.respuestas)
    const texto = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null)
    contacto.nombre = contacto.nombre ?? texto(json?.cliente_nombre)
    contacto.email = contacto.email ?? texto(json?.cliente_email)
  }
  anotarContacto(filaEnlace)

  // Enlace a una solicitud de sesión de n8n: se incorpora el expediente al
  // que apunta.
  const expedienteReferido = parsearRespuestas(filaEnlace.respuestas)?.expediente_id
  if (typeof expedienteReferido === 'string' && FORMATO_UUID.test(expedienteReferido)) {
    const { data } = await supabase
      .from('diagnosticos')
      .select(COLUMNAS_EXPEDIENTE)
      .eq('id', expedienteReferido)
      .maybeSingle()
    if (data) {
      candidatos.push(hidratarExpediente(data))
      identidadesDeFila(data).forEach((id) => identidades.add(id))
    }
  }

  const idsCuenta = [...identidades].filter((id) => FORMATO_UUID.test(id))

  // 1. Por cuenta: consulta exacta, sin depender de lo reciente que sea.
  for (const userId of idsCuenta) {
    const { data } = await supabase
      .from('diagnosticos')
      .select(COLUMNAS_EXPEDIENTE)
      .eq('user_id', userId)
      .order('completado_en', { ascending: false })
      .limit(5)
    for (const fila of data ?? []) candidatos.push(hidratarExpediente(fila))
  }

  // 2. Por identidad anónima u otras marcas del JSON, que no tienen columna
  //    propia: se revisan las filas recientes. `respuestas` llega unas veces
  //    como objeto y otras como texto, así que el filtro va en el cliente.
  if (identidades.size > 0) {
    const { data } = await supabase
      .from('diagnosticos')
      .select(COLUMNAS_EXPEDIENTE)
      .order('completado_en', { ascending: false })
      .limit(LIMITE_RASTREO)
    for (const fila of data ?? []) {
      if (!filaDelVisitante(fila, ...identidades)) continue
      candidatos.push(hidratarExpediente(fila))
      anotarContacto(fila)
    }
  }

  return { vigente: elegirDiagnosticoVigente(candidatos), contacto }
}

/**
 * Carga el expediente indicado en el enlace de consultoría, en su versión
 * más reciente.
 *
 * @param {string|null} expedienteId
 * @param {string|null} token
 * @returns {Promise<{ ok: true, expediente: ExpedienteConsultor }
 *   | { ok: false, motivo: 'sin-configuracion'|'enlace-invalido'|'no-encontrado'|'token-invalido'|'error-red' }>}
 */
export async function cargarExpedienteConsultor(expedienteId, token) {
  if (!haySupabase) return { ok: false, motivo: 'sin-configuracion' }
  if (!expedienteId) return { ok: false, motivo: 'enlace-invalido' }

  try {
    const { data: filaEnlace, error } = await supabase
      .from('diagnosticos')
      .select(COLUMNAS_EXPEDIENTE)
      .eq('id', expedienteId)
      .maybeSingle()

    // Se distingue el error de la ausencia: "no se pudo consultar" y "no
    // existe" piden mensajes distintos al mentor.
    if (error) return { ok: false, motivo: 'error-red' }
    if (!filaEnlace) return { ok: false, motivo: 'no-encontrado' }

    // `respuestas` llega unas veces como objeto y otras como cadena JSON,
    // según quién escribiera la fila.
    const respuestasEnlace = parsearRespuestas(filaEnlace.respuestas)
    if (!respuestasEnlace) return { ok: false, motivo: 'no-encontrado' }

    // El token se comprueba contra la fila del enlace, que es la que el
    // equipo compartió con el mentor.
    if (!tokenCoincide(respuestasEnlace, token)) return { ok: false, motivo: 'token-invalido' }

    const { vigente, contacto } = await buscarDiagnosticoVigente(filaEnlace)

    // Sin ningún diagnóstico reconocible se muestra la fila del enlace tal
    // cual, como hasta ahora.
    const id = vigente?.expediente.id ?? filaEnlace.id
    const respuestas = vigente?.respuestas ?? respuestasEnlace
    const completadoEn = aFecha(vigente?.expediente.completadoEn ?? filaEnlace.completado_en)

    // Solo cuenta como cuenta del cliente un `user_id` real (columna o
    // `meta.user_id`). El identificador anónimo también tiene formato UUID,
    // pero no es una cuenta: tratarlo como tal buscaría un perfil y un
    // proyecto que no existen.
    const esCuenta = (valor) => (typeof valor === 'string' && FORMATO_UUID.test(valor) ? valor : null)
    const clienteUserId =
      esCuenta(filaEnlace.user_id) ?? esCuenta(respuestasEnlace.meta?.user_id) ?? esCuenta(respuestas?.meta?.user_id)

    return {
      ok: true,
      expediente: {
        id,
        respuestas,
        nombreCliente: await resolverNombreCliente(clienteUserId, respuestasEnlace, contacto),
        completadoEn,
        clienteUserId,
        // Solo cuando el enlace apuntaba a otra evaluación del cuestionario.
        // Si apuntaba a una solicitud de sesión de n8n no hay "versión
        // anterior" que mencionar: esa fila no es un diagnóstico.
        enlaceAnterior:
          id !== filaEnlace.id && hidratarExpediente(filaEnlace)
            ? { id: filaEnlace.id, completadoEn: aFecha(filaEnlace.completado_en) }
            : null,
      },
    }
  } catch {
    return { ok: false, motivo: 'error-red' }
  }
}
