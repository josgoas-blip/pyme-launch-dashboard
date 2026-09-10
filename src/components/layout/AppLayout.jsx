import { useState } from 'react'
import Header from './Header.jsx'
import { TABS } from './TabNav.jsx'
import AgenteConsultorFlotante from '../chat/AgenteConsultorFlotante.jsx'

/**
 * Cascarón base del Dashboard (Fase 2 del plan maestro).
 * Renderiza el Header (logo, bienvenida y navegación de 5 pestañas) y un área
 * de contenido que cambia según la pestaña activa. Los cuadrantes internos de
 * cada pestaña se maquetarán en fases posteriores (3 y 4).
 *
 * @param {{
 *   nombreUsuario: string,
 *   children: (activeTab: string) => import('react').ReactNode
 * }} props
 */
export default function AppLayout({ nombreUsuario, children }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id)

  return (
    <div className="min-h-screen bg-canvas">
      <Header nombreUsuario={nombreUsuario} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto max-w-6xl px-6 py-8">{children(activeTab)}</main>

      {/* Consultor IA flotante: disponible en las 5 pestañas */}
      <AgenteConsultorFlotante />
    </div>
  )
}
