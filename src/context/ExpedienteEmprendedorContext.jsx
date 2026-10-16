import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { leerExpedienteEmprendedor } from '../services/expedienteEmprendedorService.js'

const ExpedienteEmprendedorContext = createContext(null)

/**
 * Expediente de pago e informe (`Entrepreneur_diagnostics`) del usuario
 * conectado.
 *
 * Se consulta una vez por combinación de email e `?id=`, no cada vez que
 * se abre la pestaña Configuración. `recargar` repite la consulta: el
 * informe lo escribe n8n y puede llegar con el panel ya abierto.
 *
 * @param {{ email: string|null, idExpediente: string|null, children: import('react').ReactNode }} props
 */
export function ExpedienteEmprendedorProvider({ email, idExpediente, children }) {
  const [lectura, setLectura] = useState({ estado: 'cargando' })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true
    setLectura({ estado: 'cargando' })

    leerExpedienteEmprendedor({ id: idExpediente, email }).then((resultado) => {
      if (vigente) setLectura(resultado)
    })

    return () => {
      vigente = false
    }
  }, [email, idExpediente, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return (
    <ExpedienteEmprendedorContext.Provider value={{ ...lectura, recargar }}>
      {children}
    </ExpedienteEmprendedorContext.Provider>
  )
}

/**
 * Lectura del expediente. Fuera del proveedor (Modo Consultor, sin sesión)
 * devuelve `{ estado: 'no-disponible' }`.
 */
export function useExpedienteEmprendedor() {
  return useContext(ExpedienteEmprendedorContext) ?? { estado: 'no-disponible', recargar: () => {} }
}
