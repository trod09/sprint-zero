# MASTER PROMPT — Plataforma de simulación de Product Management

> Nombre provisional: **Sprint Zero**
> Documento de referencia para desarrollar el producto con Claude Code en 3 fases.
> Guárdalo en la raíz del repositorio (también puedes copiar las secciones 1-5 en `CLAUDE.md`).

---

## 0. Instrucciones para Claude Code (léelas primero)

Eres el ingeniero principal de este proyecto. Vas a construir una plataforma web de **simulaciones interactivas de Product Management**: el equivalente a los *mock cases* de consultoría, pero para PMs. El usuario practica casos, prioriza backlogs, analiza métricas, interpreta experimentos y negocia con stakeholders, y recibe una puntuación y feedback.

Reglas de trabajo:

1. **Trabaja fase a fase.** Solo construyes la fase activa. No implementes nada de fases posteriores salvo lo que la arquitectura necesite para no tener que rehacerlo (interfaces, tipos, carpetas).
2. **Antes de cada hito, propón un plan breve** (archivos a crear o modificar, decisiones clave) y espera mi aprobación.
3. **Pasos pequeños y verificables.** Al terminar cada hito: el proyecto compila, los tests pasan y me dices cómo probarlo en el navegador.
4. **Commit de git al cerrar cada hito**, con mensajes claros (`feat(backlog): sprint capacity bar`).
5. **Los números los genera el código, no el LLM.** Datasets, métricas y soluciones óptimas se calculan de forma determinista con semillas. El LLM solo redacta textos (tickets, narrativa, feedback).
6. **La puntuación debe ser reproducible.** Mismo caso + mismas respuestas = misma nota determinista. El feedback de IA complementa la nota, nunca la sustituye.
7. Si algo de este documento es ambiguo o contradictorio, pregúntame antes de decidir.
8. Al terminar una fase, haz un resumen de lo construido, lo pendiente y la deuda técnica, y espera mi OK antes de empezar la siguiente.

**Fase activa: FASE 1.** Empieza leyendo todo el documento y proponiendo el plan del Hito 1.1.

---

## 1. Visión de producto

- **Problema:** prepararse para entrevistas y roles de PM se hace con vídeos, frameworks y preguntas sueltas. Casi nada permite *practicar haciendo*, con consecuencias y feedback.
- **Solución:** un "gimnasio" de PM con módulos de simulación. Cada caso tiene una solución oculta (ground truth) y se puntúa de forma consistente.
- **Usuario principal:** candidatos a APM/PM, estudiantes de máster y perfiles en transición hacia producto.
- **Usuarios futuros (B2B):** universidades, bootcamps y empresas que lo usan como prueba práctica en procesos de selección.
- **Idioma de la interfaz:** inglés (mercado internacional), con la estructura preparada para i18n y añadir español después. El código y los comentarios, en inglés.

---

## 2. Stack técnico

- **Next.js (App Router) + TypeScript (strict) + Tailwind CSS**
- **shadcn/ui** para componentes, **lucide-react** para iconos
- **Recharts** para gráficos y dashboards
- **dnd-kit** para drag & drop
- **Zod** para validar todos los esquemas de casos y las salidas del LLM
- **Vitest** para tests de motores de puntuación y generadores
- **API de Claude** (SDK `@anthropic-ai/sdk`) para generación de texto y feedback. Modelo configurable por variable de entorno `ANTHROPIC_MODEL` (por defecto `claude-sonnet-5-5`)
- **Supabase** (auth + Postgres) a partir de la Fase 2. En Fase 1 el progreso se guarda en `localStorage`
- **Vercel** para el despliegue

Variables de entorno en `.env.local` (y `.env.example` en el repo, sin secretos): `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`.

---

## 3. Arquitectura

### 3.1 Patrón de módulos

Cada módulo de simulación es independiente y sigue el mismo contrato. Añadir un módulo nuevo no debe obligar a tocar el núcleo.

```
/src
  /app                      → rutas (home, /modules/[module], /case/[id], /results/[attemptId])
  /core
    /case-engine            → tipos genéricos, registro de módulos, carga de casos
    /scoring                → utilidades comunes de puntuación
    /ai                     → cliente Claude, prompts base, validación con Zod, reintentos
    /rng                    → generador aleatorio con semilla (p. ej. mulberry32)
    /storage                → capa de persistencia (localStorage en F1, Supabase en F2)
  /modules
    /backlog
      schema.ts             → Zod schema del caso
      generator.ts          → generación determinista con semilla
      scoring.ts            → motor de puntuación determinista
      feedback.ts           → rúbrica y prompt de feedback IA
      /components           → UI del módulo
      /cases                → casos JSON pregenerados
      module.ts             → registro (id, nombre, skill que entrena, dificultad…)
    /metric-drop
      (misma estructura)
  /components               → UI compartida (layout, cards, score breakdown…)
/scripts                    → scripts para generar y validar casos
/tests
```

### 3.2 Contrato de un módulo

```ts
interface SimulationModule<TCase, TPublicCase, TAnswer, TResult> {
  meta: ModuleMeta;                 // id, name, tagline, description, skills, status, icon (seguro para el cliente)
  caseSchema: z.ZodType<TCase>;             // caso completo, con `hidden`
  publicCaseSchema: z.ZodType<TPublicCase>; // lo que ve el cliente antes de enviar
  answerSchema: z.ZodType<TAnswer>;
  toPublicCase(caseData: TCase): TPublicCase;         // quita `hidden` a cualquier profundidad
  score(caseData: TCase, answer: TAnswer): TResult;   // determinista y puro
  feedbackRubric: string;           // rúbrica fija que usa el LLM
}

interface BaseCase {
  id: string;
  moduleId: string;
  seed: number;
  difficulty: "apm" | "pm" | "senior";
  company: { name: string; industry: string; stage: string; description: string };
  title: string;
  brief: string;
  hidden: unknown;                  // ground truth; NUNCA se envía al cliente antes de terminar
}
```

### 3.3 Principios de evaluación

- **Ground truth oculto:** cada caso guarda la solución (causa real, tickets trampa, priorización óptima). El cliente solo recibe la versión sin `hidden` hasta que el usuario envía su respuesta.
- **Nota = parte determinista + feedback IA.** La parte determinista (0-100) es la nota oficial. La IA aporta comentarios cualitativos con una rúbrica fija, salida en JSON restringida por esquema y validada con Zod (un reintento si falla). No se usa `temperature`: los modelos actuales lo rechazan; la profundidad se controla con `effort`.
- **Casos y scoring en servidor desde la Fase 1** (decisión del Hito 1.1): los casos solo se leen desde módulos `server-only`, la nota se calcula en la Server Action `submitAttempt` y el caso completo se devuelve solo tras enviar. El navegador guarda respuesta y nota en `localStorage`; la solución se recupera volviendo a puntuar la respuesta guardada.
- **Desglose siempre visible:** el usuario ve por qué ha sacado esa nota, criterio a criterio.

---

## 4. Diseño y UX

- Estética de herramienta profesional (inspiración: Linear, Amplitude, Notion): limpia, densa en información, rápida.
- Modo claro y oscuro.
- Responsive, pero optimizado para escritorio (es una herramienta de práctica seria).
- Cada caso sigue el flujo: **Brief → Simulación → Envío → Resultados (nota + desglose + feedback + solución explicada)**.
- Microinteracciones cuidadas en drag & drop, barras de capacidad y revelado de resultados.

---

## 5. Catálogo completo de módulos y funcionalidades

### Módulos

1. **Product Case (estilo entrevista):** casos tipo "Diseña X para Y", "¿Cómo mejorarías Spotify para podcasts?" o "Estima el mercado de…". Se responde por pasos: usuario, problema, soluciones y priorización. Evaluación con rúbrica. Modo cronometrado y modo voz con entrevistador IA que repregunta.
2. **Backlog Simulator:** empresa ficticia con backlog de 20-40 tickets (features, bugs, deuda técnica, peticiones de ventas y del CEO). Información a medias y tickets trampa (duplicados, petición de un solo cliente, bug crítico escondido). Priorización con RICE, MoSCoW o arrastrando, con capacidad de sprint limitada. Eventos a mitad de sprint (caída de producción, promesa de ventas a un cliente grande, baja de un dev) que obligan a replanificar. Resultado simulado: métricas, satisfacción de stakeholders y deuda acumulada.
3. **Metric Drop / Root Cause:** "Los DAU han caído un 15% esta semana, averigua por qué". Dashboard falso tipo Amplitude con datos sintéticos, segmentable por plataforma, país, versión de app y canal. Causa real escondida (p. ej. release de Android roto en una versión concreta).
4. **A/B Test Interpreter:** resultados de experimentos con trampas (sample ratio mismatch, efecto novedad, paradoja de Simpson, guardrail que empeora). Decisión: ship, iterar o matar, con justificación.
5. **User Interview Simulator:** usuario IA con pain points ocultos que solo se descubren con buenas preguntas (abiertas, no sesgadas, sobre comportamiento pasado). Puntuación de insights descubiertos y preguntas sesgadas.
6. **Stakeholder Arena:** chat con personajes IA con intereses en conflicto (CTO que quiere pagar deuda técnica, head of sales que quiere features para clientes, CEO obsesionado con un competidor). Negociar y alinear.
7. **Feedback Triage:** inbox con ~60 reviews de App Store, tickets de soporte y NPS. Agrupar temas, detectar el problema importante entre el ruido y convertirlo en oportunidades.
8. **PRD / One-pager Writer:** a partir de un brief, escribir el PRD (problema, métricas de éxito, alcance y no-alcance, riesgos). Feedback de IA línea a línea.
9. **Roadmap & OKRs:** planificar un trimestre con objetivos de empresa, equipo limitado y dependencias entre equipos.
10. **UX Critique:** pantalla generada con problemas de usabilidad metidos a propósito; el usuario debe encontrarlos.
11. **Casos rápidos:** pricing, go-to-market de un lanzamiento, gestión de un incidente con comunicación a usuarios, decisión build vs buy vs partner.

### Capa de engagement

- **Modo carrera:** PM de una startup ficticia durante 12 "semanas"; decisiones de backlog, experimentos y stakeholders que se acumulan y hacen evolucionar las métricas.
- **Caso diario** estilo Wordle: mismo caso para todos, con ranking y rachas.
- **Radar de skills** (ejecución, analítica, product sense, comunicación) con ELO por skill.
- **Packs por empresa/sector:** marketplaces, fintech, apps de consumo, SaaS B2B.
- **Niveles de dificultad:** APM, PM y Senior (más ambigüedad y más eventos al subir).
- **Comparar respuesta** con la de otros usuarios o con una respuesta ideal anotada.

---

## 6. FASE 1 — MVP: núcleo + Backlog Simulator + Metric Drop

**Objetivo:** una web desplegada donde se pueden jugar casos completos de los dos módulos estrella, con puntuación determinista, feedback de IA y solución explicada. Sin login.

### Hito 1.1 — Fundaciones
- Proyecto Next.js + TS + Tailwind + shadcn/ui, ESLint, Prettier y Vitest configurados.
- Estructura de carpetas de la sección 3, contrato `SimulationModule`, registro de módulos.
- RNG con semilla (`/core/rng`) con tests.
- Capa `storage` sobre `localStorage` (intentos, notas, historial) detrás de una interfaz que luego implementará Supabase.
- Cliente de Claude (`/core/ai`) con salida JSON validada por Zod y un reintento si la validación falla.
- Layout base, home con tarjetas de módulos (los no disponibles, como "Coming soon") y modo claro/oscuro.

### Hito 1.2 — Backlog Simulator: modelo de datos y casos
Esquema del ticket (orientativo, ajústalo si ves mejoras):

```ts
Ticket {
  id, title, description,
  type: "feature" | "bug" | "tech_debt" | "sales_request" | "ceo_request",
  requester: string,                  // "Sales – Laura", "CEO", "Support", "Eng"…
  effort: number,                     // story points
  visible: { reach?: number; impactHint?: string; supportTickets?: number; revenueAtRisk?: number },
  hidden: {
    trueValue: number,                // valor real 0-100
    trap: "none" | "duplicate" | "single_customer" | "hidden_critical_bug" | "vanity" | "low_evidence",
    duplicateOf?: string,
    critical: boolean,
    debtImpact: number                // deuda que genera o reduce
  }
}
BacklogCase extends BaseCase {
  sprintCapacity: number,
  tickets: Ticket[],                  // 20-40
  stakeholders: { name, role, priorities: string[] }[],
  midSprintEvents: Event[],           // 1-2 según dificultad
  baselineMetrics: { activation, retention, nps, revenue, techDebt }
}
```

- Generador determinista por semilla que monta casos combinando plantillas de empresa y tickets; los textos se redactan una vez con Claude mediante un script (`/scripts/generate-backlog-cases.ts`) y se guardan como JSON validado.
- **10 casos pregenerados** repartidos en industrias (fintech, marketplace, SaaS B2B, consumo) y dificultades.
- La **priorización óptima** se calcula en código (knapsack sobre `trueValue` con capacidad, con restricciones de tickets críticos obligatorios). Tests incluidos.

### Hito 1.3 — Backlog Simulator: interfaz
- Vista del backlog: lista/tablero con filtros por tipo y solicitante y detalle de ticket en panel lateral.
- Tres modos de priorización: **arrastrar** al sprint, **RICE** (el usuario puntúa y se ordena) y **MoSCoW**.
- Barra de capacidad del sprint que avisa al pasarse.
- Marcar tickets como "duplicado" o "descartar" con motivo.
- Botón "Commit sprint".

### Hito 1.4 — Eventos a mitad de sprint
- Tras el commit, se dispara un evento (caída de producción, promesa de ventas, baja de un dev) que cambia capacidad o añade un ticket urgente.
- El usuario replanifica y vuelve a confirmar.

### Hito 1.5 — Puntuación y resultados del Backlog
Desglose determinista (pesos orientativos):
- Valor entregado vs óptimo: 40%
- Tickets críticos atendidos: 20%
- Trampas evitadas (duplicados, peticiones de un solo cliente, vanity): 15%
- Gestión del evento a mitad de sprint: 15%
- Capacidad respetada: 10%

Pantalla de resultados: nota, desglose, simulación de métricas antes y después, satisfacción por stakeholder, deuda acumulada, comparativa "tu sprint vs sprint óptimo" y explicación de cada trampa. Feedback de IA con rúbrica (qué hiciste bien, qué mejorar, principio de PM a recordar).

### Hito 1.6 — Metric Drop: datos sintéticos y casos
- Generador de series diarias (60-90 días) con dimensiones: plataforma, país, versión de app, canal de adquisición, tipo de usuario (nuevo/recurrente).
- Inyección de **una causa raíz** (p. ej. versión 4.2.0 de Android con crash en el onboarding) y **1-2 pistas falsas** (estacionalidad en un país, fin de una campaña de marketing).
- Métricas: DAU, nuevos registros, activación, sesiones, conversión.
- **5 casos pregenerados** con distinta causa raíz. Tests que comprueban que la anomalía está donde dice el ground truth.

### Hito 1.7 — Metric Drop: interfaz y puntuación
- Dashboard tipo Amplitude: gráfico principal, selector de métrica, selector de rango y desglose por dimensión (breakdown + filtros).
- Registro de cada exploración que hace el usuario.
- Envío de diagnóstico: segmento afectado (dimensión + valor), categoría de causa (bug, marketing, estacionalidad, producto, externa…), siguiente acción recomendada y justificación breve.
- Puntuación: segmento correcto 40%, causa correcta 25%, eficiencia de exploración 15%, no caer en pistas falsas 10%, calidad de la acción recomendada (IA con rúbrica) 10%.
- Resultados con el "camino ideal" de investigación explicado.

### Hito 1.8 — Pulido y despliegue
- Historial de intentos en el perfil local y biblioteca de casos con filtros (módulo, industria, dificultad, completado).
- Estados vacíos, carga y error cuidados.
- README con instrucciones para arrancar el proyecto y generar casos.
- Despliegue en Vercel.

**Definition of Done de la Fase 1:** se pueden jugar de principio a fin los 10 casos de backlog y los 5 de metric drop, la nota es reproducible, los tests de scoring y generadores pasan y la app está desplegada.

---

## 7. FASE 2 — Motor de contenido, cuentas y más módulos

**Objetivo:** pasar de casos fijos a casos infinitos, añadir usuarios reales y ampliar a los módulos de análisis y producto escrito.

### Hito 2.1 — Cuentas y persistencia
- Supabase: login (email + Google), tablas de usuarios, casos, intentos y puntuaciones.
- Migrar la capa `storage` a Supabase manteniendo la interfaz; importar el historial de `localStorage` al crear cuenta.
- El ground truth vive en servidor; el cliente nunca recibe `hidden` antes de enviar.

### Hito 2.2 — Generación automática de casos
- Generación bajo demanda: semilla + industria + dificultad → caso completo.
- Pipeline: el código genera estructura y números → Claude redacta textos → validación con Zod → comprobaciones de coherencia (que las trampas existan, que la anomalía sea detectable, que el óptimo sea calculable) → guardado.
- Caché de casos generados y límite de generaciones por usuario.
- Niveles de dificultad APM / PM / Senior aplicados a todos los módulos (más ambigüedad, más eventos, más pistas falsas).

### Hito 2.3 — A/B Test Interpreter
- Resultados de experimentos generados en código con trampas: sample ratio mismatch, efecto novedad, paradoja de Simpson, guardrail que empeora, falta de potencia estadística.
- Decisión ship / iterar / matar + justificación. Puntuación determinista (trampa detectada, decisión correcta) + IA para la justificación.

### Hito 2.4 — Feedback Triage
- Inbox de ~60 elementos (reviews, tickets de soporte, comentarios NPS) con temas ocultos y un problema crítico escondido entre el ruido.
- El usuario agrupa por temas (drag & drop a clusters), prioriza y redacta oportunidades.
- Puntuación: cobertura de temas, problema crítico detectado y calidad de oportunidades (IA).

### Hito 2.5 — Product Case (estilo entrevista)
- Tipos: product design, mejora de producto, estimación y estrategia.
- Respuesta guiada por pasos (usuario, problema, soluciones, priorización, métricas) con modo cronometrado.
- Evaluación con rúbrica por paso y respuesta ideal anotada.

### Hito 2.6 — PRD / One-pager Writer
- Brief generado → editor estructurado (problema, objetivos, métricas de éxito, alcance, no-alcance, riesgos, preguntas abiertas).
- Feedback de IA anclado a secciones y frases concretas.

### Hito 2.7 — UX Critique
- Pantallas generadas como componentes HTML con problemas de usabilidad inyectados de un catálogo (contraste, jerarquía, CTA confuso, formulario largo, falta de feedback…).
- El usuario marca zonas y describe el problema. Puntuación por problemas encontrados y falsos positivos.

### Hito 2.8 — Radar de skills
- Cada módulo alimenta una o varias skills (ejecución, analítica, product sense, comunicación, estrategia).
- Dashboard personal: radar de skills, evolución en el tiempo y recomendaciones del siguiente caso a practicar según tus puntos débiles.

**Definition of Done de la Fase 2:** usuarios con cuenta, casos ilimitados generados con validación, 7 módulos jugables y radar de skills funcionando.

---

## 8. FASE 3 — Simulaciones conversacionales, modo carrera y comunidad

**Objetivo:** las experiencias más diferenciales (IA conversacional y simulación continua) y la capa social y de negocio.

### Hito 3.1 — User Interview Simulator
- Persona IA con perfil, contexto y pain points ocultos definidos en el ground truth.
- La persona solo revela información ante buenas preguntas (abiertas, sobre comportamiento pasado, sin sesgar).
- Análisis automático de cada pregunta (abierta/cerrada, sesgada, hipotética) e insights descubiertos vs totales.

### Hito 3.2 — Stakeholder Arena
- Chat con 2-3 personajes IA con objetivos, líneas rojas y nivel de confianza hacia ti que cambia con la conversación.
- Objetivo del caso: llegar a un acuerdo (p. ej. qué entra en el trimestre). Puntuación por alineamiento final, concesiones y calidad de la argumentación.

### Hito 3.3 — Roadmap & OKRs
- Objetivos de empresa, equipos con capacidad limitada e iniciativas con dependencias.
- El usuario redacta OKRs y monta el roadmap trimestral en un timeline. Puntuación por coherencia OKR-iniciativas, dependencias respetadas y capacidad.

### Hito 3.4 — Casos rápidos
- Pricing, go-to-market de un lanzamiento, gestión de incidente con comunicación a usuarios, build vs buy vs partner. Formato corto (10-15 min) reutilizando el motor de Product Case.

### Hito 3.5 — Modo voz
- Product Case y User Interview en voz: entrevistador IA que repregunta. Transcripción y misma evaluación que el modo texto.

### Hito 3.6 — Modo carrera
- Startup ficticia durante 12 "semanas". Cada semana combina módulos (sprint de backlog, una caída de métrica, un experimento, una reunión con stakeholders).
- Estado persistente de la empresa: métricas, deuda técnica, moral del equipo y confianza de stakeholders, que evolucionan según tus decisiones.
- Final con informe de "performance review" del PM.

### Hito 3.7 — Comunidad y engagement
- **Caso diario** igual para todos, con ranking y rachas.
- **ELO por skill** y leaderboards (global y por amigos/universidad).
- **Packs por empresa/sector.**
- **Comparar respuestas** con otros usuarios (agregado anónimo) y con la respuesta ideal anotada.

### Hito 3.8 — Monetización y B2B
- Freemium: X casos gratis al mes; plan Pro con casos ilimitados, modo carrera y modo voz (Stripe).
- Espacio para organizaciones: universidades o empresas que asignan casos, ven resultados de sus alumnos o candidatos y crean casos propios.

**Definition of Done de la Fase 3:** todos los módulos del catálogo disponibles, modo carrera completo, caso diario con rankings y pagos funcionando.

---

## 9. Calidad transversal (todas las fases)

- Tests de Vitest para todo motor de puntuación y generador (incluido "mismo input → misma nota").
- Ningún secreto en el cliente; las llamadas a Claude siempre desde el servidor.
- Control de coste de IA: caché, límites por usuario y registro de tokens consumidos.
- Accesibilidad básica: navegación por teclado (también en drag & drop), contraste y etiquetas.
- Código tipado de forma estricta, sin `any` salvo justificado.

---

**Empieza ahora:** confirma que has entendido el documento, señala cualquier duda o mejora que propongas en la arquitectura y presenta el plan del **Hito 1.1**.
