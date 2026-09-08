import { perfilCliente, preferenciasContacto, suscripcion, integraciones } from '../../data/configuracionMock.js'
import BloqueHeader from './BloqueHeader.jsx'
import PerfilClienteCard from './PerfilClienteCard.jsx'
import PreferenciasContactoCard from './PreferenciasContactoCard.jsx'
import SuscripcionCard from './SuscripcionCard.jsx'
import IntegracionesList from './IntegracionesList.jsx'
import ConsolaExportacionCard from './ConsolaExportacionCard.jsx'

/**
 * Ensambla la pestaña "Configuración" en 4 bloques de lectura progresiva:
 * (1) Perfil del Emprendedor & Ficha Identificativa, (2) Preferencias de
 * Acompañamiento & Canales, (3) Estado del Plan & Conexiones Técnicas,
 * (4) Consola de Exportación & Seguridad.
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

      {/* BLOQUE 3: Estado del Plan & Conexiones Técnicas */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={3}
          titulo="Estado del Plan & Conexiones Técnicas"
          subtitulo="Suscripción activa e integraciones del backend"
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SuscripcionCard suscripcion={suscripcion} />
          <IntegracionesList integraciones={integraciones} />
        </div>
      </section>

      {/* BLOQUE 4: Consola de Exportación & Seguridad */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={4}
          titulo="Consola de Exportación & Seguridad"
          subtitulo="Informes, modelo económico y gestión de la sesión"
        />
        <ConsolaExportacionCard />
      </section>
    </div>
  )
}
