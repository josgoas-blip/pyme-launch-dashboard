/**
 * Servicio del equipo de mentoría asignado.
 *
 * Lee de `diagnosticos` los dos mentores del expediente mediante el join
 * incrustado de PostgREST sobre las claves foráneas `mentor_principal_id` y
 * `comentor_id`, que apuntan a la tabla `mentores`.
 *
 * Igual que el resto de servicios del proyecto, nunca lanza: devuelve
 * `null` cuando no hay nada que mostrar, y la tarjeta se queda con su
 * estado "Por asignar" en lugar de romperse.
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'
import { obtenerClienteAnonimo } from './diagnosticoService.js'
import { cargarExpedienteId } from '../utils/persistenciaDiagnostico.js'
import { filaDelVisitante } from '../utils/citaDiagnostico.js'

/**
 * Join incrustado: PostgREST resuelve las dos relaciones por su clave
 * foránea y las devuelve anidadas. Se piden solo los campos que pinta la
 * tarjeta; `email` queda fuera a propósito, porque no se muestra y es un
 * dato de contacto que no hace falta exponer al navegador.
 */
const SELECT_MENTORES = `
  id,
  respuestas,
  mentor_principal:mentor_principal_id (id, nombre, especialidad, avatar_url),
  comentor:comentor_id (id, nombre, especialidad, avatar_url)
`

/** Filas que se revisan cuando no hay expediente guardado. */
const LIMITE_RASTREO = 100

/**
 * Un mentor tal y como lo consume la tarjeta.
 * @typedef {Object} Mentor
 * @property {string} id
 * @property {string} nombre
 * @property {string|null} especialidad
 * @property {string|null} avatarUrl
 */

/**
 * Normaliza el objeto anidado que devuelve el join.
 *
 * PostgREST devuelve `null` cuando la clave foránea está vacía, y en
 * algunas configuraciones un array de un elemento. Se contemplan ambas
 * formas para que la tarjeta no dependa de ese detalle.
 *
 * @param {unknown} crudo
 * @returns {Mentor|null}
 */
export function normalizarMentor(crudo) {
  const dato = Array.isArray(crudo) ? crudo[0] : crudo
  if (typeof dato !== 'object' || dato === null) return null

  // Sin nombre no hay nada que pintar: es preferible "Por asignar" a una
  // tarjeta con la especialidad de alguien sin nombre.
  const nombre = typeof dato.nombre === 'string' ? dato.nombre.trim() : ''
  if (!nombre) return null

  return {
    id: dato.id ?? null,
    nombre,
    especialidad: typeof dato.especialidad === 'string' && dato.especialidad.trim() ? dato.especialidad : null,
    avatarUrl: typeof dato.avatar_url === 'string' && dato.avatar_url.trim() ? dato.avatar_url : null,
  }
}

/** Extrae la pareja de mentores de una fila ya consultada. */
function mentoresDeFila(fila) {
  const principal = normalizarMentor(fila?.mentor_principal)
  const coMentor = normalizarMentor(fila?.comentor)

  // Sin ninguno de los dos, la fila no aporta: así el rastreo sigue
  // buscando en las siguientes en vez de detenerse en una fila vacía.
  if (!principal && !coMentor) return null
  return { principal, coMentor }
}

/**
 * Equipo de mentoría del expediente.
 *
 * Dos caminos, los mismos que usa la lectura de la cita: primero el
 * expediente guardado al crear el diagnóstico y, si ese no tiene mentores,
 * un rastreo acotado de las filas de este visitante.
 *
 * @param {string|null} [expedienteId]
 * @returns {Promise<{ principal: Mentor|null, coMentor: Mentor|null }|null>}
 *   `null` si no hay mentores asignados o no se pudo leer.
 */
export async function leerMentoresRemotos(expedienteId = cargarExpedienteId()) {
  if (!haySupabase) return null

  try {
    if (expedienteId) {
      const { data, error } = await supabase
        .from('diagnosticos')
        .select(SELECT_MENTORES)
        .eq('id', expedienteId)
        .single()

      if (!error && data) {
        const mentores = mentoresDeFila(data)
        if (mentores) return mentores
      }
    }

    const clienteAnonimo = obtenerClienteAnonimo()
    if (!clienteAnonimo) return null

    const { data, error } = await supabase
      .from('diagnosticos')
      .select(SELECT_MENTORES)
      .order('completado_en', { ascending: false })
      .limit(LIMITE_RASTREO)

    if (error || !data?.length) return null

    // Solo filas del propio visitante: sin esta comprobación la tarjeta
    // podría anunciar el mentor asignado a otra persona.
    for (const fila of data) {
      if (!filaDelVisitante(fila, clienteAnonimo)) continue

      const mentores = mentoresDeFila(fila)
      if (mentores) return mentores
    }

    return null
  } catch {
    // Sin red o sin permiso de lectura: la tarjeta muestra "Por asignar".
    return null
  }
}
