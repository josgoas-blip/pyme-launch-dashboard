/**
 * Servicio de la ficha del expediente: equipo de mentoría y fecha de alta.
 *
 * Ambos datos viven en la misma fila de `diagnosticos`, así que se leen en
 * una sola consulta. Los mentores llegan por el join incrustado de
 * PostgREST sobre las claves foráneas `mentor_principal_id` y
 * `comentor_id`; la fecha de alta es el `completado_en` de la fila.
 *
 * Igual que el resto de servicios del proyecto, nunca lanza: devuelve
 * `null` cuando no hay nada que mostrar, y la tarjeta se queda con sus
 * valores de reserva en lugar de romperse.
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'
import { obtenerClienteAnonimo, usuarioActual } from './diagnosticoService.js'
import { cargarExpedienteId } from '../utils/persistenciaDiagnostico.js'
import { filaDelVisitante } from '../utils/citaDiagnostico.js'

/**
 * Join incrustado: PostgREST resuelve las dos relaciones por su clave
 * foránea y las devuelve anidadas. Se piden solo los campos que pinta la
 * tarjeta; `email` queda fuera a propósito, porque no se muestra y es un
 * dato de contacto que no hace falta exponer al navegador.
 */
const SELECT_FICHA = `
  id,
  user_id,
  completado_en,
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
 * Ficha del expediente.
 * @typedef {Object} FichaExpediente
 * @property {Mentor|null} principal
 * @property {Mentor|null} coMentor
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
    coMentor: normalizarMentor(fila?.comentor),
    altaEn: fechaDeAlta(fila),
  }
}

/**
 * Ficha del expediente de este visitante.
 *
 * Dos caminos, los mismos que usa la lectura de la cita: primero el
 * expediente guardado al crear el diagnóstico y, si no lo hay, un rastreo
 * acotado de las filas de este visitante.
 *
 * En el rastreo, el alta es la fila **más antigua** del visitante —que es
 * cuando se dio de alta— y los mentores, los de la primera fila que los
 * tenga asignados. Pueden ser filas distintas: n8n crea filas nuevas al
 * agendar, así que la más reciente no tiene por qué ser la del alta.
 *
 * @param {string|null} [expedienteId]
 * @returns {Promise<FichaExpediente|null>} `null` si no se pudo leer nada.
 */
export async function leerFichaExpediente(expedienteId = cargarExpedienteId()) {
  if (!haySupabase) return null

  try {
    // 1. El expediente es la fila del propio diagnóstico: su fecha es el
    //    alta, tenga o no mentores asignados todavía.
    if (expedienteId) {
      const { data, error } = await supabase
        .from('diagnosticos')
        .select(SELECT_FICHA)
        .eq('id', expedienteId)
        .single()

      if (!error && data) return fichaDeFila(data)
    }

    // Se aceptan las dos identidades: la fila puede ser anterior al registro.
    const clienteAnonimo = obtenerClienteAnonimo()
    const usuario = await usuarioActual()
    if (!clienteAnonimo && !usuario?.id) return null

    const { data, error } = await supabase
      .from('diagnosticos')
      .select(SELECT_FICHA)
      .order('completado_en', { ascending: false })
      .limit(LIMITE_RASTREO)

    if (error || !data?.length) return null

    // Solo filas del propio visitante: sin esta comprobación la tarjeta
    // podría anunciar el mentor o el alta de otra persona.
    const propias = data.filter((fila) => filaDelVisitante(fila, clienteAnonimo, usuario?.id))
    if (propias.length === 0) return null

    const conMentores = propias.find((fila) => fila.mentor_principal || fila.comentor)
    // Vienen ordenadas de más reciente a más antigua: la última es el alta.
    const masAntigua = propias[propias.length - 1]

    return {
      ...fichaDeFila(conMentores ?? masAntigua),
      altaEn: fechaDeAlta(masAntigua),
    }
  } catch {
    // Sin red o sin permiso de lectura: la tarjeta usa sus reservas.
    return null
  }
}
