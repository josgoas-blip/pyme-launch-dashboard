/**
 * Banderas de entorno de la aplicación.
 *
 * `VITE_MODO_DEMO` controla las herramientas de prueba visibles para el
 * usuario (el selector de plan de la barra superior y los botones
 * "Mejorar a…" que simulan una subida de plan sin pago).
 *
 * Está activo salvo que se desactive explícitamente con
 * `VITE_MODO_DEMO=false`: así el despliegue actual conserva el selector con
 * el que se prueban los bloqueos, y un despliegue de producción solo tiene
 * que definir la variable para que el plan dependa únicamente de
 * `profiles.plan_contratado`.
 */
export const MODO_DEMO = import.meta.env?.VITE_MODO_DEMO !== 'false'
