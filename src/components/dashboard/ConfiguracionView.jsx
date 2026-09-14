import { perfilCliente, preferenciasContacto } from '../../data/configuracionMock.js'
import BloqueHeader from './BloqueHeader.jsx'
import PerfilClienteCard from './PerfilClienteCard.jsx'
import PreferenciasContactoCard from './PreferenciasContactoCard.jsx'
import ConsolaExportacionCard from './ConsolaExportacionCard.jsx'

/**
 * Ensambla la pestaña "Configuración" en 3 bloques de lectura progresiva:
 * (1) Perfil del Emprendedor & Ficha Identificativa, (2) Preferencias de
 * Acompañamiento & Canales, (3) Consola de Exportación.
 *
 * El antiguo bloque "Estado del Plan & Conexiones Técnicas" se ha
 * retirado: el estado de las integraciones es información de instalación,
 * no del negocio del usuario, y no le ayuda a decidir nada sobre su
 * proyecto. El plan contratado sigue estando a la vista en la barra
 * superior.
 */
export default function ConfiguracionView() {
  return (
    <div className="space-y-10">
      {/* BLOQUE 1: Perfil del Emprendedor & Ficha Identificativa */}
      <section className="space-y-4">
        <BloqueHeader
          numero={1}
          titulo="Perfil del Emprendedor & Ficha Identificativa"
          subtitulo="Datos del emprendedor y equipo de mentoría asignado"
        />
        <PerfilClienteCard perfilCliente={perfilCliente} />
      </section>

      {/* BLOQUE 2: Preferencias de Acompañamiento & Canales */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={2}
          titulo="Preferencias de Acompañamiento & Canales"
          subtitulo="Franja horaria, canal preferido y frecuencia de mentoría"
        />
        <PreferenciasContactoCard preferenciasContacto={preferenciasContacto} />
      </section>

      {/* BLOQUE 3: Consola de Exportación */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={3}
          titulo="Consola de Exportación"
          subtitulo="Informe ejecutivo en PDF y modelo económico en CSV"
        />
        <ConsolaExportacionCard />
      </section>
    </div>
  )
}
