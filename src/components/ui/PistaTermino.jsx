import { Info } from 'lucide-react'

/**
 * Icono de ayuda (i) con una explicación breve del término financiero.
 *
 * Se muestra al pasar el ratón y también al recibir el foco con el
 * teclado (`group-focus-within`), así que no es una ayuda reservada a
 * quien usa ratón. El texto va además en `aria-describedby` implícito vía
 * `role="tooltip"`, de modo que un lector de pantalla lo anuncia.
 *
 * El elemento es un `<button type="button">` y no un `<span>`: necesita
 * ser enfocable para que la pista sea accesible, y `type="button"` evita
 * que envíe un formulario si algún día se anida en uno.
 *
 * @param {{ texto: string, etiqueta?: string }} props - `etiqueta` nombra
 *   el término para el lector de pantalla.
 */
export default function PistaTermino({ texto, etiqueta = 'este indicador' }) {
  return (
    <span className="group relative inline-flex shrink-0 align-middle">
      <button
        type="button"
        // Dos puntos y no "Qué significa X": hay términos que llegan con
        // artículo ("los leads cualificados") y la frase quedaba torcida al
        // leerla un lector de pantalla.
        aria-label={`Qué significa: ${etiqueta}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#4B5563] transition-colors hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-30 hidden w-56 -translate-x-1/2 translate-y-1.5 rounded-lg bg-[#1F2937] px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-white shadow-lg group-hover:block group-focus-within:block"
      >
        {texto}
      </span>
    </span>
  )
}
