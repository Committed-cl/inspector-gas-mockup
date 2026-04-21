# Inspector Gas — Mockup

Maqueta navegable de **Inspector Gas**, app móvil *voice-first* con IA para inspecciones de obra en instalaciones de gas natural.

Propuesta construida por **Committed** para presentación a Metrogas.

## Demo en vivo

Una vez desplegada, la maqueta estará disponible en:
**https://committed-cl.github.io/inspector-gas-mockup/**

## Ejecutar localmente

```bash
npm install
npm run dev
```

Abrir http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Pantallas

- `/` — Splash / Landing de la demo
- `/login` — Autenticación del inspector
- `/proyectos` — Lista de proyectos asignados
- `/proyectos/:id` — Detalle de proyecto con histórico y acceso a nueva visita
- `/visita/nueva` — Declaración inicial por voz
- `/visita/en-curso` — **Pantalla estelar:** checklist con semáforo + botón de voz
- `/visita/revisar` — Revisión previa al envío (todo en verde)
- `/visita/enviado` — Confirmación de envío
- `/admin/etapas` — Backoffice: listado de etapas
- `/admin/items/:id` — Backoffice: detalle y entrenamiento IA de un ítem

## Stack

React 18 · Vite · TypeScript · Tailwind CSS · React Router v6. Deploy vía GitHub Actions → GitHub Pages.
