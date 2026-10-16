import DOMPurify from 'dompurify'

/**
 * Sanitización del informe HTML ejecutivo que genera el agente de n8n
 * (columna `informe_html`). Todo HTML de informe debe pasar por aquí antes
 * de llegar a `dangerouslySetInnerHTML`.
 */

const ETIQUETAS_PERMITIDAS = [
  'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span', 'br', 'a',
]

const ATRIBUTOS_PERMITIDOS = [
  'style', 'class', 'href', 'target', 'rel', 'width', 'height', 'alt', 'src',
]

// Instancia propia para que el hook no afecte a otros usos de DOMPurify.
const purificador = DOMPurify()

// Los enlaces que abren pestaña nueva no deben dar acceso a `window.opener`.
purificador.addHook('afterSanitizeAttributes', (nodo) => {
  if (nodo.tagName === 'A' && nodo.getAttribute('target') === '_blank') {
    nodo.setAttribute('rel', 'noopener noreferrer')
  }
})

/**
 * Limpia el HTML de un informe: conserva solo las etiquetas y atributos de
 * maquetación del informe y elimina scripts, manejadores inline (`onclick`,
 * `onerror`…) y URIs `javascript:`.
 *
 * @param {string} rawHtml - HTML tal como llega de Supabase.
 * @returns {string} HTML seguro para insertar en el DOM.
 */
export function sanitizeReportHtml(rawHtml) {
  if (typeof rawHtml !== 'string' || rawHtml === '') return ''
  return purificador.sanitize(rawHtml, {
    ALLOWED_TAGS: ETIQUETAS_PERMITIDAS,
    ALLOWED_ATTR: ATRIBUTOS_PERMITIDOS,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  })
}
