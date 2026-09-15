import { useEffect, useState } from 'react'
import AppLayout from './components/layout/AppLayout.jsx'
import AuthView from './components/auth/AuthView.jsx'
import PantallaCargando from './components/auth/PantallaCargando.jsx'
import OnboardingWizard from './components/onboarding/OnboardingWizard.jsx'
import InicioView from './components/dashboard/InicioView.jsx'
import AnalisisView from './components/dashboard/AnalisisView.jsx'
import EstrategiaView from './components/dashboard/EstrategiaView.jsx'
import ViabilidadView from './components/dashboard/ViabilidadView.jsx'
import ConfiguracionView from './components/dashboard/ConfiguracionView.jsx'
import InformeEjecutivo from './components/informe/InformeEjecutivo.jsx'
import { PlanProvider } from './context/PlanContext.jsx'
import { OnboardingProvider } from './context/OnboardingContext.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { guardarDiagnostico, leerUltimoDiagnostico } from './services/diagnosticoService.js'
import {
  cargarDiagnosticoLocal,
  guardarDiagnosticoLocal,
  borrarDiagnosticoLocal,
  guardarExpedienteId,
  borrarExpedienteId,
} from './utils/persistenciaDiagnostico.js'
import { borrarHitosCompletados } from './utils/persistenciaHitos.js'
import { borrarCitaLocal } from './utils/persistenciaCita.js'

const VISTAS_POR_PESTANA = {
  inicio: InicioView,
  analisis: AnalisisView,
  estrategia: EstrategiaView,
  viabilidad: ViabilidadView,
  configuracion: ConfiguracionView,
}

/**
 * Enrutado de la aplicación, con tres destinos posibles:
 *
 *   1. Sin sesión                  → pantalla de acceso.
 *   2. Con sesión y sin diagnóstico → cuestionario (primera vez).
 *   3. Con sesión y con diagnóstico → panel de control.
 *
 * El diagnóstico se busca primero en este navegador y, si no está, en
 * Supabase por `user_id`: así una sesión iniciada en otro equipo recupera
 * el panel en vez de mandar a repetir las 20 preguntas.
 */
function Enrutador() {
  const { userId, nombreCompleto, cargando: cargandoSesion, authDisponible } = useAuth()

  /** Diagnóstico activo. `null` = aún no completado. */
  const [respuestas, setRespuestas] = useState(cargarDiagnosticoLocal)
  const [buscandoDiagnostico, setBuscandoDiagnostico] = useState(false)

  /**
   * Al iniciar sesión se comprueba si el usuario ya tiene diagnóstico.
   *
   * Solo se consulta cuando no hay copia local: si el navegador ya lo
   * tiene, la consulta no cambiaría el destino y solo añadiría espera antes
   * de pintar el panel.
   */
  useEffect(() => {
    if (!userId || respuestas) return undefined

    let vigente = true
    setBuscandoDiagnostico(true)

    leerUltimoDiagnostico(userId)
      .then((previo) => {
        if (!vigente || !previo) return

        setRespuestas(previo.respuestas)
        guardarDiagnosticoLocal(previo.respuestas)
        guardarExpedienteId(previo.id)
      })
      .finally(() => {
        if (vigente) setBuscandoDiagnostico(false)
      })

    return () => {
      vigente = false
    }
  }, [userId, respuestas])

  /**
   * Al cerrar sesión se limpia el diagnóstico en memoria y en el navegador.
   *
   * Sin esto, el siguiente usuario que entrara en el mismo equipo vería el
   * panel del anterior antes de que terminara ninguna consulta.
   */
  useEffect(() => {
    if (!authDisponible || cargandoSesion || userId) return

    setRespuestas(null)
    borrarDiagnosticoLocal()
    borrarExpedienteId()
    borrarCitaLocal()
    borrarHitosCompletados()
  }, [authDisponible, cargandoSesion, userId])

  /**
   * Recibe las respuestas del wizard y habilita la vista del Dashboard.
   *
   * La sesión se guarda en el navegador de forma síncrona —es lo que
   * sostiene la recarga— y la persistencia en Supabase va en segundo
   * plano, asociando el `user_id` real: el acceso al panel no espera a la
   * red, y si la escritura falla el servicio lo encola en memoria.
   */
  const handleOnboardingComplete = (nuevas) => {
    setRespuestas(nuevas)
    guardarDiagnosticoLocal(nuevas)
    guardarDiagnostico(nuevas)
  }

  /**
   * Nuevo diagnóstico: devuelve al cuestionario y borra la sesión guardada,
   * para que "empezar de cero" siga significando eso tras una recarga. El
   * histórico ya persistido en Supabase no se toca.
   */
  const handleReiniciarOnboarding = () => {
    borrarDiagnosticoLocal()
    // El avance de la hoja de ruta pertenece al diagnóstico que se borra:
    // conservarlo dejaría hitos marcados de un plan que ya no existe.
    borrarHitosCompletados()
    // La cita pertenece al expediente que se borra.
    borrarCitaLocal()
    borrarExpedienteId()
    setRespuestas(null)
  }

  // Recuperando la sesión guardada, o buscando el diagnóstico del usuario.
  if (cargandoSesion || buscandoDiagnostico) {
    return <PantallaCargando />
  }

  // Sin sesión: pantalla de acceso. Si la instalación no tiene credenciales
  // de Supabase, se deja pasar para que un clon sin `.env` siga siendo
  // ejecutable en local.
  if (authDisponible && !userId) {
    return <AuthView />
  }

  if (respuestas === null) {
    return (
      <OnboardingProvider respuestas={null} onReiniciar={handleReiniciarOnboarding}>
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      </OnboardingProvider>
    )
  }

  return (
    <OnboardingProvider respuestas={respuestas} onReiniciar={handleReiniciarOnboarding}>
      {/* La aplicación se oculta al imprimir: el PDF solo lleva el informe.
          Por eso el informe se monta fuera de este árbol. */}
      <div className="no-imprimir">
        <AppLayout nombreUsuario={nombreCompleto}>
          {(activeTab) => {
            const Vista = VISTAS_POR_PESTANA[activeTab]
            return <Vista />
          }}
        </AppLayout>
      </div>

      {/* Informe Ejecutivo: invisible en pantalla, es lo único que compone
          el navegador al generar el PDF. */}
      <InformeEjecutivo respuestas={respuestas} />
    </OnboardingProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PlanProvider planInicial="report">
        <Enrutador />
      </PlanProvider>
    </AuthProvider>
  )
}
