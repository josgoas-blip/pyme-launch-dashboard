/**
 * Derivación de la pestaña "Estrategia" a partir del diagnóstico real.
 *
 * Traduce dos variables cualitativas del cuestionario del TFM a la
 * estrategia que muestra el Dashboard, sin inventar métricas:
 *   - p12_primeros_clientes → bloque de Adquisición (canales tácticos
 *     acordes al estadio, no una tabla fija de CAC/LTV/ROAS).
 *   - p10_modelo_ingresos   → bloque de Monetización (estructura de
 *     ingresos coherente con el modelo declarado, no precios inventados).
 *
 * Regla de honestidad del PMV (misma que adaptadorDiagnostico.js): estas
 * variables son puntuaciones 1-5 y una etiqueta; no sostienen ni un CAC ni
 * un precio real, así que se deriva estrategia cualitativa, no cifras.
 *
 * Cada función devuelve `null` cuando el diagnóstico no aporta la variable,
 * para que la vista muestre un placeholder en lugar de datos ficticios.
 */

/** Lee un nivel 1-5 del diagnóstico solo si es un entero utilizable. */
function nivelDe(respuestas, clave) {
  const valor = respuestas?.[clave]
  return Number.isInteger(valor) && valor >= 1 && valor <= 5 ? valor : undefined
}

/**
 * p12 → Adquisición: diagnóstico del estadio y canales/acciones tácticas
 * acordes. Los niveles bajos priorizan cimientos (definir cliente, activar
 * boca a boca); los altos, medir y escalar lo que ya funciona.
 */
const ADQUISICION_POR_NIVEL = {
  1: {
    etiqueta: 'Sin plan comercial',
    diagnostico:
      'Aún no hay un método definido para captar clientes. El primer paso es elegir un canal y empezar a probar, no invertir en publicidad.',
    canales: [
      { id: 'cliente-ideal', nombre: 'Define tu cliente ideal', foco: 'Prioritario', descripcion: 'Concreta a quién te diriges antes de elegir canal: sin destinatario claro, cualquier canal desperdicia esfuerzo.' },
      { id: 'red-directa', nombre: 'Red de contactos directa', foco: 'Empezar ya', descripcion: 'Habla uno a uno con potenciales clientes de tu entorno profesional para conseguir las primeras conversaciones de venta.' },
      { id: 'presencia-minima', nombre: 'Presencia digital mínima', foco: 'Base', descripcion: 'Crea un perfil o página sencilla que explique tu propuesta; será tu carta de presentación en cualquier canal.' },
    ],
  },
  2: {
    etiqueta: 'Boca a boca pasivo',
    diagnostico:
      'Dependes de recomendaciones espontáneas. Conviene sistematizar ese boca a boca y sumar un canal activo que no dependa del azar.',
    canales: [
      { id: 'referidos', nombre: 'Programa de referidos', foco: 'Prioritario', descripcion: 'Pide recomendaciones de forma explícita y ofrece un incentivo sencillo: convierte el boca a boca pasivo en un motor activo.' },
      { id: 'prueba-social', nombre: 'Prueba social', foco: 'Refuerzo', descripcion: 'Recopila testimonios y casos de tus primeros clientes para dar confianza a los siguientes.' },
      { id: 'canal-activo', nombre: 'Un canal digital activo', foco: 'Siguiente paso', descripcion: 'Elige una única red o directorio donde esté tu cliente y publica con constancia para dejar de depender solo del boca a boca.' },
    ],
  },
  3: {
    etiqueta: 'Canales digitales / directos básicos',
    diagnostico:
      'Ya usas canales digitales, pero sin medir. El foco ahora es estructurar el mensaje y medir qué canal convierte antes de escalar la inversión.',
    canales: [
      { id: 'medir-canal', nombre: 'Mide cada canal', foco: 'Prioritario', descripcion: 'Registra de dónde llega cada contacto para saber qué canal funciona antes de aumentar el gasto.' },
      { id: 'mensaje-probado', nombre: 'Mensaje probado', foco: 'Optimización', descripcion: 'Testea dos o tres mensajes distintos y quédate con el que más respuestas genere.' },
      { id: 'presupuesto-prueba', nombre: 'Presupuesto de prueba controlado', foco: 'Experimento', descripcion: 'Asigna una inversión pequeña y acotada a un canal de pago para validar el coste por contacto sin arriesgar caja.' },
    ],
  },
  4: {
    etiqueta: 'Estrategia de lanzamiento estructurada',
    diagnostico:
      'Tienes un plan con canales y presupuesto. El siguiente salto es medir el coste de adquisición real y concentrar recursos en lo que ya funciona.',
    canales: [
      { id: 'cac-real', nombre: 'Calcula tu CAC real', foco: 'Prioritario', descripcion: 'Divide la inversión entre los clientes conseguidos por canal para conocer el coste de adquisición real de cada uno.' },
      { id: 'canal-ganador', nombre: 'Dobla la apuesta en el canal ganador', foco: 'Escalar', descripcion: 'Concentra presupuesto en el canal con mejor coste por cliente en lugar de repartirlo por igual.' },
      { id: 'automatiza', nombre: 'Automatiza el seguimiento', foco: 'Eficiencia', descripcion: 'Implanta un CRM o embudo simple para no perder contactos y medir la conversión de principio a fin.' },
    ],
  },
  5: {
    etiqueta: 'Canales validados con clientes captados',
    diagnostico:
      'Tu mecanismo de adquisición ya genera clientes. Ahora toca escalar de forma rentable vigilando la relación LTV/CAC.',
    canales: [
      { id: 'escala-validado', nombre: 'Escala el canal validado', foco: 'Prioritario', descripcion: 'Aumenta la inversión de forma progresiva mientras el coste por cliente se mantenga rentable.' },
      { id: 'ltv-cac', nombre: 'Vigila el ratio LTV/CAC', foco: 'Control', descripcion: 'Asegúrate de que el valor de cada cliente supera con holgura (3x o más) su coste de adquisición antes de acelerar.' },
      { id: 'diversifica', nombre: 'Diversifica canales', foco: 'Resiliencia', descripcion: 'Añade un segundo canal validado para no depender de una sola fuente de clientes.' },
    ],
  },
}

/**
 * p10 → Monetización: estructura de ingresos coherente con el modelo
 * declarado. Los escalones describen el rol de cada oferta (entrada,
 * núcleo, alto valor), sin fijar precios que el diagnóstico no sostiene.
 */
const MONETIZACION_POR_NIVEL = {
  1: {
    etiqueta: 'Modelo no definido',
    modelo: 'Modelo de ingresos por definir',
    descripcion:
      'Todavía no has decidido cómo cobrar. Antes de diseñar precios, elige el patrón de ingresos que mejor encaja con tu producto y tu cliente.',
    estructura: [
      { id: 'opcion-puntual', nombre: 'Venta puntual', enfoque: 'Opción A', descripcion: 'Cobro único por producto entregado u hora de servicio. Simple de arrancar.' },
      { id: 'opcion-recurrente', nombre: 'Ingresos recurrentes', enfoque: 'Opción B', descripcion: 'Cuotas o suscripciones que aportan previsibilidad mes a mes.' },
      { id: 'opcion-combinada', nombre: 'Modelo combinado', enfoque: 'Opción C', descripcion: 'Mezcla de venta puntual y recurrencia para equilibrar caja y estabilidad.' },
    ],
    recomendacion:
      'Define un único modelo principal antes de fijar precios: es la decisión que condiciona toda tu estrategia comercial.',
  },
  2: {
    etiqueta: 'Venta única tradicional',
    modelo: 'Venta única tradicional',
    descripcion:
      'Ingresos por venta puntual de producto o servicio. La palanca de crecimiento es aumentar el ticket medio y la frecuencia de recompra.',
    estructura: [
      { id: 'entrada', nombre: 'Producto de entrada', enfoque: 'Captación', descripcion: 'Oferta accesible de bajo compromiso para que el cliente te pruebe por primera vez.' },
      { id: 'nucleo', nombre: 'Oferta principal', enfoque: 'Núcleo', descripcion: 'Tu producto o servicio central, donde se concentra el grueso de la facturación.' },
      { id: 'upsell', nombre: 'Venta adicional (upsell)', enfoque: 'Ticket medio', descripcion: 'Complementos o versión premium que elevan el importe de cada venta.' },
    ],
    recomendacion:
      'Trabaja la recompra y las ventas adicionales: en un modelo de venta única, subir el ticket medio es más rentable que captar constantemente clientes nuevos.',
  },
  3: {
    etiqueta: 'Modelo recurrente o suscripción',
    modelo: 'Modelo recurrente o suscripción',
    descripcion:
      'Ingresos periódicos que aportan previsibilidad. Las claves son minimizar la fuga de clientes (churn) y ofrecer niveles de suscripción claros.',
    estructura: [
      { id: 'basico', nombre: 'Plan básico', enfoque: 'Entrada', descripcion: 'Cuota reducida con lo esencial para bajar la barrera de entrada.' },
      { id: 'estandar', nombre: 'Plan estándar', enfoque: 'Núcleo', descripcion: 'Nivel recomendado con la mejor relación valor-precio; concentra la mayoría de clientes.' },
      { id: 'premium', nombre: 'Plan premium', enfoque: 'Alto valor', descripcion: 'Nivel superior con extras y soporte prioritario para los clientes más exigentes.' },
    ],
    recomendacion:
      'Vigila el churn desde el primer mes: en un modelo recurrente, retener clientes pesa más que captarlos.',
  },
  4: {
    etiqueta: 'Modelo mixto diversificado',
    modelo: 'Modelo mixto diversificado',
    descripcion:
      'Combinas ventas puntuales, ingresos recurrentes y servicios de alto valor. El objetivo es equilibrar la caja inmediata con la estabilidad a largo plazo.',
    estructura: [
      { id: 'gancho', nombre: 'Producto gancho', enfoque: 'Captación puntual', descripcion: 'Venta única de bajo ticket que genera caja inmediata y capta clientes.' },
      { id: 'recurrente', nombre: 'Núcleo recurrente', enfoque: 'Estabilidad', descripcion: 'Suscripción o iguala que aporta ingresos previsibles mes a mes.' },
      { id: 'alto-valor', nombre: 'Servicio de alto valor', enfoque: 'Alto margen', descripcion: 'Oferta premium puntual (consultoría, proyecto a medida) que eleva el margen.' },
    ],
    recomendacion:
      'Cuida que cada línea alimente a la siguiente: el producto gancho debe conducir al núcleo recurrente y este, a los servicios de alto valor.',
  },
  5: {
    etiqueta: 'Modelo escalable y optimizado',
    modelo: 'Modelo escalable y optimizado',
    descripcion:
      'Estructura comercial validada con márgenes y LTV/CAC controlados. El foco es escalar sin que el coste de adquisición erosione la rentabilidad.',
    estructura: [
      { id: 'adquisicion', nombre: 'Adquisición rentable', enfoque: 'LTV/CAC', descripcion: 'Canales cuyo coste de adquisición se recupera con holgura frente al valor del cliente.' },
      { id: 'expansion', nombre: 'Recurrencia y expansión', enfoque: 'LTV', descripcion: 'Mecanismos de recompra, upsell y cross-sell que aumentan el valor de cada cliente en el tiempo.' },
      { id: 'margenes', nombre: 'Márgenes optimizados', enfoque: 'Rentabilidad', descripcion: 'Estructura de costes ajustada que preserva el margen neto al crecer el volumen.' },
    ],
    recomendacion:
      'Protege tu ratio LTV/CAC al escalar: crecer por encima de 3x es sano; hacerlo por debajo destruye caja.',
  },
}

/**
 * Deriva el bloque de Adquisición a partir de `p12_primeros_clientes`.
 *
 * @param {Record<string, unknown> | null} respuestas - Diagnóstico actual.
 * @returns {{ nivel: number, etiqueta: string, diagnostico: string,
 *   canales: { id: string, nombre: string, foco: string, descripcion: string }[]
 * } | null} `null` si el diagnóstico no aporta la variable.
 */
export function derivarAdquisicion(respuestas) {
  const nivel = nivelDe(respuestas, 'p12_primeros_clientes')
  if (nivel === undefined) return null

  const base = ADQUISICION_POR_NIVEL[nivel]
  return {
    nivel,
    // La etiqueta guardada en el payload manda; el mapa es solo respaldo.
    etiqueta: respuestas?.etiquetas?.p12_primeros_clientes ?? base.etiqueta,
    diagnostico: base.diagnostico,
    canales: base.canales,
  }
}

/**
 * Deriva el bloque de Monetización a partir de `p10_modelo_ingresos`.
 *
 * @param {Record<string, unknown> | null} respuestas - Diagnóstico actual.
 * @returns {{ nivel: number, etiqueta: string, modelo: string,
 *   descripcion: string, recomendacion: string,
 *   estructura: { id: string, nombre: string, enfoque: string, descripcion: string }[]
 * } | null} `null` si el diagnóstico no aporta la variable.
 */
export function derivarMonetizacion(respuestas) {
  const nivel = nivelDe(respuestas, 'p10_modelo_ingresos')
  if (nivel === undefined) return null

  const base = MONETIZACION_POR_NIVEL[nivel]
  return {
    nivel,
    etiqueta: respuestas?.etiquetas?.p10_modelo_ingresos ?? base.etiqueta,
    modelo: base.modelo,
    descripcion: base.descripcion,
    estructura: base.estructura,
    recomendacion: base.recomendacion,
  }
}
