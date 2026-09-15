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
 * @param {{
 *   expedienteId: string,
 *   nombreCliente: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export function ModoLecturaProvider({ expedienteId, nombreCliente, children }) {
  return (
    <ModoLecturaContext.Provider value={{ soloLectura: true, expedienteId, nombreCliente }}>
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
  return useContext(ModoLecturaContext) ?? { soloLectura: false, expedienteId: null, nombreCliente: null }
}
