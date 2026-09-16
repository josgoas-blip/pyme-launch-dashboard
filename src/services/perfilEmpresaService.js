/**
 * Ficha identificativa del emprendedor: datos personales y de su empresa.
 *
 * La fuente es la tabla `profiles`, una fila por usuario de Supabase Auth
 * (`profiles.id` = `auth.users.id`). La tabla `diagnosticos` no guarda
 * razón social ni NIF, así que antes la tarjeta pintaba los datos fijos
 * de una empresa de ejemplo a cualquier usuario. Aquí no hay mock:
 * lo que no consta se muestra como no registrado.
 *
 * Igual que el resto de servicios del proyecto, nunca lanza: las lecturas
 * devuelven `null` y la escritura devuelve `{ ok, motivo }`.
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'
import { identidadesDeFila, filaDelVisitante, parsearRespuestas } from '../utils/citaDiagnostico.js'

/** Columnas de `profiles` que consume la ficha. */
const COLUMNAS_PERFIL = 'id, email, nombre, apellidos, nombre_empresa, actividad, sector, nif, tamano_empresa'

/** Columnas que el emprendedor puede editar desde la tarjeta. */
export const CAMPOS_EDITABLES = ['nombre_empresa', 'actividad', 'sector', 'nif', 'tamano_empresa']

/**
 * Textos que se muestran cuando un dato no consta.
 *
 * Son avisos, no valores: la tarjeta los pinta en gris para que no se
 * confundan con un dato real, y nunca se guardan en la base de datos.
 */
export const RESERVAS_FICHA = {
  empresa: 'Mi Empresa (Sin registrar)',
  actividad: 'Definir actividad de negocio',
  sector: 'General',
  nif: 'No especificado',
  tamano: '1-5 empleados',
}

/** Tramos de plantilla del desplegable de tamaño. */
export const TAMANOS_EMPRESA = [
  '1-5 empleados',
  '6-10 empleados',
  '11-50 empleados',
  '51-250 empleados',
  'Más de 250 empleados',
]

/** Sugerencias del campo de sector; se admite cualquier otro texto. */
export const SECTORES_SUGERIDOS = [
  'General',
  'Comercio',
  'Hostelería y turismo',
  'Industria',
  'Construcción',
  'Servicios profesionales',
  'Tecnología',
  'Salud y bienestar',
  'Educación y formación',
  'Agroalimentario',
  'Logística y transporte',
]

/** Longitud máxima por campo, para no aceptar pegados accidentales enormes. */
const LONGITUD_MAXIMA = {
  nombre_empresa: 120,
  actividad: 280,
  sector: 80,
  nif: 20,
  tamano_empresa: 40,
}

/** Nombre legible de cada campo, para los mensajes de error. */
const ETIQUETA_CAMPO = {
  nombre_empresa: 'Empresa',
  actividad: 'Actividad',
  sector: 'Sector',
  nif: 'NIF / CIF',
  tamano_empresa: 'Tamaño',
}

/** Cadena recortada, o `''` si no es texto. */
function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

/**
 * Ficha ya resuelta, lista para pintar.
 *
 * Cada campo de empresa lleva su bandera `…Registrado`: la vista la usa
 * para distinguir un dato real de un texto de reserva.
 *
 * @typedef {Object} FichaEmpresa
 * @property {string} nombreCompleto
 * @property {string|null} email
 * @property {string} empresa
 * @property {boolean} empresaRegistrada
 * @property {string} actividad
 * @property {boolean} actividadRegistrada
 * @property {string} sector
 * @property {boolean} sectorRegistrado
 * @property {string} nif
 * @property {boolean} nifRegistrado
 * @property {string} tamano
 * @property {boolean} tamanoRegistrado
 */

/**
 * Compone la ficha a partir del perfil y del usuario de la sesión.
 *
 * Es pura: no toca red ni almacenamiento, así que la vista del cliente y
 * la del consultor comparten exactamente las mismas reglas de reserva.
 *
 * El nombre sigue la cadena perfil → metadatos del registro → correo. Los
 * metadatos no son un mock: son el nombre que el usuario escribió al
 * registrarse, y cubren el caso de que su fila de `profiles` aún no exista.
 *
 * @param {{
 *   perfil?: Record<string, unknown>|null,
 *   usuario?: { email?: string|null, user_metadata?: Record<string, unknown> }|null,
 *   respaldo?: { nombre?: string|null, email?: string|null },
 * }} fuentes
 * @returns {FichaEmpresa}
 */
export function componerFichaEmpresa({ perfil = null, usuario = null, respaldo = {} } = {}) {
  const meta = usuario?.user_metadata ?? {}

  const nombreDe = (nombre, apellidos) => [texto(nombre), texto(apellidos)].filter(Boolean).join(' ')

  const email = texto(usuario?.email) || texto(perfil?.email) || texto(respaldo?.email) || null

  const nombreCompleto =
    nombreDe(perfil?.nombre, perfil?.apellidos) ||
    nombreDe(meta.nombre, meta.apellidos) ||
    texto(respaldo?.nombre) ||
    email ||
    'Sin nombre registrado'

  const campo = (valor, reserva) => {
    const limpio = texto(valor)
    return [limpio || reserva, Boolean(limpio)]
  }

  const [empresa, empresaRegistrada] = campo(perfil?.nombre_empresa, RESERVAS_FICHA.empresa)
  const [actividad, actividadRegistrada] = campo(perfil?.actividad, RESERVAS_FICHA.actividad)
  const [sector, sectorRegistrado] = campo(perfil?.sector, RESERVAS_FICHA.sector)
  const [nif, nifRegistrado] = campo(perfil?.nif, RESERVAS_FICHA.nif)
  const [tamano, tamanoRegistrado] = campo(perfil?.tamano_empresa, RESERVAS_FICHA.tamano)

  return {
    nombreCompleto,
    email,
    empresa,
    empresaRegistrada,
    actividad,
    actividadRegistrada,
    sector,
    sectorRegistrado,
    nif,
    nifRegistrado,
    tamano,
    tamanoRegistrado,
  }
}

/**
 * Limpia los cambios del formulario antes de escribirlos.
 *
 * Solo pasan los campos editables —así un formulario manipulado no puede
 * escribir `id` o `email`—, se recortan espacios, el NIF va en mayúsculas
 * y sin espacios intermedios, y un campo vacío se guarda como `null`: un
 * texto vacío en la base de datos se leería como "registrado" en otro
 * cliente que no recortara.
 *
 * @param {Record<string, unknown>} cambios
 * @returns {{ ok: true, datos: Record<string, string|null> } | { ok: false, motivo: string }}
 */
export function normalizarCambiosPerfil(cambios) {
  const datos = {}

  for (const campo of CAMPOS_EDITABLES) {
    if (!cambios || !(campo in cambios)) continue

    let valor = texto(cambios[campo])
    if (campo === 'nif') valor = valor.replace(/\s+/g, '').toUpperCase()

    if (valor.length > LONGITUD_MAXIMA[campo]) {
      return {
        ok: false,
        motivo: `El campo ${ETIQUETA_CAMPO[campo]} admite como máximo ${LONGITUD_MAXIMA[campo]} caracteres.`,
      }
    }

    datos[campo] = valor || null
  }

  if (Object.keys(datos).length === 0) return { ok: false, motivo: 'No hay cambios que guardar.' }
  return { ok: true, datos }
}

/**
 * Perfil completo de un usuario.
 *
 * @param {string|null} userId
 * @returns {Promise<Record<string, unknown>|null>} `null` si no hay fila o no se pudo leer.
 */
export async function leerPerfilEmpresa(userId) {
  if (!haySupabase || !userId) return null

  try {
    const { data, error } = await supabase.from('profiles').select(COLUMNAS_PERFIL).eq('id', userId).maybeSingle()
    if (error || !data) return null
    return data
  } catch {
    return null
  }
}

/**
 * Guarda los datos de empresa del usuario autenticado.
 *
 * Se pide la fila de vuelta con `.select()` porque un `update` que no
 * encuentra fila —el perfil aún no existe, o RLS no deja verlo— no da
 * error: devuelve éxito sin haber escrito nada. Sin esta comprobación la
 * tarjeta anunciaría "guardado" y el dato desaparecería al recargar.
 *
 * @param {string|null} userId
 * @param {Record<string, unknown>} cambios
 * @returns {Promise<{ ok: true, perfil: Record<string, unknown> } | { ok: false, motivo: string }>}
 */
export async function guardarPerfilEmpresa(userId, cambios) {
  if (!haySupabase) return { ok: false, motivo: 'La base de datos no está configurada en esta instalación.' }
  if (!userId) return { ok: false, motivo: 'Necesitas iniciar sesión para guardar tu ficha.' }

  const limpios = normalizarCambiosPerfil(cambios)
  if (!limpios.ok) return limpios

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(limpios.datos)
      .eq('id', userId)
      .select(COLUMNAS_PERFIL)

    if (error) return { ok: false, motivo: 'No se ha podido guardar la ficha. Inténtalo de nuevo en unos minutos.' }

    if (!data?.length) {
      return {
        ok: false,
        motivo:
          'Tu perfil todavía no está dado de alta en la base de datos, así que no se ha guardado nada. Avisa al equipo de soporte.',
      }
    }

    return { ok: true, perfil: data[0] }
  } catch {
    return { ok: false, motivo: 'Sin conexión: no se ha podido guardar la ficha.' }
  }
}

/** Filas que se revisan para completar el contacto de un expediente. */
const LIMITE_RASTREO = 100

/** Nombre y correo que n8n copia del payload del webhook. */
function contactoDeRespuestas(respuestas) {
  return {
    nombre: texto(respuestas?.cliente_nombre) || texto(respuestas?.meta?.cliente_nombre) || null,
    email: texto(respuestas?.cliente_email) || null,
  }
}

/**
 * Datos del emprendedor asociados a un expediente (Modo Consultor).
 *
 * Todo sale del expediente del enlace, nunca de la sesión del navegador:
 * quien mira es el mentor, y su sesión o su `localStorage` no dicen nada
 * del cliente.
 *
 *   1. Si el expediente lleva `user_id`, se lee ese perfil.
 *   2. El nombre y el correo de respaldo salen del propio expediente o de
 *      las filas que n8n creó para ese mismo cliente, reconocidas por la
 *      identidad estampada en el expediente.
 *
 * @param {string|null} expedienteId
 * @returns {Promise<{ perfil: Record<string, unknown>|null, respaldo: { nombre: string|null, email: string|null } }|null>}
 */
export async function leerPerfilDeExpediente(expedienteId) {
  if (!haySupabase || !expedienteId) return null

  try {
    const { data: fila, error } = await supabase
      .from('diagnosticos')
      .select('id, user_id, respuestas')
      .eq('id', expedienteId)
      .maybeSingle()

    if (error || !fila) return null

    const perfil = fila.user_id ? await leerPerfilEmpresa(fila.user_id) : null
    const respaldo = contactoDeRespuestas(parsearRespuestas(fila.respuestas))

    const identidades = identidadesDeFila(fila)
    if ((!respaldo.nombre || !respaldo.email) && identidades.length > 0) {
      const { data: filas } = await supabase
        .from('diagnosticos')
        .select('id, user_id, respuestas')
        .order('completado_en', { ascending: false })
        .limit(LIMITE_RASTREO)

      for (const otra of filas ?? []) {
        if (!filaDelVisitante(otra, ...identidades)) continue
        const contacto = contactoDeRespuestas(parsearRespuestas(otra.respuestas))
        respaldo.nombre = respaldo.nombre || contacto.nombre
        respaldo.email = respaldo.email || contacto.email
        if (respaldo.nombre && respaldo.email) break
      }
    }

    return { perfil, respaldo }
  } catch {
    return null
  }
}
