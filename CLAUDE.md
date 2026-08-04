# CLAUDE.md — Business Process Automator (RPA + IA)

Este archivo proporciona contexto a Claude Code al trabajar en este repositorio.

---

## 👤 Contexto del desarrollador

Nivel intermedio en desarrollo, aprendiendo workflows profesionales con Claude Code.
Prefiere explicaciones breves del "por qué" en decisiones técnicas no triviales, no solo el código.
Este es el segundo proyecto de una serie de portafolio (el primero, "Financial AI Insights Platform", ya está completado).

---

## 🎯 Objetivo del proyecto

Construir **Business Process Automator**: una plataforma web que permite crear flujos de automatización sin código (workflow builder visual), ejecutar tareas repetitivas de negocio, e incorporar **IA generativa (Claude API)** para tareas que requieren "entendimiento" — extracción de datos, clasificación de documentos, generación de contenido.

**Propósito estratégico:** demostrar pensamiento de sistemas (motor de ejecución, no solo CRUD) y aplicación de IA a procesos empresariales reales. Complementa al Proyecto 1 (IA aplicada a datos) mostrando ahora "IA aplicada a procesos".

---

## 🧱 Stack técnico

```
Frontend:      React + Vite + TailwindCSS + React Flow (workflow builder visual)
Backend:       Node.js + Express
Base de datos: PostgreSQL + Prisma ORM
IA:            Claude API (Anthropic) — modelo claude-sonnet-4-6
Automatización: node-cron (tareas programadas) + Puppeteer (scraping, si aplica)
Integraciones: Google Sheets API, Gmail API (opcional)
Auth:          JWT
Deploy:        Vercel (frontend) + Railway o Render (backend + DB)
```

**Notas de decisión:**
- React Flow elegido para el workflow builder por su soporte nativo de nodos/conexiones drag-and-drop en React.
- node-cron sobre soluciones externas (ej. servicios de scheduling pagos) para mantener el MVP simple y sin costos adicionales.
- Mismo stack base que el Proyecto 1 (Node + React + Prisma) para reutilizar conocimiento y acelerar desarrollo.
- **Prisma v6** (no v7): la v7 requiere "driver adapters" explícitos y ya no permite `url` directo en el `datasource` del schema — más complejo y menos estandarizado. Se usó v6, ampliamente documentada, que permite el flujo clásico `DATABASE_URL` + `prisma migrate dev`.
- **`schema.prisma` vive en `backend/prisma/schema.prisma`** (ubicación estándar de Prisma), no en un `database/` a nivel raíz: Prisma infiere la raíz del proyecto caminando hacia arriba desde la carpeta del schema, y como `database/` no es ancestro de `backend/`, el CLI terminaba creando un `package.json`/`node_modules` fantasma en la raíz del repo al generar el cliente. Mantener el schema dentro de `backend/` evita ese conflicto.
- **TailwindCSS v4** vía `@tailwindcss/vite` (plugin de Vite) en vez del setup clásico con `tailwind.config.js` + `postcss.config.js` — es el flujo actual recomendado por Tailwind, más simple de mantener.
- **Backend en ESM** (`"type": "module"` en `package.json`), no CommonJS, para consistencia con el `import` del frontend.
- **PostgreSQL local vía Postgres.app** (no Homebrew): la máquina de desarrollo ya tenía Postgres.app corriendo en el puerto 5432 (usuario `arseniobarrios`, sin password); se usó eso en vez de compilar Postgres desde código fuente con `brew install postgresql`.
- **`nodemonConfig.ext` incluye `env`** en `backend/package.json`: por defecto nodemon solo vigila `js,mjs,cjs,json`, así que un cambio en `.env` (ej. actualizar `ANTHROPIC_API_KEY`) no reiniciaba el proceso y el server seguía usando el valor viejo en memoria. Se agregó `env` a las extensiones vigiladas para que un cambio de `.env` sí dispare el reinicio.
- El nodo de IA implementa los 3 subtipos (extracción, clasificación, generación) desde el Punto 5 en vez de solo extracción — los 3 prompts ya estaban documentados en este archivo y el costo extra fue mínimo (una función más en `claudeService.js`).
- **Reintentos con backoff son globales (3 intentos, 500ms→1s→2s), no configurables por nodo desde la UI**: agregar un control de reintentos a cada componente de nodo (4 tipos) era complejidad extra para un caso que en el MVP solo importa para el nodo de IA (dependiente de una API externa). Si hace falta configurarlo por nodo más adelante, es un cambio pequeño y localizado en `executor.js` + los componentes de nodo.
- **`engine/scheduler.js` reemplaza al `engine/queue.js`** que se había anticipado en la estructura original: no hizo falta una cola de ejecución real para triggers programados — `node-cron` ya serializa sus propios disparos, y cada ejecución programada simplemente llama a `runWorkflow()` (la misma función que usa la ejecución manual). Si en el futuro se necesita paralelismo controlado o rate-limiting entre ejecuciones, ahí sí se justificaría una cola de verdad.
- **Reprogramación de cron en caliente**: `scheduler.js` mantiene un `Map` en memoria de tareas activas; cada vez que se guarda un workflow (`PUT /api/workflows/:id`), el controller llama a `scheduleWorkflow()`/`unscheduleWorkflow()` de nuevo — así un cambio de horario o desactivar el cron tiene efecto inmediato sin reiniciar el servidor. Al arrancar el proceso, `initScheduler()` reconstruye el `Map` desde la base de datos.
- **Google Sheets vía Service Account** (no OAuth por usuario): la cuenta de servicio se comparte manualmente con cada hoja que necesite acceso (dando permiso de Editor al `client_email` de las credenciales). Mucho más simple que implementar un flujo OAuth completo con refresh tokens para un MVP de portafolio; la contrapartida es que todas las hojas que el sistema puede tocar deben compartirse explícitamente con esa cuenta de servicio.
- **Credenciales de Google en `backend/credentials/google-service-account.json`** (gitignored, igual que `.env`), referenciado desde `.env` vía `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`. Nunca se commitea.
- **Vulnerabilidad transitiva en `googleapis`** (`gaxios`→`rimraf`→`glob`→`brace-expansion`, severidad alta según `npm audit`): es código de limpieza de temporales para subidas multipart, que este proyecto no usa (solo lectura/escritura simple de rangos). No hay fix upstream disponible sin downgrades rotos; riesgo real bajo para este caso de uso, se dejó documentado en vez de forzar un `npm audit fix --force`.
- **`node-cron` v4 soporta expresiones de 6 campos (con segundos)** además del formato estándar de 5 campos — útil para probar triggers programados en desarrollo sin esperar minutos enteros (ej. `*/5 * * * * *`).
- **Alertas por email vía Resend**, con remitente `onboarding@resend.dev` (dominio de pruebas de Resend, sin verificar dominio propio): en modo sandbox (sin dominio verificado) Resend solo permite enviar a la dirección con la que te registraste en su cuenta — suficiente para el propósito de portafolio/demo, pero para un producto real con múltiples usuarios habría que verificar un dominio propio para poder notificar a cualquier email.
- **Gotcha recurrente: nodemon + cambios en `.env` durante testing rápido**: aunque `nodemonConfig.ext` incluye `env` (ver nota arriba), si se editan `.env` y algún `.js` casi al mismo tiempo, el proceso viejo puede tardar un momento en morir (conexiones de Prisma cerrando) y responder una request de prueba con el valor viejo todavía en memoria, dando falsos negativos/positivos raros (pasó con `ANTHROPIC_API_KEY` y de nuevo con `RESEND_API_KEY`). Si una prueba con una key recién cambiada da un resultado que no tiene sentido, lo primero es esperar 1-2s extra y reintentar antes de asumir que el código está mal.
- **Rediseño visual con Tailwind v4 + `@theme`**: paleta "brand" (violeta) y fuente Inter (`@fontsource/inter`, self-hosted) definidas en `frontend/src/index.css` en vez de un `tailwind.config.js` — es el flujo nativo de Tailwind v4. Iconos con `lucide-react`. Componentes base reutilizables en `frontend/src/components/ui/` (Button, Badge, Card, Input, ConfirmDialog, ToastProvider) para no repetir clases de Tailwind en cada página.
- **Borrado de workflow es manual en cascada** (`ExecutionLog` → `Execution` → `Workflow` dentro de una `$transaction`), no `onDelete: Cascade` en el schema: como el resto del proyecto ya asume borrado manual (ver nota de Prisma v6/schema), mantener el mismo patrón en vez de mezclar dos enfoques distintos de integridad referencial.
- **Duplicar un workflow no copia el `cronExpression`**: si lo copiara, dos workflows quedarían corriendo automáticamente en el mismo horario sin que el usuario lo pida explícitamente — se duplica solo `definicionJson`, el cron hay que configurarlo de nuevo a propósito en la copia.
- **Sesión expirada (401) fuerza `window.location.assign('/login')`** en vez de usar el router de React: el interceptor vive en `services/api.js`, fuera del árbol de componentes, así que no tiene acceso a `useNavigate()`. Un reload completo es aceptable para este caso (poco frecuente, y limpia cualquier estado stale de golpe).
- **Validación de nodos es solo visual, no bloquea guardar/ejecutar**: un nodo de Acción sin `spreadsheetId`/`range`, o un nodo con más de una conexión saliente (el motor solo sigue la primera), se marcan con un ícono de advertencia en el canvas — pero no impiden guardar. Bloquear el guardado hubiera requerido más validación de la que vale la pena para un MVP; el objetivo es que el usuario se entere antes de ejecutar, no impedirle guardar un borrador a medio armar.
- **Credenciales de Google Sheets: archivo local en dev, variable de entorno en producción.** `googleSheetsService.js` usa `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` (el archivo gitignored) si existe; si no, cae a `GOOGLE_SERVICE_ACCOUNT_JSON` (el JSON completo como string). La mayoría de los hosts (Railway/Render) no tienen filesystem persistente para "subir" el archivo de credenciales, así que en producción hay que pegar el JSON completo como variable de entorno.
- **CORS restringido a `FRONTEND_URL`** (`cors({ origin: env.frontendUrl })`) en vez de abierto a cualquier origen: en local apunta a `http://localhost:5173` por default; en producción hay que setearlo a la URL real del frontend deployado.
- **`backend/package.json` tiene un script `build`: `prisma generate && prisma migrate deploy`** — es lo que hay que configurar como build command en Railway/Render antes del `npm start`, para que las migraciones se apliquen automáticamente contra la base de producción en cada deploy (a diferencia de `migrate dev`, `migrate deploy` no pregunta nada ni genera migraciones nuevas, solo aplica las que ya existen — apto para CI/CD).

---

## 📁 Estructura del proyecto

```
business-process-automator/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── nodes/          # TriggerNode, IANode, ConditionNode, AccionNode, EndNode, NodeChrome
│   │   │   ├── edges/          # DeletableEdge (conexión con botón de borrar al seleccionarla)
│   │   │   └── ui/             # Button, Badge, Card, Input, ConfirmDialog, ToastProvider, Logo
│   │   ├── pages/             # Dashboard, WorkflowBuilder, Executions, Login
│   │   ├── hooks/             # useAuth, useWorkflows, useExecutions
│   │   ├── services/          # Llamadas a la API backend
│   │   ├── data/               # exampleWorkflow.js (flujo de ejemplo precargable)
│   │   ├── App.jsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── routes/                # auth, workflows, executions
│   ├── controllers/           # Lógica de negocio de cada endpoint
│   ├── models/                # (reservado; los modelos viven en prisma/schema.prisma)
│   ├── engine/                 # Motor de ejecución de flujos (core del proyecto)
│   │   ├── executor.js         # Interpreta y ejecuta el JSON del flujo (soporta ramas + reintentos)
│   │   ├── scheduler.js         # Programa/reprograma triggers cron (node-cron) por workflow
│   │   └── nodes/              # Lógica de cada tipo de nodo (trigger, ia, condicion, accion, end)
│   ├── middleware/             # auth.middleware.js, error.middleware.js
│   ├── services/              # claudeService.js, googleSheetsService.js
│   ├── config/                # env.js, prisma.js
│   ├── credentials/            # google-service-account.json (gitignored, nunca se commitea)
│   ├── prisma/
│   │   ├── schema.prisma      # Modelo de datos (ver sección "Modelo de datos")
│   │   └── migrations/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── CLAUDE.md                  # Este archivo
└── README.md
```

---

## 🗄️ Modelo de datos (referencia)

```prisma
model User {
  id        String     @id @default(uuid())
  email     String     @unique
  password  String
  nombre    String
  createdAt DateTime   @default(now())
  workflows Workflow[]
}

model Workflow {
  id             String       @id @default(uuid())
  userId         String
  user           User         @relation(fields: [userId], references: [id])
  nombre         String
  descripcion    String?
  definicionJson Json         // estructura del flujo: nodos y conexiones
  activo         Boolean      @default(true)
  cronExpression String?      // ej. "0 9 * * *" — si está seteado, corre solo vía node-cron
  createdAt      DateTime     @default(now())
  executions     Execution[]
}

model Execution {
  id           String          @id @default(uuid())
  workflowId   String
  workflow     Workflow        @relation(fields: [workflowId], references: [id])
  estado       String          // "pendiente" | "ejecutando" | "exitoso" | "fallido"
  resultado    Json?
  iniciadoEn   DateTime        @default(now())
  finalizadoEn DateTime?
  logs         ExecutionLog[]
}

model ExecutionLog {
  id          String    @id @default(uuid())
  executionId String
  execution   Execution @relation(fields: [executionId], references: [id])
  nodoId      String
  mensaje     String
  nivel       String    // "info" | "warning" | "error"
  timestamp   DateTime  @default(now())
}
```

---

## 🤖 Integración con Claude API (nodo de IA)

**Ubicación:** `backend/services/claudeService.js`, consumido desde `backend/engine/nodes/`

**Flujo:**
1. El motor de ejecución (`executor.js`) llega a un nodo de tipo "IA"
2. Toma el output del nodo anterior (texto, JSON o archivo) como input
3. Construye el prompt según el subtipo de nodo (extracción, clasificación, generación)
4. Llama a Claude API, parsea la respuesta
5. Pasa el resultado al siguiente nodo y registra el paso en `ExecutionLog`

**Prompts base por tipo de nodo:**

*Extracción de datos:*
```
Extrae los siguientes campos de este documento: [monto, fecha, proveedor, concepto]

Documento: [texto del documento]

Responde SOLO en JSON con esos campos exactos.
```

*Clasificación:*
```
Clasifica el siguiente texto en una de estas categorías: [Urgente, Normal, Baja prioridad]

Texto: [contenido]

Responde solo con la categoría.
```

*Generación de contenido:*
```
Genera un resumen breve y accionable del siguiente contenido: [texto]

Responde en español, máximo 3 líneas.
```

**Notas importantes:**
- Usar el modelo `claude-sonnet-4-6` vía API estándar de Anthropic (`/v1/messages`).
- API key vía variable de entorno `ANTHROPIC_API_KEY`, nunca hardcodeada.
- Pedir siempre salida en JSON estructurado en nodos de extracción/clasificación para facilitar el parseo automático en el motor de ejecución.

---

## 📊 Integración con Google Sheets (nodo de Acción)

**Ubicación:** `backend/services/googleSheetsService.js`, consumido desde `backend/engine/nodes/accion.node.js`

**Auth:** Service Account de Google Cloud (ver "Notas de decisión"). El JSON de credenciales vive en `backend/credentials/google-service-account.json` (gitignored), referenciado vía `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` en `.env`. Cada hoja que el sistema necesite tocar debe compartirse manualmente (permiso Editor) con el `client_email` de esas credenciales.

**Configuración del nodo (`node.data`):**
- `operacion`: `"leer"` | `"escribir"`
- `spreadsheetId`: el ID de la hoja (string entre `/d/` y `/edit` en la URL)
- `range`: rango A1 (ej. `"Hoja 1!A1:D10"`)

**Comportamiento:**
- `leer` ignora el input y devuelve las filas del rango como array de arrays
- `escribir` toma el `input` del nodo anterior (objeto o array — si es objeto, usa `Object.values()`) y lo agrega como fila nueva al final del rango

---

## 📧 Alertas por email (fallo de ejecución)

**Ubicación:** `backend/services/emailService.js`, disparado desde el `catch` de `runWorkflow()` en `engine/executor.js`

**Flujo:** cuando una ejecución agota los reintentos de un nodo y termina en `estado: "fallido"`, el executor busca el `email` del dueño del workflow (`prisma.user.findUnique`) y le manda un correo con el nombre del workflow, el id de la ejecución y el mensaje de error. El envío está envuelto en su propio try/catch — si Resend falla, se loguea en consola pero **no** oculta ni reemplaza el error original del workflow.

**Auth:** `RESEND_API_KEY` en `.env`. Remitente fijo `onboarding@resend.dev` (ver "Notas de decisión" sobre el límite del modo sandbox).

---

## 🚦 Fases de desarrollo

### Fase 1 — MVP: Motor básico + Workflow simple
- [x] Setup de proyecto (frontend Vite + backend Express + PostgreSQL) — completado, ver "Notas de decisión"
- [x] Autenticación (registro/login con JWT) — `auth.controller.js`, `auth.middleware.js`, store `useAuth` (zustand) en frontend
- [x] Workflow builder visual simple (React Flow) con 3 tipos de nodo: Trigger manual, Acción (IA), Fin — con guardado/carga de `definicionJson` contra el backend
- [x] Motor de ejecución básico (ejecuta nodos en secuencia) — `engine/executor.js`, recorre el grafo desde el Trigger, loguea cada paso en `ExecutionLog`, corta el flujo sin tumbar el servidor si un nodo falla
- [x] Primer nodo con Claude API (extracción de datos de texto) — `services/claudeService.js` + `engine/nodes/ia.node.js`; de paso se implementaron también los prompts de clasificación y generación (mismo costo, ya estaban documentados en este archivo), seleccionables desde el nodo de IA en el builder

**Fase 1 completa.**

### Fase 2 — Automatización real + integraciones
- [x] Nodo de condición (if/else) — `engine/nodes/condicion.node.js`, dos salidas (true/false) vía `sourceHandle` en el edge; `executor.js` generalizado para soportar ramas
- [x] Manejo de errores y reintentos por nodo — `runWithRetry()` en `executor.js`, 3 intentos con backoff exponencial (500ms/1s/2s), logs `warning` por intento
- [x] Sistema de logs detallado por ejecución — cada log incluye duración (ms) y snapshot recortado de input/output
- [x] Trigger programado (cron jobs con node-cron) — `engine/scheduler.js`, reprogramación en caliente al guardar el workflow, campo `cronExpression` en el builder
- [x] Integración Google Sheets (leer/escribir) — `services/googleSheetsService.js` + nodo `accion`, autenticado con Service Account, probado end-to-end escribiendo y leyendo de una hoja real

**Fase 2 completa.**

### Fase 3 — Pulido y caso de uso real
- [x] Dashboard de monitoreo con historial de ejecuciones — `ExecutionsPage.jsx` (`/workflows/:id/executions`), lista + detalle de logs por ejecución, linkeado desde Dashboard y builder
- [x] Alertas automáticas (email al fallar un flujo) — `services/emailService.js` con Resend, disparado desde el `catch` de `runWorkflow()` en `executor.js`, probado end-to-end
- [x] Ejemplo real documentado: automatizar un proceso concreto (ej. clasificar tickets de soporte, procesar facturas) — `README.md` (en inglés), flujo "invoice processing" con Trigger → IA extracción → Condición → Acción Sheets, pasos completos para reproducirlo
- [ ] Deploy y documentación completa (README con GIF demostrativo) — README ya escrito; falta el GIF (el usuario lo graba) y el deploy en sí

---

## ✅ Convenciones de código

- **Nombres de archivos:** camelCase para JS/JSX, PascalCase para componentes React
- **Comentarios:** explicar el "por qué", especialmente en la lógica del motor de ejecución (`engine/`)
- **Commits:** mensajes en español, formato `tipo: descripción` (ej. `feat: agregar nodo de clasificación con IA`)
- **Variables de entorno:** nunca commitear `.env`, mantener `.env.example` actualizado
- **Errores:** cada nodo del motor debe manejar sus propios errores y registrarlos en `ExecutionLog`, evitar fallos silenciosos que rompan todo el flujo
- **Estilo:** priorizar claridad sobre "cleverness" — el motor de ejecución es la parte más compleja del proyecto, debe estar bien comentado

---

## 🎓 Notas pedagógicas para Claude Code

- Explicar brevemente el **por qué** de cada decisión técnica, no solo entregar el código
- Dividir tareas grandes (especialmente el motor de ejecución) en pasos pequeños y verificables
- Sugerir buenas prácticas cuando aplique (ej. manejo de colas, seguridad en integraciones externas)
- Evitar jerga innecesaria sin explicación

---

## 🔭 Visión a futuro (fuera del MVP actual)

- Marketplace de plantillas de flujos predefinidos
- Más integraciones (Slack, Notion, APIs de facturación)
- Nodo de webhook como trigger (además de manual y programado)
- Versión colaborativa (equipos compartiendo flujos)
- Métricas de ahorro de tiempo/costo por flujo automatizado

---

## 🔄 Mantenimiento de este archivo

Claude Code debe actualizar este archivo cuando:
- Se complete una tarea del checklist de fases (marcar con `[x]`)
- Se tome una decisión técnica nueva o se cambie una ya documentada (agregar o modificar en "Notas de decisión")
- Se agregue un nuevo modelo de datos, endpoint, nodo o integración relevante
- Se identifique un cambio de alcance del proyecto (features agregadas, eliminadas o pospuestas)

Al final de cada sesión de trabajo significativa, actualizar la línea "Última actualización" con la fecha y un resumen breve de qué se hizo.

---

*Última actualización: 2026-08-04 — Rediseño visual completo del frontend (Tailwind v4 + tema "brand", Inter, lucide-react, componentes base reutilizables) y ronda de mejoras de UX en el builder: eliminar/desconectar nodos con feedback visual, renombrar/duplicar/eliminar workflows, estado vacío con flujo de ejemplo precargable, validación visual de nodos incompletos, toasts, y logout automático al expirar la sesión. Falta solo el deploy (Vercel + Railway/Render) para cerrar la Fase 3.*
