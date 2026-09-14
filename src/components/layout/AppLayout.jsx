import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'
import { TABS } from './TabNav.jsx'
import AgenteConsultorFlotante from '../chat/AgenteConsultorFlotante.jsx'
import { NavegacionProvider } from '../../context/NavegacionContext.jsx'

/**
 * Cascarón del Dashboard con el patrón habitual de un SaaS analítico:
 * barra lateral fija a la izquierda y área de contenido a su derecha sobre
 * fondo gris, para que las tarjetas blancas destaquen.
 *
 * El desplazamiento lateral en escritorio se hace con `lg:pl-64`, no
 * metiendo el contenido en un flex junto a la barra: la barra está en
 * `position: fixed` para que no se desplace al hacer scroll, y un
 * `padding-left` equivalente a su ancho es la forma de reservarle el hueco
 * sin sacarla del flujo dos veces.
 *
 * Al imprimir, `Sidebar` y `TopBar` llevan `no-imprimir` y el propio
 * contenido queda envuelto por el `no-imprimir` de App.jsx, así que el PDF
 * del Informe Ejecutivo sigue saliendo limpio.
 *
 * @param {{
 *   nombreUsuario: string,
 *   children: (activeTab: string) => import('react').ReactNode
 * }} props
 */
export default function AppLayout({ nombreUsuario, children }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id)
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        abiertoEnMovil={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
      />

      {/* Área de contenido: deja hueco a la barra lateral en escritorio. */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <TopBar nombreUsuario={nombreUsuario} onAbrirMenu={() => setMenuAbierto(true)} />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <NavegacionProvider irAPestana={setActiveTab}>{children(activeTab)}</NavegacionProvider>
        </main>
      </div>

      {/* Consultor IA flotante: disponible en las 5 pestañas */}
      <AgenteConsultorFlotante />
    </div>
  )
}
