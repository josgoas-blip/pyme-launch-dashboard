/**
 * Suscripción en tiempo real a los cambios del expediente.
 *
 * Sirve para que la aprobación del mentor llegue al panel del cliente sin
 * recargar: cuando n8n escribe en `diagnosticos`, Supabase Realtime
 * reenvía el cambio por websocket y la tarjeta vuelve a leer su estado.
 *
 * Sobre por qué no se usa el filtro del servidor
 * ----------------------------------------------
 * `postgres_changes` admite un `filter` del tipo `id=eq.<uuid>`, que sería
 * lo natural si n8n actualizara la fila del expediente. Pero no lo hace:
 * al aprobar la cita **inserta una fila nueva** con la cita y los mentores,
 * enlazada al cliente por `respuestas.id_usuario`. Un filtro por `id` del
 * expediente no se dispararía nunca con esa inserción, que es justo el
 * evento que hay que detectar.
 *
 * Así que se escucha la tabla y se descarta en el cliente lo que no sea
 * del visitante, con el mismo criterio de identidad que usan las lecturas
 * (`filaDelVisitante`). El coste es despertar la comprobación con cambios
 * ajenos; a cambio, la detección es correcta con el flujo real de n8n.
 * Cuando n8n pase a actualizar el expediente, esto puede estrecharse a un
 * `filter: 'id=eq.' + expedienteId`.
 *
 * Igual que el resto de servicios del proyecto, nunca lanza: si no hay
 * credenciales o el canal falla, devuelve una baja que no hace nada y el
 * panel sigue funcionando con la revalidación de cada montaje.
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'
import { filaDelVisitante } from '../utils/citaDiagnostico.js'

/** Baja inerte: se devuelve cuando no llegó a abrirse ningún canal. */
const SIN_SUSCRIPCION = () => {}

/**
 * Escucha los cambios de `diagnosticos` que afecten a este visitante.
 *
 * @param {{
 *   expedienteId?: string|null,
 *   identificadores?: Array<string|null|undefined>,
 *   alCambiar: () => void,
 * }} opciones
 * @returns {() => void} Función de baja, segura de llamar siempre.
 */
export function suscribirseAlExpediente({ expedienteId = null, identificadores = [], alCambiar }) {
  if (!haySupabase || typeof alCambiar !== 'function') return SIN_SUSCRIPCION

  const propios = identificadores.filter((id) => typeof id === 'string' && id.trim())

  // Sin ninguna forma de reconocer las filas propias, escuchar la tabla
  // solo serviría para reaccionar a cambios de otras personas.
  if (!expedienteId && propios.length === 0) return SIN_SUSCRIPCION

  // El nombre identifica el canal en el servidor: se ata al visitante para
  // que dos pestañas del mismo usuario no compartan uno y la baja de una
  // deje muda a la otra.
  const nombre = `expediente:${expedienteId ?? propios[0]}`

  try {
    const canal = supabase
      .channel(nombre)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'diagnosticos' },
        (evento) => {
          const fila = evento?.new
          if (!fila || typeof fila !== 'object') return

          const esDelVisitante =
            (expedienteId && fila.id === expedienteId) || filaDelVisitante(fila, ...propios)

          if (esDelVisitante) alCambiar()
        },
      )
      .subscribe()

    return () => {
      try {
        supabase.removeChannel(canal)
      } catch {
        // El canal ya estaba cerrado: la baja es idempotente a propósito.
      }
    }
  } catch {
    return SIN_SUSCRIPCION
  }
}
