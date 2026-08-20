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
    matches.ts      crear partido, unirse (públicos), invitar/responder invitación (públicos y privados), aprobar/rechazar, cambiar visibilidad
    courts.ts       agregar/editar cancha
    profile.ts      onboarding / editar perfil
    push.ts         guardar/borrar suscripción push
    friends.ts      enviar/aceptar/rechazar/cancelar solicitud de amistad, eliminar amigo, buscar usuarios
    location.ts     buscar lugar (geocoding) y guardar la ubicación del usuario
  (rutas)/          una carpeta por ruta, `page.tsx` server + a veces un `*-form.tsx` cliente al lado (incluye `invitaciones/`, la página de invitaciones a partidos, `mapa/` el mapa full-screen de canchas; `canchas/` renderiza la misma `MapExperience` que `/mapa`)
  admin/            panel simple (solo `is_admin`), sin nav propia — ve usuarios, partidos, canchas, métricas
  login/, signup/, onboarding/   flujo de auth y setup inicial de perfil

lib/
  auth/
    dal.ts          Data Access Layer: TODAS las lecturas de Supabase + verifySession/requireSession/requireAdmin
    definitions.ts  tipos/esquemas de auth
  matches/, courts/, push/, friends/
    definitions.ts  esquemas Zod + tipos de formulario por dominio
    home.ts, sort.ts, amenities.ts, sports.tsx   lógica de negocio pura (ordenar, filtrar, catálogo de deportes) — testeada en tests/unit. `sports.tsx` es el catálogo canónico de deportes (`SPORTS`/`getSport`/`SPORT_CATALOG_KEYS`): cada deporte tiene un `icon` (`IconSource` de `lib/icons/svg-icon.ts`) que se renderiza tanto como componente React (`SportIcon`) como string SVG para los pines del mapa (`renderIconSource`), así el chip y el pin son el mismo dibujo. `IconSource` es `{kind:"stroke", nodes, strokeWidth?}` (glifo 24x24 a mano estilo lucide — solo futsal, sin equivalente real) o `{kind:"fill", viewBox, markup}` (silueta rellena tomada de un asset SVG externo, con el `fill` hardcodeado quitado para que `currentColor` se herede — fútbol, básquet, vóleibol, y el mismo glifo de pelota de tenis compartido por tenis/pádel).
  supabase/
    server.ts       cliente Supabase para Server Components/Actions (cookies de next/headers)
    client.ts        cliente Supabase para Client Components (browser)
    proxy.ts         refresca el token de sesión (llamado desde el middleware/proxy de Next)
    database.types.ts  tipos generados desde el esquema real de Supabase (no editar a mano)
  geo/
    distance.ts     cálculo de distancia (haversine) para ordenar/mostrar por cercanía
    geocode.ts      geocoding de texto libre (ciudad/estado) vía Nominatim, usado por app/actions/location.ts
  icons/svg-icon.ts  renderiza nodos estilo lucide-react a un string SVG (para pines de mapa, que no pueden montar componentes React)

components/
  home/             piezas del home (carrusel de canchas destacadas, tarjeta "Cerca de ti" con mini-mapa → `/mapa`, "invitaciones", "de tus amigos", "te necesitan ya" — este último con la fila de íconos de deporte debajo del título, filtro multi-select en memoria), match-card.tsx compartido
  matches/          visibility-toggle.tsx (público/privado, se usa al crear y en el detalle), match-visibility-switch.tsx, invite-friends.tsx (organizador invita amigos/usuarios a un partido privado)
  courts/           inputs de formulario de cancha (comodidades + deportes), court-picker.tsx (selector desplegable de cancha al crear partido), sport-chip.tsx (chip de un deporte — ícono siempre, etiqueta opcional vía `showLabel` — compartido por el filtro del home, `/mapa` y el selector de deporte al crear partido)
  friends/          buscador de usuarios + botón "agregar" (friend-search.tsx), usado en /red
  location/         location-selector.tsx — selector de ubicación app-wide en el header (busca con geocoding, guarda en `users.location_*`)
  mapa/             pantalla full-screen de `/mapa`: chips de deporte (ícono + etiqueta, single-select, vía `SportChip`), mapa y carrusel de tarjetas de canchas
  map/map-shared.tsx  tiles oscuros (`DarkTiles`) + `buildCourtIcon` (pin redondo oscuro: ícono del deporte si la cancha tiene uno solo, glifo "layers" si tiene varios —p. ej. una cantera multi-deporte—, pin genérico si no tiene ninguno) + `CourtPopupContent` (contenido del popup del pin: nombre, chips de deporte si son varios, link "Ver cancha" opcional) — usados por todos los mapas del repo
  bottom-nav*.tsx   tab bar inferior (solo visible logueado, ver bottom-nav.tsx)
  site-header.tsx   header superior; monta `LocationSelector` y calcula los conteos de invitaciones/solicitudes para header-nav.tsx
  header-nav.tsx    menú hamburguesa; badges de "Invitaciones"/"Mi red" con conteos sin responder, refrescados por realtime
  *-map*.tsx        mapas Leaflet (hay un wrapper "-inner" porque Leaflet no soporta SSR)

docs/
  mvp-spec.md       qué es el producto, qué SÍ y qué NO construir, modelo de datos, modelo de monetización
  home-ui-spec.md   detalle de implementación del home
```

## Modelo de datos (resumen — ver `docs/mvp-spec.md` para el detalle y el porqué)

- `users` — perfil, `invited_by` (cadena de invitación), `is_admin`. `location_label`/`location_lat`/`location_lng` guardan la ubicación app-wide que el usuario elige en el selector del header (`components/location/location-selector.tsx`, geocoding vía `lib/geo/geocode.ts`); se usa para centrar mapas y calcular distancias. Es independiente de `zone` (etiqueta social de texto libre del onboarding).
- `friendships` — amistad mutua entre dos usuarios (`requester_id`, `addressee_id`, `status`: `pendiente`/`aceptada`/`rechazada`). Es independiente de `invited_by`/`is_direct_network`: hoy ser "amigos" es puramente social y **no** afecta si alguien entra confirmado o pendiente a un partido. Un índice único evita pares duplicados sin importar la dirección.
- `courts` — cancha. `is_official` distingue cancha "de verdad" (con ficha, fotos, aparece en explorador y en el home) de una ubicación disponible solo para elegir al crear partido. `sponsored_until`/`sponsor_priority` son el nivel pago (destacado en home). `sports` (array de claves de `lib/courts/sports.tsx`) determina qué deportes ofrece — se elige con checkboxes en el form de admin (`CourtSponsorshipFields`) — y el ícono del pin en el mapa (`buildCourtIcon`): un solo deporte muestra su ícono, varios muestran un glifo "layers" (cancha multi-deporte), cero muestran un pin genérico. `address` es texto libre mostrado en las tarjetas de `/mapa`. `schedule` es texto libre para la ficha de la cancha; `opens_at`/`closes_at` (hora) + `open_days` (array de días con la convención `Date.getDay()` de JS: 0=domingo..6=sábado) son el horario estructurado usado para calcular "abierto hoy" — ver `lib/courts/hours.ts`. Por ahora el badge de horario en el selector de crear partido solo se muestra para canchas `is_official` (hoy, Cantera — que ofrece fútbol, pádel y futsal).
- `matches` — partido: cancha, deporte (`sport`, uno de `SPORT_CATALOG_KEYS` de `lib/courts/sports.tsx`; se elige al crear el partido con `SportChip` y solo se listan/muestran en el mapa las canchas cuyo `sports[]` incluye ese deporte), organizador, fecha, cupos, `status` (`abierto`/`completo`/`cancelado`/`vencido`), `is_public` controla la **visibilidad Y cómo se llenan los cupos**: público = aparece en el explorador/home (excepto para su propio organizador, ver `getOpenMatchesWithCourtGeo`) y cualquiera puede pedir unirse (`joinMatch`, sigue aprobación del organizador) — el organizador **también** puede invitar directamente; privado = no aparece en listados, no hay "pedir unirse" — el organizador solo puede **invitar** explícitamente (`inviteToMatch`, ver abajo). En ambos casos, si a un partido privado le siguen faltando cupos, el detalle le sugiere al organizador hacerlo público (reutiliza `setMatchVisibility`) en vez de ofrecer un canal de notificación por audiencia. Excepción de lectura: la sección "De tus amigos" del home (`getFriendsPrivateMatches` en `lib/auth/dal.ts`) sí muestra los partidos privados `abierto` organizados por un amigo directo; esto ya es legible por la RLS de `SELECT` de `matches` (permite leer cualquier `status = "abierto"` sin importar `is_public`).
- `match_participants` — quién está en qué partido, con `status`: `confirmado` (jugando), `pendiente` (solicitud a un partido público, esperando aprobación del organizador vía `respondToRequest`), `rechazado` (solicitud rechazada), o `invitado` (invitación del organizador a un partido privado, esperando respuesta del invitado — ver abajo). El organizador se inserta `confirmado` al crear el partido (no es una solicitud). `joined_via` (`red_directa`/`externo`, calculado con la RPC `is_direct_network`) es solo informativo. El trigger `recalc_match_slots` solo cuenta filas `confirmado` para `slots_filled`, así que ni una solicitud `pendiente` ni una invitación `invitado` ocupan cupo hasta confirmarse.
  - **Flujo de invitación (públicos y privados):** el organizador de cualquier partido abierto con cupos libres llama `inviteToMatch` (elige "todos mis amigos" o usuarios específicos vía `components/matches/invite-friends.tsx`, que combina la lista de `getMyFriends()` con `searchUsersAction`) — inserta filas `invitado`, saltando duplicados. El invitado ve la invitación en el home (`InvitationsSection`), en `/invitaciones`, y en el detalle del partido, y llama `respondToInvitation`: aceptar pasa la fila a `confirmado` directo (sin aprobación extra del organizador — ya decidió al invitar); rechazar **borra** la fila, así el organizador puede reinvitar. RLS: policy de INSERT permite al organizador insertar `invitado`; policy de UPDATE permite al invitado pasar su propia fila de `invitado` a `confirmado` (no puede escribir otro status).
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
- No hay migraciones en el repo (no hay carpeta `supabase/`) — el esquema/RLS/realtime se maneja directamente en el proyecto remoto de Supabase (vía el MCP de Supabase: `apply_migration`, etc.). Si cambia el esquema, `lib/supabase/database.types.ts` se regenera (`generate_typescript_types`, no se edita a mano).
- Antes de agregar una función de lectura nueva, revisar si ya existe algo parecido en `lib/auth/dal.ts` — es el único lugar donde deberían vivir los `select` a Supabase desde el server.
