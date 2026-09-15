import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, haySupabase } from '../lib/supabaseClient.js'
import { leerPerfil, componerNombreCompleto } from '../services/authService.js'

const AuthContext = createContext(null)

/**
 * Sesión de Supabase Auth, disponible en todo el árbol.
 *
 * El estado arranca en `cargando` porque recuperar la sesión de
 * localStorage es asíncrono: sin esa fase intermedia, el primer render
 * mostraría la pantalla de acceso a un usuario que ya tiene sesión y le
 * haría parpadear el formulario antes de entrar.
 *
 * `onAuthStateChange` mantiene el estado al día ante cualquier cambio —
 * inicio y cierre de sesión, renovación del token o una pestaña hermana que
 * cierre sesión—, así que no hace falta propagar nada a mano tras llamar al
 * servicio de autenticación.
 *
 * Sin credenciales de Supabase la aplicación no se queda inaccesible: se
 * marca `authDisponible` a `false` y el enrutado deja pasar, para que un
 * clon recién descargado sin `.env` siga siendo ejecutable.
 */
export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null)
  const [cargando, setCargando] = useState(haySupabase)
  const [perfil, setPerfil] = useState(null)

  useEffect(() => {
    if (!haySupabase) return undefined

    let vigente = true

    // Sesión ya guardada en este navegador, si la hay.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!vigente) return
        setSesion(data?.session ?? null)
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })

    const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      if (!vigente) return
      setSesion(nuevaSesion)
      setCargando(false)
    })

    return () => {
      vigente = false
      suscripcion?.subscription?.unsubscribe()
    }
  }, [])

  const usuario = sesion?.user ?? null
  const userId = usuario?.id ?? null

  /**
   * Perfil de `profiles`, para saludar con el nombre editable del producto
   * y no con el que quedó grabado en el registro.
   *
   * No bloquea la carga de la aplicación: mientras llega, el saludo usa
   * `user_metadata`, que viene con la propia sesión. Si la fila no existe
   * —el disparador que la crea puede no estar configurado— se queda en
   * `null` y el respaldo sigue funcionando.
   */
  useEffect(() => {
    if (!userId) {
      setPerfil(null)
      return undefined
    }

    let vigente = true
    leerPerfil(userId).then((datos) => {
      if (vigente) setPerfil(datos)
    })

    return () => {
      vigente = false
    }
  }, [userId])

  return (
    <AuthContext.Provider
      value={{
        sesion,
        usuario,
        userId,
        email: usuario?.email ?? null,
        perfil,
        nombreCompleto: componerNombreCompleto(perfil, usuario),
        cargando,
        authDisponible: haySupabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook de acceso a la sesión.
 *
 * Fuera del proveedor devuelve un estado neutro en lugar de lanzar: así un
 * componente aislado (el Informe Ejecutivo, una prueba) puede renderizarse
 * sin montar todo el árbol de contextos.
 */
export function useAuth() {
  return (
    useContext(AuthContext) ?? {
      sesion: null,
      usuario: null,
      userId: null,
      email: null,
      perfil: null,
      nombreCompleto: 'Invitado',
      cargando: false,
      authDisponible: false,
    }
  )
}
