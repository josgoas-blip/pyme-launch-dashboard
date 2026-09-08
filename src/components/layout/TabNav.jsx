/**
 * Las 5 pestañas inalterables del Dashboard (CLAUDE.md — Estructura del Dashboard).
 * Se exportan para que AppLayout/App puedan mapear el contenido de cada pestaña
 * sin duplicar la lista en varios sitios.
 */
export const TABS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'analisis', label: 'Análisis' },
  { id: 'estrategia', label: 'Estrategia' },
  { id: 'viabilidad', label: 'Viabilidad' },
  { id: 'configuracion', label: 'Configuración' },
]

/**
 * Barra de navegación superior con las 5 pestañas. Alterna el estado
 * activo/inactivo de cada pestaña al hacer clic (controlado por el padre).
 *
 * @param {{ activeTab: string, onTabChange: (id: string) => void }} props
 */
export default function TabNav({ activeTab, onTabChange }) {
  return (
    <nav aria-label="Navegación principal del dashboard">
      <ul className="flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-canvas text-primary'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                {tab.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
