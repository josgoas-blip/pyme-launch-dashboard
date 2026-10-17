import BloqueHeader from './BloqueHeader.jsx'
import PerfilClienteCard from './PerfilClienteCard.jsx'
import SesionEstrategicaCard from './SesionEstrategicaCard.jsx'
import InformeHtmlCard from './InformeHtmlCard.jsx'

/**
 * Ensambla la pestaña "Configuración" en 3 bloques de lectura progresiva:
 * (1) Perfil del Emprendedor & Ficha Identificativa, (2) Sesión
 * Estratégica de Mentoría, (3) Informe Ejecutivo.
 *
 * El informe solo se lee en la plataforma: para proteger la propiedad
 * intelectual se ha retirado la antigua Consola de Exportación (PDF por
 * impresión y modelo económico en CSV).
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
          subtitulo="Datos identificativos del emprendedor y de su empresa"
        />
        <PerfilClienteCard />
      </section>

      {/* BLOQUE 2: Sesión Estratégica de Mentoría */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={2}
          titulo="Sesión Estratégica de Mentoría"
          subtitulo="Sesión estratégica de 60 minutos con tu mentor para revisar el diagnóstico"
        />
        <SesionEstrategicaCard />
      </section>

      {/* BLOQUE 3: Informe Ejecutivo (solo lectura en la plataforma) */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={3}
          titulo="Informe Ejecutivo"
          subtitulo="Consulta tu informe ejecutivo directamente en la plataforma"
        />
        <InformeHtmlCard />
      </section>
    </div>
  )
}
