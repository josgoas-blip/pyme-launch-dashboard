# Pyme Launch - Dashboard de Control Estratégico y Financiero

Manual de arquitectura e instrucciones para el desarrollo del SaaS Pyme Launch.

## 🎯 Pila Tecnológica (Stack)
- Frontend: React + Tailwind CSS + Recharts + Lucide Icons (Lovable)
- Backend / BD: Supabase (PostgreSQL + Row Level Security - RLS)
- Orquestador: n8n (Webhooks + OpenAI LLM)

## 📋 Reglas Inquebrantables del Proyecto
1. Fidelidad Absoluta a la Guía del Tutor: Respetar sin omisiones los cuadrantes, nombres de variables y fórmulas financieras definidas en la Especificación Técnica v2026.
2. Desarrollo Modular por Componentes: Cada cuadrante del Dashboard debe maquetarse como un componente aislado en src/components/dashboard/.
3. No Hardcodear Datos Sensibles: Todas las claves y tokens deben gestionarse vía variables de entorno (.env).
4. Validación por Fases (Plan mode): Todo cambio debe planearse, implementarse en un bloque corto y ser probado a mano antes de continuar.
5. Idioma: Español de España.

## 🗺️ Estructura del Dashboard (5 Pestañas Obligatorias)
1. Inicio: Estado del Plan (6 Fases), Punto de Equilibrio (Radial Gauge), Métricas Clave (4 Tarjetas), Diagrama de Gantt (8 Hitos x 6 Meses), Indicadores de Inflación.
2. Análisis: Resultados vs Proyecciones (Matriz 5x5), Riesgo DAFO + Medidor, Análisis de Mercado (TAM/SAM/SOM/LTV/Churn/NPS), PESTEL (Hexágono/Radar 6 Ejes) y 5 Fuerzas de Porter (Pentágono/Radar 5 Ejes).
3. Estrategia: Matriz de Priorización CAME (Impacto vs Esfuerzo / Scatter Plot) + Barra de Mitigación de Riesgos.
4. Viabilidad: Análisis de Escenarios (VAN/Flujo de Caja - Line Chart 3 Líneas), Indicadores (VAN, TIR, Margen de Seguridad, Score Viabilidad).
5. Configuración: Perfil del cliente, suscripción e integraciones.
