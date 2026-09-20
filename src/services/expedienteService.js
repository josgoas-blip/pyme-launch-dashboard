/**
 * Servicio de la ficha del expediente: consultor asignado y fecha de alta.
 *
 * Ambos datos viven en la misma fila de `diagnosticos`, así que se leen en
 * una sola consulta. El consultor llega por el join incrustado de
 * PostgREST sobre la clave foránea `mentor_principal_id`; la fecha de alta
 * es el `completado_en` de la fila.
 *
 * Igual que el resto de servicios del proyecto, nunca lanza: devuelve
 * `null` cuando no hay nada que mostrar, y la tarjeta se queda con sus
 * valores de reserva en lugar de romperse.
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'
import { obtenerClienteAnonimo, usuarioActual } from './diagnosticoService.js'
import { cargarExpedienteId } from '../utils/persistenciaDiagnostico.js'
import { filaDelVisitante, identidadesDeFila } from '../utils/citaDiagnostico.js'

/**
 * Join incrustado: PostgREST resuelve la relación por su clave foránea y
 * la devuelve anidada. Se piden solo los campos que pinta la tarjeta;
 * `email` queda fuera a propósito, porque no se muestra y es un dato de
 * contacto que no hace falta exponer al navegador.
 */
const SELECT_FICHA = `
  id,
  user_id,
  completado_en,
  respuestas,
  mentor_principal:mentor_principal_id (id, nombre, especialidad, avatar_url)
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
 * Ficha del expediente.
 * @typedef {Object} FichaExpediente
 * @property {Mentor|null} principal - Consultor asignado al expediente.
 * @property {Date|null} altaEn - Fecha de alta (el `completado_en` de la fila).
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

/**
 * Convierte a `Date` la marca temporal de la fila, tolerando los dos
 * nombres de columna habituales.
 *
 * @param {Record<string, unknown>|null} fila
 * @returns {Date|null}
 */
export function fechaDeAlta(fila) {
  const bruto = fila?.completado_en ?? fila?.created_at
  if (!bruto) return null

  const fecha = new Date(bruto)
  return Number.isFinite(fecha.getTime()) ? fecha : null
}

/** Ficha a partir de una fila ya consultada. */
function fichaDeFila(fila) {
  return {
    principal: normalizarMentor(fila?.mentor_principal),
    altaEn: fechaDeAlta(fila),
  }
}

/**
 * Ficha con el alta que ya se conozca, pero sin consultor.
 *
 * Es el resultado cuando el expediente se pudo leer y la búsqueda del
 * consultor no encontró ninguno: se devuelve igualmente para no perder la
 * fecha de alta, que es un dato válido por sí solo.
 *
 * @param {Date|null} alta
 * @returns {FichaExpediente|null}
 */
function fichaSoloAlta(alta) {
  return alta ? { principal: null, altaEn: alta } : null
}

/**
 * Ficha del expediente de este visitante.
 *
 * Dos caminos, los mismos que usa la lectura de la cita: primero el
 * expediente guardado al crear el diagnóstico y, si en él no consta el
 * consultor, un rastreo acotado de las demás filas de este cliente.
 *
 * El rastreo no es un respaldo excepcional, es el camino habitual: n8n no
 * actualiza el expediente, crea una fila nueva al agendar la sesión, y es
 * ahí donde escribe la asignación. Consultar solo el expediente dejaba la
 * ficha en "Por asignar" incluso con el consultor ya asignado.
 *
 * En el rastreo, el alta es la del expediente —o, sin él, la fila **más
 * antigua** del cliente— y el consultor, el de la primera fila que lo
 * tenga asignado. Suelen ser filas distintas.
 *
 * @param {string|null} [expedienteId]
 * @returns {Promise<FichaExpediente|null>} `null` si no se pudo leer nada.
 */
export async function leerFichaExpediente(expedienteId = cargarExpedienteId()) {
  if (!haySupabase) return null

  try {
    /**
     * Alta tomada del expediente, si se pudo leer.
     *
     * Se guarda aparte porque la consulta al expediente ya no cierra la
     * función: sirve para el alta, pero no basta para el consultor.
     */
    let altaDelExpediente = null

    /**
     * Identidades con las que reconocer las demás filas de este cliente.
     *
     * Se siembra con las del propio expediente y no solo con las del
     * navegador: en Modo Consultor el `localStorage` es el del mentor, y
     * sin las del expediente el rastreo no encontraría nada.
     */
    const identidades = new Set()

    // 1. El expediente es la fila del propio diagnóstico: su fecha es el
    //    alta. El consultor, en cambio, rara vez está ahí: n8n no
    //    actualiza el expediente, crea una fila nueva al agendar la sesión
    //    y es en esa fila donde escribe `mentor_principal_id`. Por eso
    //    solo se devuelve aquí si el consultor ya consta; si no, se
    //    conserva el alta y se sigue buscándolo. Sin esto la tarjeta se
    //    quedaba en "Por asignar" para siempre, aunque el consultor
    //    estuviera asignado en la fila de la cita.
    if (expedienteId) {
      const { data, error } = await supabase
        .from('diagnosticos')
        .select(SELECT_FICHA)
        .eq('id', expedienteId)
        .single()

      if (!error && data) {
        const ficha = fichaDeFila(data)
        if (ficha.principal) return ficha
        altaDelExpediente = ficha.altaEn
        identidadesDeFila(data).forEach((id) => identidades.add(id))
      }
    }

    // La identidad del navegador solo se añade si el expediente no dio
    // ninguna. Sumarla siempre sería un fallo de aislamiento en Modo
    // Consultor: el `localStorage` es el del mentor, y sus propias filas
    // acabarían pasando el filtro y pintando *sus* mentores en la ficha
    // del cliente que está revisando.
    if (identidades.size === 0) {
      // Se aceptan las dos identidades: la fila puede ser anterior al registro.
      const clienteAnonimo = obtenerClienteAnonimo()
      const usuario = await usuarioActual()
      if (clienteAnonimo) identidades.add(clienteAnonimo)
      if (usuario?.id) identidades.add(usuario.id)
    }

    if (identidades.size === 0) return fichaSoloAlta(altaDelExpediente)

    const { data, error } = await supabase
      .from('diagnosticos')
      .select(SELECT_FICHA)
      .order('completado_en', { ascending: false })
      .limit(LIMITE_RASTREO)

    if (error || !data?.length) return fichaSoloAlta(altaDelExpediente)

    // Solo filas del propio visitante: sin esta comprobación la tarjeta
    // podría anunciar el consultor o el alta de otra persona.
    const propias = data.filter((fila) => filaDelVisitante(fila, ...identidades))
    if (propias.length === 0) return fichaSoloAlta(altaDelExpediente)

    const conConsultor = propias.find((fila) => fila.mentor_principal)
    // Vienen ordenadas de más reciente a más antigua: la última es el alta.
    const masAntigua = propias[propias.length - 1]

    return {
      ...fichaDeFila(conConsultor ?? masAntigua),
      // El alta del expediente manda: es la fila del diagnóstico real, y
      // el rastreo puede haber traído filas que n8n creó después.
      altaEn: altaDelExpediente ?? fechaDeAlta(masAntigua),
    }
  } catch {
    // Sin red o sin permiso de lectura: la tarjeta usa sus reservas.
    return null
  }
}
