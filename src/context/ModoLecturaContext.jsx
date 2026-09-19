import { createContext, useContext } from 'react'

const ModoLecturaContext = createContext(null)

/**
 * Marca el árbol como "solo lectura" (Modo Consultor).
 *
 * Existe para que cada componente pueda decidir por su cuenta qué esconde,
 * en vez de que la vista de consultor tenga que duplicar el panel entero
 * sin los botones. Un panel duplicado se desincroniza en cuanto alguien
 * toca una tarjeta y se olvida de la otra copia.
 *
 * `expedienteId` es el diagnóstico que se muestra: el más reciente del
 * cliente, que puede no ser el del enlace. `clienteUserId` es la cuenta del
 * cliente, si se conoce, para consultar su proyecto. `enlaceAnterior` indica
 * que el enlace apuntaba a una evaluación más antigua.
 *
 * @param {{
 *   expedienteId: string,
 *   nombreCliente: string,
 *   clienteUserId?: string|null,
 *   completadoEn?: Date|null,
 *   enlaceAnterior?: { id: string, completadoEn: Date|null }|null,
 *   children: import('react').ReactNode,
 * }} props
 */
export function ModoLecturaProvider({
  expedienteId,
  nombreCliente,
  clienteUserId = null,
  completadoEn = null,
  enlaceAnterior = null,
  children,
}) {
  return (
    <ModoLecturaContext.Provider
      value={{ soloLectura: true, expedienteId, nombreCliente, clienteUserId, completadoEn, enlaceAnterior }}
    >
      {children}
    </ModoLecturaContext.Provider>
  )
}

/**
 * ¿Estamos en modo solo lectura?
 *
 * Fuera del proveedor devuelve `soloLectura: false`, que es el caso normal
 * del cliente: así ningún componente necesita comprobar si el contexto
 * existe antes de preguntar.
 */
export function useModoLectura() {
  return (
    useContext(ModoLecturaContext) ?? {
      soloLectura: false,
      expedienteId: null,
      nombreCliente: null,
      clienteUserId: null,
      completadoEn: null,
      enlaceAnterior: null,
    }
  )
}
