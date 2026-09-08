/** @type {import('tailwindcss').Config} */
// Tokens de color y tipografía sincronizados con design.md (Design System - Pyme Launch)
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Verde Corporativo Pyme Launch (Header y acentos principales)
        primary: '#1B4D3E',
        'primary-hover': '#143A2F',
        // Indicadores semafóricos
        'accent-green': '#10B981', // Satisfactorio / Completado
        'accent-amber': '#DD6B20', // Fuerte / Advertencia
        'accent-red': '#E53E3E',   // Deficiente / Riesgo Alto
        // Superficies y fondos
        canvas: '#F9FAFB',         // Fondo gris neutro ultra-claro -> bg-canvas
        surface: '#FFFFFF',        // Fondo de tarjetas e indicadores -> bg-surface
        // Texto
        main: '#1F2937',           // Títulos y cifras -> text-main
        muted: '#6B7280',          // Etiquetas -> text-muted
        // Borde estándar de tarjeta (design.md)
        'card-border': '#E5E7EB',
        // Verde de zona "correcta" en gauges/gantt (design.md)
        'gauge-green': '#38A169',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px', // card-radius (design.md)
      },
    },
  },
  plugins: [],
}
