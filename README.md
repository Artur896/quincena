# Quincena

Una app de **enfoque financiero**, no de administración de gastos. Cada mes,
el usuario gira una ruleta (equiprobable entre todas las categorías activas)
y se compromete con **una sola meta**.
Ese compromiso queda bloqueado 30 días; el dinero de cada quincena se
acumula ahí solo, y todo el progreso queda en un historial que nunca se
reinicia.

> Casa, Viajes, Compu o Ropa. Una a la vez. Sin dispersión.

---

## 1. Filosofía de producto

La mayoría de apps de finanzas personales piden al usuario que decida todo,
todo el tiempo: cuánto ahorrar, en qué, cuándo. Eso produce fricción y, en la
práctica, ahorro disperso en cinco metas a la vez que nunca se completan.

Quincena invierte la lógica: **la decisión difícil (a qué le entro este mes)
se toma una vez, al azar y con reglas claras**, y el resto del mes la app
simplemente ejecuta. El usuario no negocia consigo mismo cada quincena; ya
se comprometió.

Principios de diseño visual, inspirados en Apple Wallet, Notion y Revolut:

- **Fondo oscuro, casi negro**, con acentos dorados — sobrio, no ruidoso.
- **Una cifra protagonista por pantalla** (el monto acumulado, el gasto de
  hoy), todo lo demás es contexto.
- **Tarjetas grandes**, mucho espacio en blanco, tipografía con peso pero sin
  gritar.
- **Navegación de 5 pestañas**, nunca más de dos niveles de profundidad.

## 2. Flujo principal

1. El usuario registra su ingreso quincenal y sus gastos fijos (`Onboarding`).
2. La app calcula el dinero disponible para metas: `ingreso - gastos fijos - dinero libre`.
3. El día 1–3 del mes, el usuario gira la ruleta (`Ruleta`). El resultado
   crea la meta del mes y queda bloqueado.
4. Cada quincena, al abrir la app, el dinero destinado a metas se acumula
   automáticamente en la meta activa (ver §7).
5. `Inicio` muestra el estado del día; `Meta` muestra el detalle e histórico;
   `Gastos` registra lo que se gasta fuera del sistema de metas;
   `Asesor` responde preguntas sobre todo lo anterior.

### Datos de ejemplo (MVP)

| Concepto              | Monto      |
| ---------------------- | ---------- |
| Ingreso quincenal       | $8,000 MXN |
| Transporte fijo         | $3,600 MXN |
| Dinero para metas       | $3,000 MXN |
| Dinero libre            | $1,400 MXN |

### Categorías de la ruleta

| Categoría | Meta ejemplo |
| --------- | ------------ |
| Casa      | $50,000      |
| Viajes    | $15,000      |
| Compu     | $20,000      |
| Ropa      | $5,000       |

La ruleta **es equiprobable**: todas las categorías activas tienen la misma
probabilidad de salir, sin importar cuántas haya — al agregar una categoría
propia desde la pantalla Ruleta, la probabilidad de todas (las 4 de fábrica
y las que el usuario haya sumado) se reparte sola en 1/N. Ver §6.

## 3. Arquitectura técnica

```
Cliente (Expo / React Native / TypeScript)
        │
        │  @supabase/supabase-js (Auth + Postgres + Storage + Realtime-ready)
        ▼
Supabase (Postgres + Row Level Security + Storage + Edge Functions)
        │
        │  supabase.functions.invoke("financial-advisor")
        ▼
Edge Function (Deno) ──► Claude API (Anthropic)
```

- **App móvil**: Expo (React Native) + TypeScript, navegación con
  `@react-navigation` (bottom tabs), estado global con **Zustand**
  (deliberadamente más ligero que Redux para el tamaño de este MVP).
- **Backend**: Supabase — Postgres como única fuente de verdad, RLS para que
  cada usuario solo pueda leer/escribir sus propias filas, Storage para
  íconos/imágenes, Auth sin contraseña (OTP por correo).
- **IA financiera**: una Edge Function de Supabase arma el contexto
  financiero del usuario (respetando RLS, sin service role key) y llama a
  Claude. El cliente nunca ve la API key de Anthropic.

### Por qué estas decisiones

- **Zustand sobre Redux/Context anidado**: la app tiene un solo dominio de
  estado (finanzas del usuario actual), no hace falta la ceremonia de Redux.
- **RLS en vez de lógica de autorización en el cliente**: cualquier bug de
  UI no puede filtrar datos de otro usuario, porque Postgres lo impide a
  nivel de fila.
- **`accumulated_amount` derivado por trigger, no calculado en el cliente**:
  la suma de aportes vive en la base de datos (`contributions`), y un
  trigger (`sync_goal_accumulated_amount`) mantiene `goals.accumulated_amount`
  sincronizado. Así el número "de verdad" nunca depende de que el cliente
  haga bien la suma.
- **La IA nunca recibe tools de escritura**: la Edge Function solo le pasa
  contexto de solo-lectura en el prompt. No hay manera de que el modelo
  mueva dinero, ni aunque el usuario se lo pida — arquitectónicamente no
  puede.

### Estructura de carpetas

```
quincena/
├── App.tsx                        # entry point: auth gate → onboarding → tabs
├── app.json                       # config de Expo
├── src/
│   ├── components/                # UI reutilizable (Card, ProgressBar, RouletteWheel...)
│   ├── constants/categories.ts    # las 4 categorías de la ruleta + pesos
│   ├── hooks/                     # useAuth, useFinancialSummary
│   ├── lib/supabase.ts            # cliente de Supabase
│   ├── navigation/                # RootNavigator (bottom tabs) + tipos
│   ├── screens/                   # Inicio, Ruleta, Meta, Gastos, Asesor, Login, Onboarding
│   ├── services/                  # capa de acceso a datos (1 archivo por dominio)
│   ├── store/useAppStore.ts       # estado global (Zustand)
│   ├── theme/                     # colores, tipografía, spacing
│   ├── types/index.ts             # tipos compartidos de dominio
│   └── utils/                     # money, date, roulette, accumulation
└── supabase/
    ├── schema.sql                 # tablas, RLS, triggers, seed
    └── functions/financial-advisor/index.ts  # Edge Function → Claude
```

## 4. Base de datos

Ver `supabase/schema.sql` (comentado línea por línea). Resumen del modelo:

```
auth.users (Supabase Auth)
    │ 1:1 (trigger on signup)
    ▼
profiles ──1:1── income_configs        goal_categories (catálogo global, 4 filas fijas)
    │                                        ▲
    │ 1:N                                    │ FK
    ▼                                        │
  goals (1 por usuario y mes) ───────────────┘
    │ 1:N
    ▼
contributions (1 por meta/mes/quincena; trigger recalcula goals.accumulated_amount)

profiles ──1:N── expenses
profiles ──1:N── roulette_spins (1 por usuario y mes)
```

Reglas de integridad que vive en la base, no en la app:

- `goals`: `unique (user_id, month)` — solo puede existir una meta por mes.
- `roulette_spins`: `unique (user_id, month)` — solo un giro por mes.
- `contributions`: `unique (goal_id, month, quincena)` — no se puede
  duplicar el aporte de la misma quincena.
- Todas las tablas de usuario tienen RLS: `auth.uid() = user_id`.
- Nada se borra en el flujo normal: una meta pasa de `active` a `completed`,
  nunca se elimina; los aportes son append-only.

## 5. Navegación

Bottom tabs (`src/navigation/RootNavigator.tsx`), sin stacks anidados en el
MVP — cada pantalla es autosuficiente:

```
Inicio · Ruleta · Meta · Gastos · Asesor
```

Antes de los tabs, `App.tsx` resuelve un gate secuencial:

```
¿Sesión activa? → no → LoginScreen (OTP por correo)
       │ sí
¿Ingreso configurado? → no → OnboardingScreen
       │ sí
   RootNavigator (tabs)
```

## 6. Lógica de la ruleta

`src/utils/roulette.ts`:

- `pickWeightedCategory()`: elige un índice al azar entre las categorías
  activas (1/N cada una — `weight`/`priority` ya no se usan para esto, solo
  quedan en el esquema por compatibilidad). Agregar una categoría propia
  reparte la probabilidad de todas automáticamente, sin rebalancear nada.
- `getSegmentLayout()`: reparte los 360° en partes iguales (360/N) — único
  punto de verdad del layout, lo usa tanto el dibujo de la rueda como el
  cálculo del ángulo final, así nunca se desincronizan.
- `angleForCategory()`: calcula el ángulo final (grados) al que debe
  detenerse la aguja para apuntar al centro del segmento ya elegido,
  agregando varias vueltas completas para el efecto visual.

`src/components/RouletteWheel.tsx` dibuja los segmentos (4 de fábrica +
los que el usuario haya agregado) con
`react-native-svg` y anima la rotación con `react-native-reanimated`
(`withTiming` + easing de salida, ~4.2s). El resultado se decide **antes**
de animar (`spinRoulette()` en el store ya escribió en la base de datos);
la animación es una confirmación visual del resultado, no una lotería en
el cliente — así no hay forma de que la UI "mienta" sobre qué meta tocó.

La ruleta solo se puede girar del día 1 al 9 del mes
(`isRouletteWindowOpen`), y la restricción real de "una vez al mes" vive en
la base de datos (`roulette_spins` único por usuario/mes), no solo en la UI.

## 7. Sistema de acumulación

Cada quincena el usuario **confirma manualmente** cuánto logró guardar
(`useAppStore.confirmContribution`, disparado desde una tarjeta en
`Inicio` cuando hay un aporte pendiente) — no es un monto forzado. El
`goalsAllocation` calculado en el onboarding solo aparece como sugerencia
precargada en el input; el usuario puede confirmar menos si esa quincena
no le alcanzó. Cada aporte queda como una fila en `contributions`, atada
a la meta activa del mes, con respaldo opcional (`photo_url`,
`storage_location` — dónde guardó físicamente ese dinero, para no
mezclarlo con el gasto diario). Un trigger de Postgres recalcula
`goals.accumulated_amount` como la suma de esas filas — el número
mostrado en pantalla siempre es una suma auditable del historial, nunca
un contador que se pueda desincronizar.

```
Septiembre → Viajes
  Quincena 1  +$3,000  (contribution #1, alcancía)
  Quincena 2  +$2,000  (contribution #2, no alcanzó el monto completo)
  Total septiembre: $5,000  ← suma automática, no un campo editable

Octubre → Casa
  Quincena 1  +$3,000
```

Si el aporte confirmado es menor al sugerido, la UI muestra un mensaje de
ánimo (no un "¡Felicidades!" genérico) reconociendo que igual cuenta.
Este confirmar-a-mano depende de que el usuario abra la app dentro de la
quincena vigente; la v1.0 debería agregar una notificación push
recordando confirmar si no lo ha hecho — ver Roadmap.

`src/utils/accumulation.ts` también resuelve:

- `estimateCompletionDate`: cuántas quincenas faltan al ritmo actual de
  aportes, proyectadas a fecha calendario (pantalla `Meta`).
- `groupContributionsByMonth`: la vista de "historial mensual".

## 8. Componentes reutilizables

Todo en `src/components/`, sin dependencias entre pantallas:

| Componente      | Uso                                                          |
| --------------- | ------------------------------------------------------------- |
| `Screen`         | SafeArea + scroll + padding consistente en todas las pantallas |
| `Card`           | Contenedor base (dos variantes: normal / elevada)              |
| `ProgressBar`     | Barra de progreso de meta, color por categoría                |
| `MoneyText` / `SignedMoneyText` | Formato de dinero en MXN, con signo para movimientos |
| `PrimaryButton`   | Botón primario/secundario con estado `loading`                |
| `SectionHeader`   | Título de sección + acción opcional                            |
| `MovementRow`     | Fila de movimiento reciente (aporte / gasto)                   |
| `CategoryPill`    | Chip de categoría con ícono y color                             |
| `RouletteWheel`   | Ruleta animada de 4 segmentos (SVG + Reanimated)                |
| `EmptyState`      | Estado vacío consistente (sin meta, sin gastos, sin historial) |

## 9. UI minimalista — tema

`src/theme/`: paleta oscura (`colors.ts`), escala tipográfica de 7 niveles
(`typography.ts`, de `micro` a `money`) y espaciado en múltiplos de 4/8
(`spacing.ts`). Cualquier pantalla nueva debería poder construirse solo con
estos tokens, sin definir colores o tamaños de fuente ad hoc.

## 10. Integración con IA (Claude)

`Asesor` (pantalla) → `askAdvisor()` (`src/services/advisorService.ts`) →
`supabase.functions.invoke("financial-advisor")` → Edge Function
(`supabase/functions/financial-advisor/index.ts`) → Claude API.

Puntos clave de la integración:

- El **cliente nunca tiene la API key de Anthropic** — vive como secreto de
  la Edge Function (`ANTHROPIC_API_KEY`).
- La Edge Function arma su cliente de Supabase **con el JWT del usuario**,
  no con la service role key, así que las mismas políticas RLS que protegen
  al resto de la app protegen lo que la IA puede leer.
- El contexto que recibe Claude es explícitamente de solo lectura:
  `income_configs`, `goals`, `expenses`, `contributions`. No se le da acceso
  a ninguna operación de escritura ni se expone ninguna "tool" — el system
  prompt además se lo prohíbe explícitamente como refuerzo, pero la garantía
  real es que no hay ningún endpoint de escritura conectado al modelo.
- Preguntas de ejemplo ya cableadas en la UI: *¿Estoy gastando demasiado?*,
  *¿Cuándo terminaré mi meta?*, *¿Puedo comprar esto?*, *Analiza mis hábitos
  financieros*.

## 11. Configuración y arranque

```bash
npm install
cp .env.example .env   # define EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY
npx supabase db push --db-url <tu-conexión>   # o pega supabase/schema.sql en el SQL editor
npx expo start
```

Variables de entorno (ver `.env.example`):

- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` — cliente.
- `ANTHROPIC_API_KEY` — solo como secreto de la Edge Function
  (`supabase secrets set ANTHROPIC_API_KEY=...`), nunca en el cliente.

## 12. Roadmap: MVP → 1.0

**MVP (este entregable)**
- [x] Modelo de datos completo con RLS y triggers de acumulación.
- [x] Onboarding de ingreso/gastos fijos.
- [x] Ruleta equiprobable con animación y bloqueo mensual real (DB-enforced).
- [x] Acumulación automática al abrir la app en cada quincena.
- [x] Pantallas Inicio, Ruleta, Meta, Gastos.
- [x] Asesor IA de solo-lectura vía Edge Function + Claude.

**v1.1 — Confiabilidad**
- [ ] Mover la acumulación quincenal de "al abrir la app" a una Edge
      Function programada (cron) el 1 y el 16 de cada mes, con notificación
      push cuando se acredita.
- [ ] Notificaciones push: recordatorio de girar la ruleta (día 1),
      confirmación de aporte acreditado, alerta de meta completada.
- [ ] Manejo de mes sin giro (usuario no gira a tiempo): política explícita
      (¿se salta el mes? ¿se re-abre la ventana?).

**v1.2 — Gastos automáticos**
- [ ] Ingesta de gastos automáticos (Storage + import CSV / conexión
      bancaria futura) en vez de solo registro manual.
- [ ] Presupuestos por categoría de gasto (fuera de las metas de la
      ruleta) con alertas del Asesor.

**v1.3 — Personalización**
- [x] Categorías propias agregables desde Ruleta (`goal_categories.user_id`
      no nulo, visibles solo para su dueño vía RLS); todas equiprobables.
- [ ] Editar/borrar categorías propias después de creadas (hoy solo se
      agregan; falta el flujo de borrado en la UI, la política RLS ya existe).
- [ ] Múltiples fuentes de ingreso / frecuencias distintas a quincenal.
- [ ] Modo pareja/familia (metas compartidas).

**1.0 — Pulido**
- [ ] Animaciones de transición entre pantallas, haptics en la ruleta.
- [ ] Modo claro además del oscuro (los tokens de `theme/` ya lo permiten).
- [ ] Onboarding con explicación interactiva de la filosofía del producto.
- [ ] Auditoría de seguridad de las políticas RLS y rate limiting de la
      Edge Function del Asesor.

## 13. Qué explícitamente NO hace esta app

- No decide por el usuario: la IA solo responde preguntas.
- No mueve dinero entre cuentas reales — todo el "dinero" es contable
  dentro de la app (no hay integración bancaria en el MVP).
- No permite tener más de una meta activa a la vez, por diseño.
