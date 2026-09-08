import { useState } from 'react'
import { Card, CardTitle } from '../ui/Card.jsx'

const FRANJAS = ['Mañanas (9:00 - 14:00)', 'Tardes (16:00 - 19:00)', 'Indiferente']
const CANALES = ['WhatsApp', 'Correo Electrónico', 'Llamada de Voz']
const FRECUENCIAS = ['Semanal', 'Quincenal', 'Mensual']

/**
 * Cuadrante "Preferencias de Acompañamiento & Canales": controles
 * interactivos para definir la franja horaria de contacto, el canal
 * preferido y la frecuencia de mentoría.
 *
 * El estado es local al componente (no persiste): la escritura real en
 * Supabase se conectará en la Fase 5 del plan maestro.
 *
 * @param {{ preferenciasContacto: import('../../types/configuracion.js').PreferenciasContacto }} props
 */
export default function PreferenciasContactoCard({ preferenciasContacto }) {
  const [franjaHoraria, setFranjaHoraria] = useState(preferenciasContacto.franjaHoraria)
  const [canalPreferido, setCanalPreferido] = useState(preferenciasContacto.canalPreferido)
  const [frecuenciaMentoria, setFrecuenciaMentoria] = useState(preferenciasContacto.frecuenciaMentoria)

  return (
    <Card>
      <CardTitle>Preferencias de Acompañamiento &amp; Canales</CardTitle>

      <div className="mt-4 space-y-5">
        {/* Franja Horaria de Contacto */}
        <div>
          <label htmlFor="franja-horaria" className="text-xs font-semibold uppercase tracking-wider text-muted">
            Franja Horaria de Contacto
          </label>
          <select
            id="franja-horaria"
            value={franjaHoraria}
            onChange={(e) => setFranjaHoraria(e.target.value)}
            className="mt-2 w-full rounded-lg border border-card-border bg-canvas px-3 py-2 text-sm text-main outline-none focus:border-primary"
          >
            {FRANJAS.map((franja) => (
              <option key={franja} value={franja}>
                {franja}
              </option>
            ))}
          </select>
        </div>

        {/* Canal Preferido */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Canal Preferido</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CANALES.map((canal) => {
              const seleccionado = canal === canalPreferido
              return (
                <button
                  key={canal}
                  type="button"
                  onClick={() => setCanalPreferido(canal)}
                  aria-pressed={seleccionado}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    seleccionado
                      ? 'bg-primary text-white'
                      : 'bg-canvas text-muted hover:bg-gray-200'
                  }`}
                >
                  {canal}
                </button>
              )
            })}
          </div>
        </div>

        {/* Frecuencia de Mentoría */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Frecuencia de Mentoría</p>
          <div className="mt-2 flex flex-wrap gap-4">
            {FRECUENCIAS.map((frecuencia) => (
              <label key={frecuencia} className="flex items-center gap-1.5 text-sm text-main">
                <input
                  type="radio"
                  name="frecuencia-mentoria"
                  value={frecuencia}
                  checked={frecuenciaMentoria === frecuencia}
                  onChange={(e) => setFrecuenciaMentoria(e.target.value)}
                  className="h-4 w-4 accent-[#1B4D3E]"
                />
                {frecuencia}
              </label>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
