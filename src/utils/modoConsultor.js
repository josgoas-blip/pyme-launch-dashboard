/**
 * Detección del Modo Consultor a partir de la URL.
 *
 * Admite las dos formas del enlace que reparte el equipo de mentoría:
 *   - Query:  /?modo=consultor&expediente=<id>&token=<token>
 *   - Ruta:   /consultor/<id>?token=<token>
 *
 * Módulo puro: no toca la red ni React, para poder comprobarlo sin montar
 * la aplicación.
 *
 * AVISO DE SEGURIDAD: el `token` que viaja aquí no es una credencial. Se
 * compara en el navegador, y cualquiera puede leer o alterar el código que
 * hace la comparación. Hoy, además, la tabla `diagnosticos` tiene una
 * política pública de SELECT, así que el dato ya es legible por quien tenga
 * la clave anónima. La comprobación del token sirve para que un enlace
 * caducado o mal copiado falle de forma clara, no para impedir el acceso a
 * quien se lo proponga. Ver la nota del final del módulo.
 */

/** Valor de `modo` que activa la vista de solo lectura. */
const MODO_CONSULTOR = 'consultor'

/** Formato de un identificador de expediente (UUID de Postgres). */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Parámetros del Modo Consultor presentes en una URL.
 *
 * @typedef {Object} ParametrosConsultor
 * @property {boolean} activo - ¿La URL pide el modo consultor?
 * @property {string|null} expedienteId
 * @property {string|null} token
 */

/**
 * Lee los parámetros del Modo Consultor.
 *
 * Se exige que el identificador tenga forma de UUID: un enlace con un
 * expediente mal copiado debe fallar aquí y mostrar el aviso, en vez de
 * salir a la red a buscar una fila que no puede existir.
 *
 * @param {string} [href] - URL completa; por defecto, la de la ventana.
 * @returns {ParametrosConsultor}
 */
export function leerParametrosConsultor(href = typeof window !== 'undefined' ? window.location.href : '') {
  const vacio = { activo: false, expedienteId: null, token: null }
  if (!href) return vacio

  let url
  try {
    url = new URL(href)
  } catch {
    return vacio
  }

  const params = url.searchParams
  const token = params.get('token')?.trim() || null

  // Forma de ruta: /consultor/<id>
  const porRuta = url.pathname.match(/\/consultor\/([^/?#]+)/i)
  if (porRuta) {
    const id = decodeURIComponent(porRuta[1]).trim()
    return { activo: true, expedienteId: UUID.test(id) ? id : null, token }
  }

  // Forma de query: ?modo=consultor&expediente=<id>
  if (params.get('modo')?.trim().toLowerCase() !== MODO_CONSULTOR) return vacio

  const id = params.get('expediente')?.trim() ?? ''
  return { activo: true, expedienteId: UUID.test(id) ? id : null, token }
}

/**
 * ¿El token del enlace corresponde al del expediente?
 *
 * Si el expediente no declara ninguno, se acepta: hoy nada lo escribe, y
 * rechazar todos los enlaces dejaría la función inservible. En cuanto n8n
 * (o quien genere los enlaces) empiece a estampar `meta.token_consultor`,
 * los enlaces antiguos o manipulados dejarán de abrir sin tocar este
 * código.
 *
 * @param {Record<string, unknown>|null} respuestas - JSON del expediente.
 * @param {string|null} token - Token recibido en la URL.
 * @returns {boolean}
 */
export function tokenCoincide(respuestas, token) {
  const esperado = respuestas?.meta?.token_consultor ?? respuestas?.token_consultor ?? null

  if (typeof esperado !== 'string' || !esperado.trim()) return true
  return typeof token === 'string' && token.trim() === esperado.trim()
}

/*
 * Cómo convertir esto en un control real, cuando toque:
 *
 *   1. Guardar el token en la fila (columna `token_consultor` o dentro de
 *      `respuestas.meta`), con su fecha de caducidad.
 *   2. Sustituir la política pública de SELECT por una que exija el token:
 *
 *      create policy "lectura por token de consultor"
 *        on public.diagnosticos for select to anon
 *        using (respuestas->>'token_consultor'
 *               = current_setting('request.headers', true)::json->>'x-token-consultor');
 *
 *      y enviar el token en una cabecera, no en la URL: las URLs quedan en
 *      el historial, en los registros del servidor y en el `Referer`.
 *   3. Alternativa más sólida: que el mentor inicie sesión y una política
 *      compruebe que el expediente le está asignado en `mentores`.
 */
