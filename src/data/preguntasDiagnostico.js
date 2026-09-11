/**
 * Catálogo de preguntas cualitativas del modelo de evaluación del TFM.
 *
 * Cada pregunta ofrece 5 opciones descritas en el lenguaje del
 * emprendedor; `valor` es la puntuación interna (1-5) que consume
 * src/utils/scoreDiagnostico.js y que se persiste en la columna
 * homónima de la tabla `diagnosticos`.
 *
 * `bloque` agrupa las preguntas en los 4 pasos del cuestionario:
 *   1. Validación y Mercado        (p1-p7)
 *   2. Modelo Comercial y Competencia (p8-p12)
 *   3. Operaciones y Equipo        (p13-p15)
 *   4. Viabilidad Financiera y Legal  (p16; p17-p20 se capturan aparte
 *      por ser heterogéneas: permiso legal, euros, meses y un booleano).
 *
 * Nota sobre p1: todas sus opciones puntúan 4. El tipo de negocio no
 * penaliza el score —ninguna tipología es "peor"—, pero sí es contexto
 * relevante, así que la etiqueta elegida viaja en el payload dentro de
 * `respuestas.etiquetas`.
 */
export const PREGUNTAS_TFM = [
  {
    id: 'p1_idea_negocio',
    bloque: 1,
    titulo: '¿Qué tipo de producto o servicio deseas ofrecer?',
    opciones: [
      { valor: 4, etiqueta: 'Producto o servicio tradicional', desc: 'Comercio, alimentación, reparación, peluquería, limpieza, transporte, restauración u otro servicio directo.' },
      { valor: 4, etiqueta: 'Producto o servicio especializado', desc: 'Requiere conocimientos técnicos, consultoría, formación, diseño, asesoría profesional, salud, etc.' },
      { valor: 4, etiqueta: 'Producto o servicio innovador', desc: 'Forma nueva o mejorada de resolver una necesidad existente sin depender de alta tecnología.' },
      { valor: 4, etiqueta: 'Producto o servicio digital o tecnológico', desc: 'Aplicación, plataforma digital, software, e-commerce, automatización o herramienta online.' },
      { valor: 4, etiqueta: 'Alta innovación tecnológica', desc: 'Inteligencia artificial, robótica, biotecnología, blockchain, IoT o tecnologías avanzadas.' }
    ]
  },
  {
    id: 'p2_problema_necesidad',
    bloque: 1,
    titulo: '¿Qué tan claro tienes el problema o la necesidad que resuelves?',
    opciones: [
      { valor: 1, etiqueta: 'Aún sin definir', desc: 'Tengo una idea de negocio, pero aún no sé exactamente qué necesidad quiero atender.' },
      { valor: 2, etiqueta: 'Idea general', desc: 'Sé aproximadamente qué quiero solucionar, pero todavía no lo he definido con claridad.' },
      { valor: 3, etiqueta: 'Problema identificado', desc: 'Sé qué situación quiero mejorar, qué necesidad quiero satisfacer o qué problema quiero solucionar.' },
      { valor: 4, etiqueta: 'Identificado y segmentado', desc: 'Tengo claro qué personas o empresas tienen esa necesidad y cómo mi propuesta les ayuda.' },
      { valor: 5, etiqueta: 'Validado con clientes reales', desc: 'He comprobado mediante entrevistas, pruebas o encuestas que el problema es real y relevante.' }
    ]
  },
  {
    id: 'p3_cliente_principal',
    bloque: 1,
    titulo: '¿Tienes identificado a tu cliente principal?',
    opciones: [
      { valor: 1, etiqueta: 'Sin definir', desc: 'Podría dirigirme a diferentes grupos, pero aún no tengo claro a quién priorizar.' },
      { valor: 2, etiqueta: 'Idea general', desc: 'Sé que me dirijo a un grupo amplio (ej. jóvenes, familias, empresas), sin perfil concreto.' },
      { valor: 3, etiqueta: 'Grupo concreto identificado', desc: 'Sé qué tipo de personas o empresas concretas necesitan mi solución.' },
      { valor: 4, etiqueta: 'Perfil detallado definido', desc: 'Conozco necesidades, intereses, hábitos de compra y capacidad de pago de mi cliente ideal.' },
      { valor: 5, etiqueta: 'Perfil contrastado en mercado', desc: 'He hablado con ellos, realizado encuestas o pruebas y demostrado su interés activo.' }
    ]
  },
  {
    id: 'p4_hablado_clientes',
    bloque: 1,
    titulo: '¿Has hablado directamente con clientes potenciales?',
    opciones: [
      { valor: 1, etiqueta: 'No he hablado', desc: 'Todavía no he conversado con potenciales clientes sobre la propuesta.' },
      { valor: 2, etiqueta: 'Solo entorno cercano', desc: 'Lo he comentado informalmente con familiares, amigos o conocidos cercanos.' },
      { valor: 3, etiqueta: 'Conversaciones puntuales (1-5 personas)', desc: 'Charlas iniciales con clientes potenciales, pero sin datos concluyentes.' },
      { valor: 4, etiqueta: 'Conversaciones amplias (6-15 personas)', desc: 'He profundizado con potenciales clientes sobre sus hábitos, problemas y necesidades.' },
      { valor: 5, etiqueta: 'Validación profunda (+15 entrevistas)', desc: 'Entrevistas estructuradas con patrones claros, preventas, pedidos o primeras ventas.' }
    ]
  },
  {
    id: 'p5_encuestas_entrevistas',
    bloque: 1,
    titulo: '¿Has realizado encuestas o entrevistas estructuradas?',
    opciones: [
      { valor: 1, etiqueta: 'Ninguna', desc: 'No he realizado cuestionarios ni entrevistas estructuradas formales.' },
      { valor: 2, etiqueta: 'Sondeo informal', desc: 'He realizado preguntas sueltas sin un guion metodológico preparado.' },
      { valor: 3, etiqueta: 'Guion básico inicial', desc: 'Entrevistas con preguntas orientadas a validar el problema y la solución.' },
      { valor: 4, etiqueta: 'Estudio estructurado', desc: 'Muestra representativa de entrevistas o encuestas con análisis de resultados.' },
      { valor: 5, etiqueta: 'Investigación sistemática continua', desc: 'Proceso continuo de escucha estructurada para iterar el producto.' }
    ]
  },
  {
    id: 'p6_intencion_compra',
    bloque: 1,
    titulo: '¿Algún cliente potencial ha mostrado intención real de compra?',
    opciones: [
      { valor: 1, etiqueta: 'Sin intención manifiesta', desc: 'Ningún cliente ha manifestado disposición a comprar o pagar.' },
      { valor: 2, etiqueta: 'Interés verbal genérico', desc: 'Comentarios positivos de agrado o cortesía, pero sin compromiso real.' },
      { valor: 3, etiqueta: 'Petición de tarifas y condiciones', desc: 'Potenciales clientes han pedido presupuesto, precios o fecha de lanzamiento.' },
      { valor: 4, etiqueta: 'Lista de espera o interés formal', desc: 'Usuarios registrados en lista de espera o cartas de interés firmadas.' },
      { valor: 5, etiqueta: 'Compromiso económico en firme', desc: 'Reservas pagadas, preventas cerradas, anticipos o primeros contratos.' }
    ]
  },
  {
    id: 'p7_aprendizaje_cambios',
    bloque: 1,
    titulo: '¿Qué cambios has aplicado tras escuchar a los clientes?',
    opciones: [
      { valor: 1, etiqueta: 'Sin cambios / Sin contacto', desc: 'No he hablado con el mercado o mantengo la idea exactamente igual.' },
      { valor: 2, etiqueta: 'Ajustes cosméticos', desc: 'He realizado pequeñas modificaciones en el nombre o diseño sin alterar la propuesta.' },
      { valor: 3, etiqueta: 'Ajustes en funcionalidades o servicios', desc: 'He adaptado características específicas respondiendo a comentarios directos.' },
      { valor: 4, etiqueta: 'Reorientación de la propuesta de valor', desc: 'He modificado el enfoque comercial o el perfil del cliente tras el feedback recibido.' },
      { valor: 5, etiqueta: 'Iteración validada y demostrada', desc: 'He pivotado elementos clave y contrastado que la nueva versión tracciona mejor.' }
    ]
  },
  {
    id: 'p8_identificado_competencia',
    bloque: 2,
    titulo: '¿Tienes identificada a tu competencia directa e indirecta?',
    opciones: [
      { valor: 1, etiqueta: 'Desconocida / "No tengo competencia"', desc: 'No he investigado quién ofrece soluciones similares en el mercado.' },
      { valor: 2, etiqueta: 'Conocimiento superficial', desc: 'Conozco algunas empresas o negocios del sector, pero sin analizarlos a fondo.' },
      { valor: 3, etiqueta: 'Competidores principales mapeados', desc: 'Identificados los 3-5 competidores clave y su propuesta de producto.' },
      { valor: 4, etiqueta: 'Análisis detallado de precios y oferta', desc: 'Conozco sus tarifas, fortalezas, debilidades y qué huecos dejan libres.' },
      { valor: 5, etiqueta: 'Matriz competitiva exhaustiva', desc: 'Estudio de posicionamiento continuo con comparativa de cuota, precios y propuesta.' }
    ]
  },
  {
    id: 'p9_propuesta_valor',
    bloque: 2,
    titulo: '¿Por qué elegiría un cliente tu solución frente a la competencia?',
    opciones: [
      { valor: 1, etiqueta: 'Sin factor diferenciador claro', desc: 'Ofrezco un servicio muy similar a lo que ya existe sin ventaja clara.' },
      { valor: 2, etiqueta: 'Por precio o simpatía', desc: 'Compito intentando ser más barato o por trato personal genérico.' },
      { valor: 3, etiqueta: 'Diferenciación funcional', desc: 'Aporto mayor rapidez, especialización, mejor horario o calidad de servicio.' },
      { valor: 4, etiqueta: 'Ventaja competitiva contrastada', desc: 'Propuesta de valor diferencial que los clientes perciben y valoran explícitamente.' },
      { valor: 5, etiqueta: 'Posicionamiento único y difícil de replicar', desc: 'Ventaja protegible por tecnología, marca, método exclusivo o red.' }
    ]
  },
  {
    id: 'p10_modelo_ingresos',
    bloque: 2,
    titulo: '¿Cómo monetizará tu negocio?',
    opciones: [
      { valor: 1, etiqueta: 'Modelo no definido', desc: 'Aún no sé exactamente cómo voy a cobrar por el producto o servicio.' },
      { valor: 2, etiqueta: 'Venta única tradicional', desc: 'Cobro puntual por producto vendido u horas de servicio prestadas.' },
      { valor: 3, etiqueta: 'Modelo recurrente o suscripción', desc: 'Ingresos periódicos (cuotas, mantenimientos, igualas o suscripciones).' },
      { valor: 4, etiqueta: 'Modelo mixto diversificado', desc: 'Combinación de ingresos recurrentes, ventas directas y servicios de alto valor.' },
      { valor: 5, etiqueta: 'Modelo escalable y optimizado', desc: 'Estructura comercial validada con márgenes netos y LTV/CAC calculados.' }
    ]
  },
  {
    id: 'p11_precio_logica',
    bloque: 2,
    titulo: '¿Cómo has definido tus precios?',
    opciones: [
      { valor: 1, etiqueta: 'Sin calcular', desc: 'No tengo definidas mis tarifas o precios de venta.' },
      { valor: 2, etiqueta: 'A ojo o imitando a otros', desc: 'He copiado los precios de la competencia sin conocer mis costes internos.' },
      { valor: 3, etiqueta: 'Costes directos + margen básico', desc: 'Calculo el coste de entrega o producto y le añado un porcentaje de beneficio.' },
      { valor: 4, etiqueta: 'Escandallo completo y margen neto', desc: 'Incluye costes fijos, variables, horas de trabajo, impuestos y margen neto deseado.' },
      { valor: 5, etiqueta: 'Fijación por valor aportado (Value-based)', desc: 'Precios fijados por el retorno que obtiene el cliente, contrastados con su disposición de pago.' }
    ]
  },
  {
    id: 'p12_primeros_clientes',
    bloque: 2,
    titulo: '¿Cómo piensas conseguir tus primeros clientes?',
    opciones: [
      { valor: 1, etiqueta: 'Sin plan comercial', desc: 'No tengo definido un método para captar usuarios o clientes.' },
      { valor: 2, etiqueta: 'Boca a boca pasivo', desc: 'Confío en que amigos, conocidos o recomendaciones traigan clientes de forma natural.' },
      { valor: 3, etiqueta: 'Canales digitales / directos básicos', desc: 'Redes sociales, prospección básica o anuncios locales sin probar.' },
      { valor: 4, etiqueta: 'Estrategia de lanzamiento estructurada', desc: 'Plan definido con canales seleccionados, mensaje probado y presupuesto asignado.' },
      { valor: 5, etiqueta: 'Canales validados con clientes captados', desc: 'Mecanismo de adquisición probado que ya está generando contactos o clientes reales.' }
    ]
  },
  {
    id: 'p13_necesidades_operativas',
    bloque: 3,
    titulo: '¿Tienes identificados los recursos operativos necesarios?',
    opciones: [
      { valor: 1, etiqueta: 'Desconocidos', desc: 'No he calculado qué herramientas, instalaciones o personal requiero para operar.' },
      { valor: 2, etiqueta: 'Estimación mental básica', desc: 'Sé a grandes rasgos qué necesito, pero sin listado ni cotizaciones.' },
      { valor: 3, etiqueta: 'Listado de requerimientos cerrado', desc: 'Inventario de herramientas, software, locales o maquinaria necesarios.' },
      { valor: 4, etiqueta: 'Proveedores y costes cotizados', desc: 'Presupuestos formales cerrados con proveedores y tiempos de entrega analizados.' },
      { valor: 5, etiqueta: 'Cadena operativa en funcionamiento', desc: 'Procesos operativos documentados y listos para atender demanda sin cuellos de botella.' }
    ]
  },
  {
    id: 'p14_mvp_prototipo',
    bloque: 3,
    titulo: '¿En qué punto está tu producto, servicio o MVP?',
    opciones: [
      { valor: 1, etiqueta: 'Solo conceptual', desc: 'La propuesta existe únicamente como idea o documento explicativo.' },
      { valor: 2, etiqueta: 'Bocetos y esquemas', desc: 'Tengo planos, maquetas, dossieres o presentaciones visuales preparadas.' },
      { valor: 3, etiqueta: 'Prototipo no comercializable', desc: 'Versión preliminar funcional que demuestra la viabilidad técnica interna.' },
      { valor: 4, etiqueta: 'MVP operativo probado con usuarios', desc: 'Versión mínima viable testada con clientes reales en entorno real de uso.' },
      { valor: 5, etiqueta: 'Producto final probado y listo para escalar', desc: 'Solución madura, comercializable y con capacidad de entrega inmediata.' }
    ]
  },
  {
    id: 'p15_experiencia_equipo',
    bloque: 3,
    titulo: '¿Qué experiencia o capacidades tiene el equipo en este sector?',
    opciones: [
      { valor: 1, etiqueta: 'Sin experiencia previa', desc: 'Primera toma de contacto con el sector o actividad económica.' },
      { valor: 2, etiqueta: 'Formación teórica básica', desc: 'Cursos o conocimientos teóricos, pero sin trayectoria profesional directa.' },
      { valor: 3, etiqueta: 'Experiencia profesional en el sector', desc: 'Más de 2 años trabajando por cuenta ajena o colaborando en el sector.' },
      { valor: 4, etiqueta: 'Liderazgo y solvencia contrastada', desc: 'Trayectoria sólida liderando proyectos o empresas afines a la actividad.' },
      { valor: 5, etiqueta: 'Equipo multidisciplinar complementario', desc: 'Perfiles técnicos, comerciales y financieros cubiertos por especialistas senior.' }
    ]
  },
  {
    id: 'p16_previsiones_financieras',
    bloque: 4,
    titulo: '¿Has calculado tus previsiones de ventas, costes y punto muerto?',
    opciones: [
      { valor: 1, etiqueta: 'Sin previsiones numéricas', desc: 'No tengo cálculos de facturación ni desglose mensual de costes fijos.' },
      { valor: 2, etiqueta: 'Estimación aproximada de ventas', desc: 'Previsiones basadas en intuición sin detalle riguroso de costes asociados.' },
      { valor: 3, etiqueta: 'Costes fijos y variables calculados', desc: 'Conozco los costes de estructura y de venta, pero sin punto muerto riguroso.' },
      { valor: 4, etiqueta: 'Punto de equilibrio y cuenta de resultados', desc: 'Cálculo del umbral de rentabilidad en euros y unidades para 12 meses.' },
      { valor: 5, etiqueta: 'Modelo financiero integral a 3 escenarios', desc: 'Cuenta de resultados, plan de tesorería y escenarios (pesimista, base, optimista).' }
    ]
  }
]

/** Preguntas cualitativas de un bloque concreto (1-4). */
export function preguntasDelBloque(bloque) {
  return PREGUNTAS_TFM.filter((pregunta) => pregunta.bloque === bloque)
}

/**
 * Índice de la opción que se preselecciona al abrir el cuestionario: la
 * central, para no empujar ni al optimismo ni al pesimismo.
 */
export const INDICE_OPCION_POR_DEFECTO = 2

/** Valores iniciales (puntuación interna) de las preguntas cualitativas. */
export const VALORES_INICIALES_TFM = Object.fromEntries(
  PREGUNTAS_TFM.map((pregunta) => [
    pregunta.id,
    pregunta.opciones[INDICE_OPCION_POR_DEFECTO].valor,
  ]),
)
