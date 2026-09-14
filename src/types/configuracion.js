/**
 * Tipos (JSDoc) de la pestaña "Configuración" — Pyme Launch Dashboard.
 * Contrato entre los mocks (src/data/configuracionMock.js) y los componentes
 * visuales de src/components/dashboard/ (Fase 4 del plan maestro).
 */

/**
 * Un mentor asignado (Principal o Co-Mentor).
 * @typedef {Object} Mentor
 * @property {string} nombre
 * @property {string} especialidad
 */

/**
 * Perfil de la PYME / cliente.
 * @typedef {Object} PerfilCliente
 * @property {string} nombreEmpresa
 * @property {string} nif
 * @property {string} sector - Descripción del sector de actividad.
 * @property {string} categoriaSector - Clasificación breve, p.ej. "B2B Servicios".
 * @property {string} tamano - p.ej. "1-10 empleados".
 * @property {string} fechaAlta
 * @property {string} contactoNombre
 * @property {string} contactoEmail
 * @property {Mentor} mentorPrincipal
 * @property {Mentor} coMentor
 */

/**
 * Preferencias de Acompañamiento & Canales de contacto del emprendedor.
 * @typedef {Object} PreferenciasContacto
 * @property {'Mañanas (9:00 - 14:00)'|'Tardes (16:00 - 19:00)'|'Indiferente'} franjaHoraria
 * @property {'WhatsApp'|'Correo Electrónico'|'Llamada de Voz'} canalPreferido
 * @property {'Semanal'|'Quincenal'|'Mensual'} frecuenciaMentoria
 */

/**
 * Estado de la suscripción al SaaS.
 * @typedef {Object} Suscripcion
 * @property {string} plan
 * @property {'Activa'|'Pendiente de pago'|'Cancelada'} estado
 * @property {string} fechaRenovacion
 * @property {number} precioMensual - €/mes.
 */

export {}
