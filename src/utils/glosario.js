/**
 * Glosario de la jerga técnica del Dashboard.
 *
 * Vive en un único sitio para que la redacción sea consistente: el mismo
 * término explicado de dos maneras distintas en dos pestañas confunde más
 * que no explicarlo. Las claves coinciden con los `id` de los datos que
 * consumen los cuadrantes, de modo que un cuadrante puede preguntar
 * `GLOSARIO[item.id]` y renderizar la pista solo si existe entrada.
 *
 * Criterio de inclusión: solo entra lo que un emprendedor sin formación
 * financiera no puede deducir del propio nombre. "Ingresos", "Inversión" o
 * "Clientes cerrados" se leen solos y añadirles un icono sería ruido, así
 * que no están aquí a propósito.
 *
 * Cada texto explica el término en una frase, sin remitir a otro término
 * del glosario: una definición que obliga a buscar otra definición no
 * resuelve nada.
 */
export const GLOSARIO = {
  // ── Análisis · métricas de mercado ──────────────────────────────────
  tam: 'Mercado Total Disponible. El tamaño máximo de tu mercado si capturaras el 100 % de él.',
  sam: 'Mercado Disponible Servible. La parte del total a la que puedes llegar de verdad con tu producto y tu zona.',
  som: 'Mercado Obtenible Servible. Lo que puedes aspirar a conseguir a corto plazo con los medios que tienes.',
  ltv: 'Valor de vida del cliente. Lo que ingresas por un cliente durante todo el tiempo que se queda contigo.',

  // ── Análisis · benchmark sectorial ──────────────────────────────────
  cac: 'Coste de Adquisición de Cliente. Cuánto te cuesta en marketing y ventas conseguir un cliente nuevo.',
  churn: 'Tasa de cancelación. Porcentaje de clientes que te abandonan en un periodo.',
  nps: 'Net Promoter Score. Mide, de -100 a 100, cuántos clientes te recomendarían frente a los que no.',

  // ── Estrategia ──────────────────────────────────────────────────────
  came: 'Corregir, Afrontar, Mantener y Explotar. Ordena las iniciativas según lo que aportan frente a lo que cuestan.',
  funnel: 'Embudo de conversión. El recorrido desde que alguien te descubre hasta que te compra, y cuánta gente se queda en cada paso.',
  nutricion:
    'También llamado nurturing: la fase en la que alguien ya te conoce y trabajas su interés hasta que está listo para comprar.',
  'leads-cualificados':
    'Contactos que han mostrado interés real y encajan con tu cliente objetivo, no simples visitas.',
  'cac-real':
    'Coste de Adquisición de Cliente. Cuánto te cuesta en marketing y ventas conseguir un cliente nuevo.',
  'ltv-cac':
    'Cuántas veces cubre el valor de un cliente lo que te costó conseguirlo. Por debajo de 3 veces, crecer suele destruir caja.',
  upsell: 'Venta adicional a un cliente que ya te compró, para elevar el importe medio de cada venta.',

  // ── Inicio · métricas operativas ────────────────────────────────────
  // "Conversión de presupuestos" no entra: se entiende por su nombre.
  'runway-personal':
    'Cuántos meses podrías pagar tus gastos personales con tus ahorros si el negocio dejara de darte ingresos.',
  'dias-cobro':
    'Tiempo medio que pasa desde que emites una factura hasta que el cliente te la paga.',
  'utilizacion-capacidad':
    'Parte de tus horas disponibles que ya está ocupada con trabajo facturable.',
  'concentracion-cliente':
    'Porcentaje de tu facturación que procede de tu cliente más grande. Cuanto más alto, más dependes de él.',
}

/**
 * Explicación de un término, o `undefined` si no está en el glosario.
 * Los cuadrantes la usan para decidir si pintan o no la pista de ayuda.
 *
 * @param {string} clave
 * @returns {string|undefined}
 */
export function explicar(clave) {
  return GLOSARIO[clave]
}
