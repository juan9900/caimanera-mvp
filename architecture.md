# Arquitectura de Caimanera

Este documento es un mapa de referencia rápida: "¿cómo funciona esto en general?" antes de meterte a leer código con Claude Code. No es exhaustivo — para el detalle de producto ver `docs/mvp-spec.md` y `docs/home-ui-spec.md`.

## Stack

- **Next.js 16 (App Router)** — server components por defecto, PWA (manifest + service worker en `public/`).
- **Supabase** — Postgres + Auth + Realtime + Storage. Toda la lógica de datos vive ahí, no hay backend propio.
- **Tailwind v4** para estilos, fuentes vía `next/font` (Anybody, Hanken Grotesk, JetBrains Mono).
- **Web Push** (`web-push` npm + service worker en `public/sw.js`) para notificaciones.
- **Jest** (unit) + **Playwright** (e2e) para tests.

## Cómo fluye una página (patrón estándar del repo)

Este es el patrón que se repite en casi todas las rutas de `app/`:

1. **`app/<ruta>/page.tsx`** (Server Component, async)
   - Llama a `verifySession()` de `lib/auth/dal.ts`. Si no hay sesión, `redirect("/login")`.
   - Llama a funciones de **lectura de datos** también en `lib/auth/dal.ts` (ej. `getOpenMatches()`, `getCourts()`) — estas hacen la query a Supabase directamente desde el server.
   - Pasa esos datos como props a un componente cliente si hace falta interactividad (ej. `HomeClient`, `create-match-form.tsx`).

2. **Componentes `"use client"`** (formularios, mapas, cosas interactivas)
   - Usan `useActionState` / `useFormState` para llamar **Server Actions**.

3. **`app/actions/*.ts`** (Server Actions, `"use server"`)
   - Son las únicas que **escriben** datos (crear partido, unirse, invitar, etc.).
   - Cada una empieza con `requireSession()` (lanza si no hay sesión) — esta es la frontera de seguridad real, no confiar en el layout ni en el middleware para eso.
   - Validan el `FormData` con esquemas **Zod** definidos en `lib/<dominio>/definitions.ts`.
   - Escriben a Supabase con el cliente de `lib/supabase/server.ts`.
   - Terminan con `revalidatePath()` y a veces `redirect()`.

En resumen, por feature hay tres capas paralelas: `lib/<dominio>/definitions.ts` (tipos + validación Zod), `lib/auth/dal.ts` (lecturas), `app/actions/<dominio>.ts` (escrituras). Si buscas "¿de dónde sale este dato en la página?" casi siempre está en `dal.ts`; si buscas "¿qué pasa cuando el usuario aprieta este botón?" casi siempre es un Server Action en `app/actions/`.

## Estructura de carpetas

```
app/
  actions/          Server Actions ("use server") — toda escritura a la DB pasa por aquí
    auth.ts         login, signup, logout
    matches.ts      crear partido, unirse, aprobar/rechazar, notificar "faltan jugadores"
    courts.ts       agregar/editar cancha
    profile.ts      onboarding / editar perfil
    push.ts         guardar/borrar suscripción push
  (rutas)/          una carpeta por ruta, `page.tsx` server + a veces un `*-form.tsx` cliente al lado
  admin/            panel simple (solo `is_admin`), sin nav propia — ve usuarios, partidos, canchas, métricas
  login/, signup/, onboarding/   flujo de auth y setup inicial de perfil

lib/
  auth/
    dal.ts          Data Access Layer: TODAS las lecturas de Supabase + verifySession/requireSession/requireAdmin
    definitions.ts  tipos/esquemas de auth
  matches/, courts/, push/
    definitions.ts  esquemas Zod + tipos de formulario por dominio
    home.ts, sort.ts, amenities.ts   lógica de negocio pura (ordenar, filtrar) — testeada en tests/unit
  supabase/
    server.ts       cliente Supabase para Server Components/Actions (cookies de next/headers)
    client.ts        cliente Supabase para Client Components (browser)
    proxy.ts         refresca el token de sesión (llamado desde el middleware/proxy de Next)
    database.types.ts  tipos generados desde el esquema real de Supabase (no editar a mano)
  geo/distance.ts   cálculo de distancia para ordenar por cercanía

components/
  home/             piezas del home (carrusel de canchas destacadas, "te necesitan ya", filtros)
  courts/           inputs de formulario de cancha, iconos de amenities
  bottom-nav*.tsx   tab bar inferior (solo visible logueado, ver bottom-nav.tsx)
  site-header.tsx   header superior
  *-map*.tsx        mapas Leaflet (hay un wrapper "-inner" porque Leaflet no soporta SSR)

docs/
  mvp-spec.md       qué es el producto, qué SÍ y qué NO construir, modelo de datos, modelo de monetización
  home-ui-spec.md   detalle de implementación del home
```

## Modelo de datos (resumen — ver `docs/mvp-spec.md` para el detalle y el porqué)

- `users` — perfil, `invited_by` (cadena de invitación), `is_admin`.
- `courts` — cancha. `is_official` distingue cancha "de verdad" (con ficha, fotos, aparece en explorador) de un pin agregado libremente por un jugador al crear un partido. `sponsored_until`/`sponsor_priority` son el nivel pago (destacado en home).
- `matches` — partido: cancha, organizador, fecha, cupos, `status` (`abierto`/`completo`/`cancelado`/`vencido`), `is_public` (privado = solo por link directo, no aparece en el explorador).
- `match_participants` — quién está en qué partido y su `status` (confirmado/pendiente/rechazado) — pendiente cuando el que se une es externo a la red directa del organizador.
- `push_subscriptions` — suscripciones Web Push por usuario.
- `court_events` — tracking simple (impresión, click, whatsapp, directions, promo_copy, match_created) usado en métricas de admin.

Regla de negocio clave que se repite en el código: **nunca hay pagos dentro de la app** — todo `payment*` en `matches` (banco, teléfono, cédula, monto) es solo información para coordinar el pago externo (Pago Móvil), no una transacción real.

## Autenticación

- Supabase Auth. Registro **solo por invitación** — no hay signup libre; `signup-form.tsx` requiere un código de invitación válido.
- `verifySession()` (memoizada con `cache()` de React, por request) es la fuente de verdad de sesión. `requireSession()`/`requireAdmin()` son los guards que usan los Server Actions.
- El middleware (`lib/supabase/proxy.ts`) solo refresca el token de cookies — **no es la barrera de seguridad**, cada action revalida sesión por su cuenta.

## Notificaciones push

- El usuario activa notificaciones desde `components/enable-notifications.tsx`, que registra el `sw.js` y guarda la suscripción vía la action `savePushSubscription`.
- El envío real ocurre desde Server Actions (ej. al crear partido o pedir "faltan jugadores" en `app/actions/matches.ts`) usando `webpush` contra las suscripciones guardadas.
- `public/sw.js` es el service worker que recibe el push y muestra la notificación / maneja el click.

## Testing

- `tests/unit/` — Jest, sobre todo lógica pura de `lib/` (orden de canchas, home, definitions/Zod, dal).
- `tests/e2e/` — Playwright, flujo de home end-to-end.

## Notas para trabajar con Claude Code en este repo

- `AGENTS.md` (raíz) advierte que esta versión de Next.js puede diferir de lo que Claude "sabe" de entrenamiento — revisar `node_modules/next/dist/docs/` antes de usar APIs de Next que parezcan poco comunes.
- Si cambia el esquema de Supabase, `lib/supabase/database.types.ts` se regenera (no se edita a mano).
- Antes de agregar una función de lectura nueva, revisar si ya existe algo parecido en `lib/auth/dal.ts` — es el único lugar donde deberían vivir los `select` a Supabase desde el server.
