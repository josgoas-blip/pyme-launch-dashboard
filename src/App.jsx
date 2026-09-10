import { useState } from 'react'
import AppLayout from './components/layout/AppLayout.jsx'
import OnboardingWizard from './components/onboarding/OnboardingWizard.jsx'
import InicioView from './components/dashboard/InicioView.jsx'
import AnalisisView from './components/dashboard/AnalisisView.jsx'
import EstrategiaView from './components/dashboard/EstrategiaView.jsx'
import ViabilidadView from './components/dashboard/ViabilidadView.jsx'
import ConfiguracionView from './components/dashboard/ConfiguracionView.jsx'
import { PlanProvider } from './context/PlanContext.jsx'
import { OnboardingProvider } from './context/OnboardingContext.jsx'
import { guardarDiagnostico } from './services/diagnosticoService.js'

const VISTAS_POR_PESTANA = {
  inicio: InicioView,
  analisis: AnalisisView,
  estrategia: EstrategiaView,
  viabilidad: ViabilidadView,
  configuracion: ConfiguracionView,
}

export default function App() {
  /** Diagnóstico del cuestionario previo. `null` = onboarding sin completar. */
  const [respuestasOnboarding, setRespuestasOnboarding] = useState(null)

  /**
   * Recibe las respuestas del wizard y habilita la vista del Dashboard.
   * La persistencia va en segundo plano: el acceso al panel no espera a
   * Supabase, y si la escritura falla el servicio lo encola en memoria.
   */
  const handleOnboardingComplete = (respuestas) => {
    setRespuestasOnboarding(respuestas)
    guardarDiagnostico(respuestas)
  }

  /**
   * Botón de desarrollo: devuelve al cuestionario sin recargar la sesión.
   * Al desmontarse, el wizard reinicia su estado interno (pasos y respuestas).
   */
  const handleReiniciarOnboarding = () => setRespuestasOnboarding(null)

  return (
    <PlanProvider planInicial="report">
      <OnboardingProvider
        respuestas={respuestasOnboarding}
        onReiniciar={handleReiniciarOnboarding}
      >
        {respuestasOnboarding === null ? (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        ) : (
          <AppLayout nombreUsuario="Ana López">
            {(activeTab) => {
              const Vista = VISTAS_POR_PESTANA[activeTab]
              return <Vista />
            }}
          </AppLayout>
        )}
      </OnboardingProvider>
    </PlanProvider>
  )
}
