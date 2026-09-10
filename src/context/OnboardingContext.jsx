import { createContext, useContext, useMemo } from 'react'
import { adaptarDiagnostico } from '../utils/adaptadorDiagnostico.js'

const OnboardingContext = createContext(null)

/**
 * Distribuye por todo el árbol las respuestas del cuestionario diagnóstico y
 * los datos ya adaptados que consumen los cuadrantes. El estado vive en
 * `App.jsx` (fuente única de verdad); este proveedor lo expone en modo
 * lectura, deriva `datos` con el adaptador y ofrece la acción de reinicio.
 *
 * @param {{
 *   respuestas: Record<string, unknown> | null,
 *   onReiniciar: () => void,
 *   children: import('react').ReactNode,
 * }} props
 */
export function OnboardingProvider({ respuestas, onReiniciar, children }) {
  // Se recalcula solo al cambiar el diagnóstico, no en cada render.
  const datos = useMemo(() => adaptarDiagnostico(respuestas), [respuestas])

  return (
    <OnboardingContext.Provider
      value={{
        respuestas,
        datos,
        completado: respuestas !== null,
        reiniciarOnboarding: onReiniciar,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

/**
 * Hook de acceso al diagnóstico y a los datos adaptados de los cuadrantes.
 * Debe usarse dentro de `<OnboardingProvider>`.
 */
export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding debe usarse dentro de <OnboardingProvider>')
  return ctx
}
