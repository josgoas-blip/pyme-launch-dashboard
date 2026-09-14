import { createContext, useContext } from 'react'

const NavegacionContext = createContext(null)

/**
 * Expone el cambio de pestaña a los cuadrantes.
 *
 * La pestaña activa vive en `AppLayout`, pero hay tarjetas —el panel de
 * Riesgos Críticos, sin ir más lejos— que necesitan llevar al usuario a
 * donde se resuelve el problema. Un contexto evita ir pasando la función
 * por todas las vistas cuando solo un puñado de tarjetas la usa.
 *
 * @param {{ irAPestana: (id: string) => void, children: import('react').ReactNode }} props
 */
export function NavegacionProvider({ irAPestana, children }) {
  return <NavegacionContext.Provider value={{ irAPestana }}>{children}</NavegacionContext.Provider>
}

/**
 * Hook de navegación entre pestañas.
 *
 * Fuera del proveedor devuelve una función vacía en lugar de lanzar: así
 * un cuadrante puede renderizarse aislado (en el Informe Ejecutivo, por
 * ejemplo) sin que el botón de "ir a" rompa el árbol.
 */
export function useNavegacion() {
  return useContext(NavegacionContext) ?? { irAPestana: () => {} }
}
