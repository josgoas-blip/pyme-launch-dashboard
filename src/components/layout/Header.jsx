import TabNav from './TabNav.jsx'
import { controlProyecto } from '../../data/dashboardMock.js'
import { calcularEstadoGlobal } from '../../utils/estadoGlobal.js'

/**
 * Header principal del Dashboard (design.md: color primary #1B4D3E).
 * Incluye: logo/nombre + distintivo "PANEL DE CONTROL" + badge dinámico de
 * fase global (calculado desde el progreso del recorrido), bienvenida
 * personalizada, y la barra de navegación de las 5 pestañas.
 *
 * @param {{ nombreUsuario: string, activeTab: string, onTabChange: (id: string) => void }} props
 */
export default function Header({ nombreUsuario, activeTab, onTabChange }) {
  const estadoGlobal = calcularEstadoGlobal(controlProyecto.progreso_recorrido)

  return (
    <header className="bg-primary text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Isotipo (solo el cohete, sin texto) + nombre + distintivo */}
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 p-2">
              <img src="/logo-icon.png" alt="Isotipo Pyme Launch" className="h-full w-full object-contain" />
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold leading-none text-white">Pyme Launch</h1>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                Panel de Control
              </span>
              <span
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90"
                title={`${estadoGlobal.porcentaje}% de avance del recorrido`}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: estadoGlobal.colorSemaforo }}
                />
                {controlProyecto.fase_actual} · {estadoGlobal.calificativo}
              </span>
            </div>
          </div>

          {/* Bienvenida personalizada */}
          <p className="text-sm text-white/80">
            Bienvenido, <span className="font-semibold text-white">{nombreUsuario}</span>
          </p>
        </div>

        {/* Navegación de las 5 pestañas */}
        <TabNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </header>
  )
}
