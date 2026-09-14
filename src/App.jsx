import { useState } from 'react'
import AppLayout from './components/layout/AppLayout.jsx'
import OnboardingWizard from './components/onboarding/OnboardingWizard.jsx'
import InicioView from './components/dashboard/InicioView.jsx'
import AnalisisView from './components/dashboard/AnalisisView.jsx'
import EstrategiaView from './components/dashboard/EstrategiaView.jsx'
import ViabilidadView from './components/dashboard/ViabilidadView.jsx'
import ConfiguracionView from './components/dashboard/ConfiguracionView.jsx'
import InformeEjecutivo from './components/informe/InformeEjecutivo.jsx'
import { PlanProvider } from './context/PlanContext.jsx'
import { OnboardingProvider } from './context/OnboardingContext.jsx'
import { guardarDiagnostico } from './services/diagnosticoService.js'
import {
  cargarDiagnosticoLocal,
  guardarDiagnosticoLocal,
  borrarDiagnosticoLocal,
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

export default function App() {
  /**
   * Diagnóstico del cuestionario previo. `null` = onboarding sin completar.
   *
   * El estado arranca con lo que haya guardado este navegador, de modo que
   * una recarga (F5) o una visita posterior devuelvan al panel en lugar de
   * al cuestionario. El inicializador es perezoso: `cargarDiagnosticoLocal`
   * solo se ejecuta en el primer render, no en cada uno. Si no hay nada
   * guardado, o lo guardado está corrupto, devuelve `null` y se muestra el
   * onboarding.
   */
  const [respuestasOnboarding, setRespuestasOnboarding] = useState(cargarDiagnosticoLocal)

  /**
   * Recibe las respuestas del wizard y habilita la vista del Dashboard.
   *
   * La sesión se guarda en el navegador de forma síncrona —es lo que
   * sostiene la recarga— y la persistencia en Supabase va en segundo
   * plano: el acceso al panel no espera a la red, y si la escritura falla
   * el servicio lo encola en memoria.
   */
  const handleOnboardingComplete = (respuestas) => {
    setRespuestasOnboarding(respuestas)
    guardarDiagnosticoLocal(respuestas)
    guardarDiagnostico(respuestas)
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
    setRespuestasOnboarding(null)
  }

  return (
    <PlanProvider planInicial="report">
      <OnboardingProvider
        respuestas={respuestasOnboarding}
        onReiniciar={handleReiniciarOnboarding}
      >
        {respuestasOnboarding === null ? (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        ) : (
          <>
            {/* La aplicación se oculta al imprimir: el PDF solo lleva el
                informe. Por eso el informe se monta fuera de este árbol. */}
            <div className="no-imprimir">
              <AppLayout nombreUsuario="Ana López">
                {(activeTab) => {
                  const Vista = VISTAS_POR_PESTANA[activeTab]
                  return <Vista />
                }}
              </AppLayout>
            </div>

            {/* Informe Ejecutivo: invisible en pantalla, es lo único que
                compone el navegador al generar el PDF. */}
            <InformeEjecutivo respuestas={respuestasOnboarding} />
          </>
        )}
      </OnboardingProvider>
    </PlanProvider>
  )
}
