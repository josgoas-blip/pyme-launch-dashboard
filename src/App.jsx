import AppLayout from './components/layout/AppLayout.jsx'
import InicioView from './components/dashboard/InicioView.jsx'
import AnalisisView from './components/dashboard/AnalisisView.jsx'
import EstrategiaView from './components/dashboard/EstrategiaView.jsx'
import ViabilidadView from './components/dashboard/ViabilidadView.jsx'
import ConfiguracionView from './components/dashboard/ConfiguracionView.jsx'

const VISTAS_POR_PESTANA = {
  inicio: InicioView,
  analisis: AnalisisView,
  estrategia: EstrategiaView,
  viabilidad: ViabilidadView,
  configuracion: ConfiguracionView,
}

export default function App() {
  return (
    <AppLayout nombreUsuario="Ana López">
      {(activeTab) => {
        const Vista = VISTAS_POR_PESTANA[activeTab]
        return <Vista />
      }}
    </AppLayout>
  )
}
