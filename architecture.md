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
    matches.ts      crear partido (con difusión opt-in), unirse (públicos), invitar/responder invitación (públicos y privados), aprobar/rechazar, cambiar visibilidad
    courts.ts       agregar/editar cancha
    profile.ts      onboarding / editar perfil
    push.ts         guardar/borrar suscripción push, notificación de prueba, diagnóstico
    friends.ts      enviar/aceptar/rechazar/cancelar solicitud de amistad, eliminar amigo, buscar usuarios
    groups.ts       crear/renombrar/eliminar grupo, invitar/responder invitación de grupo, salir/sacar miembro, unirse por link (rotar/canjear token), buscar usuarios para invitar a un grupo
  (rutas)/          una carpeta por ruta, `page.tsx` server + a veces un `*-form.tsx` cliente al lado (incluye `invitaciones/`, la página de invitaciones a partidos y grupos; `grupos/`, `grupos/[id]/` y `grupos/unirse/[token]/`, ver más abajo)
  admin/            panel simple (solo `is_admin`), sin nav propia — ve usuarios, partidos, canchas, métricas
  login/, signup/, onboarding/   flujo de auth y setup inicial de perfil

lib/
  auth/
    dal.ts          Data Access Layer: TODAS las lecturas de Supabase + verifySession/requireSession/requireAdmin
    definitions.ts  tipos/esquemas de auth
  matches/, courts/, push/, friends/, groups/
    definitions.ts  esquemas Zod + tipos de formulario por dominio
    home.ts, sort.ts, amenities.ts   lógica de negocio pura (ordenar, filtrar) — testeada en tests/unit
    push/send.ts, push/match-notifications.ts, push/group-notifications.ts   envío Web Push (server-only) + copy/destinatarios por evento
  supabase/
    server.ts       cliente Supabase para Server Components/Actions (cookies de next/headers)
    client.ts        cliente Supabase para Client Components (browser)
    admin.ts        cliente service-role (saltea RLS) — SOLO para el envío de push
    proxy.ts         refresca el token de sesión (llamado desde el middleware/proxy de Next)
    database.types.ts  tipos generados desde el esquema real de Supabase (no editar a mano)
  geo/distance.ts   cálculo de distancia para ordenar por cercanía

components/
  home/             piezas del home (carrusel de canchas destacadas, "invitaciones", "de tus amigos", "te necesitan ya", filtros, match-card.tsx compartido)
  matches/          visibility-toggle.tsx (público/privado, se usa al crear y en el detalle), match-visibility-switch.tsx, invite-friends.tsx (organizador invita amigos/usuarios a un partido privado), invite-group.tsx (organizador invita a todos los miembros de uno de sus grupos)
  courts/           inputs de formulario de cancha, iconos de amenities, court-picker.tsx (selector desplegable de cancha al crear partido)
  friends/          buscador de usuarios + botón "agregar" (friend-search.tsx), usado en /red
  groups/           buscador para invitar a un grupo (group-user-search.tsx), form de renombrar (rename-group-form.tsx), usados en /grupos/[id]; create-group-form.tsx en /grupos
  bottom-nav*.tsx   tab bar inferior (solo visible logueado, ver bottom-nav.tsx)
  site-header.tsx   header superior; calcula los conteos de invitaciones/solicitudes y se los pasa a header-nav.tsx
  header-nav.tsx    menú hamburguesa; badges de "Invitaciones"/"Mi red" con conteos sin responder, refrescados por realtime
  *-map*.tsx        mapas Leaflet (hay un wrapper "-inner" porque Leaflet no soporta SSR)

docs/
  mvp-spec.md       qué es el producto, qué SÍ y qué NO construir, modelo de datos, modelo de monetización
  home-ui-spec.md   detalle de implementación del home
```

## Modelo de datos (resumen — ver `docs/mvp-spec.md` para el detalle y el porqué)

- `users` — perfil, `invited_by` (cadena de invitación), `is_admin`.
- `friendships` — amistad mutua entre dos usuarios (`requester_id`, `addressee_id`, `status`: `pendiente`/`aceptada`/`rechazada`). Es independiente de `invited_by`/`is_direct_network`: hoy ser "amigos" es puramente social y **no** afecta si alguien entra confirmado o pendiente a un partido. Un índice único evita pares duplicados sin importar la dirección.
- `courts` — cancha. `is_official` distingue cancha "de verdad" (con ficha, fotos, aparece en explorador y en el home) de una ubicación disponible solo para elegir al crear partido. `sponsored_until`/`sponsor_priority` son el nivel pago (destacado en home). `schedule` es texto libre para la ficha de la cancha; `opens_at`/`closes_at` (hora) + `open_days` (array de días con la convención `Date.getDay()` de JS: 0=domingo..6=sábado) son el horario estructurado usado para calcular "abierto hoy" — ver `lib/courts/hours.ts`. Por ahora el badge de horario en el selector de crear partido solo se muestra para canchas `is_official` (hoy, únicamente Cantera).
- `matches` — partido: cancha, organizador, fecha, cupos, `status` (`abierto`/`completo`/`cancelado`/`vencido`), `is_public` controla la **visibilidad Y cómo se llenan los cupos**: público = aparece en el explorador/home (excepto para su propio organizador, ver `getOpenMatchesWithCourtGeo`) y cualquiera puede pedir unirse (`joinMatch`, sigue aprobación del organizador) — el organizador **también** puede invitar directamente; privado = no aparece en listados, no hay "pedir unirse" — el organizador solo puede **invitar** explícitamente (`inviteToMatch`, ver abajo). En ambos casos, si a un partido privado le siguen faltando cupos, el detalle le sugiere al organizador hacerlo público (reutiliza `setMatchVisibility`) en vez de ofrecer un canal de notificación por audiencia. Excepción de lectura: la sección "De tus amigos" del home (`getFriendsPrivateMatches` en `lib/auth/dal.ts`) sí muestra los partidos privados `abierto` organizados por un amigo directo; esto ya es legible por la RLS de `SELECT` de `matches` (permite leer cualquier `status = "abierto"` sin importar `is_public`).
- `match_participants` — quién está en qué partido, con `status`: `confirmado` (jugando), `pendiente` (solicitud a un partido público, esperando aprobación del organizador vía `respondToRequest`), `rechazado` (solicitud rechazada), o `invitado` (invitación del organizador a un partido privado, esperando respuesta del invitado — ver abajo). El organizador se inserta `confirmado` al crear el partido (no es una solicitud). `joined_via` (`red_directa`/`externo`, calculado con la RPC `is_direct_network`) es solo informativo. El trigger `recalc_match_slots` solo cuenta filas `confirmado` para `slots_filled`, así que ni una solicitud `pendiente` ni una invitación `invitado` ocupan cupo hasta confirmarse.
  - **Flujo de invitación (públicos y privados):** el organizador de cualquier partido abierto con cupos libres llama `inviteToMatch` (elige "todos mis amigos" o usuarios específicos vía `components/matches/invite-friends.tsx`, que combina la lista de `getMyFriends()` con `searchUsersAction`) o `inviteGroupToMatch` (invita de un toque a todos los `miembro` de uno de sus grupos, vía `components/matches/invite-group.tsx` + `getGroupMemberIds`) — ambas comparten el helper privado `inviteUserIdsToMatch` (skip de duplicados, `is_direct_network`, insert, `notifyInvited`, `revalidatePath`) para no duplicar esa lógica. Insertan filas `invitado`, saltando duplicados. El invitado ve la invitación en el home (`InvitationsSection`), en `/invitaciones`, y en el detalle del partido, y llama `respondToInvitation`: aceptar pasa la fila a `confirmado` directo (sin aprobación extra del organizador — ya decidió al invitar); rechazar **borra** la fila, así el organizador puede reinvitar. RLS: policy de INSERT permite al organizador insertar `invitado`; policy de UPDATE permite al invitado pasar su propia fila de `invitado` a `confirmado` (no puede escribir otro status).
- `push_subscriptions` — suscripciones Web Push por usuario.
- `court_events` — tracking simple (impresión, click, whatsapp, directions, promo_copy, match_created) usado en métricas de admin.
- `groups` — grupo de amigos con nombre, `owner_id` (creador) e `invite_token` (uuid, rotable con `rotateGroupInviteToken`, único, es lo que canjea `/grupos/unirse/[token]`). El creador no puede salirse del grupo (solo eliminarlo, `on delete cascade` limpia las membresías) y es el único que renombra/elimina/saca miembros; cualquier `miembro` puede invitar y compartir el link.
- `group_members` — quién pertenece a qué grupo, con `status` (`invitado`/`miembro`) e `inviter_id`. Índice único por par `(group_id, user_id)`, igual que `friendships`. **Flujo de invitación:** un miembro llama `inviteToGroup` (buscador `components/groups/group-user-search.tsx` + `searchUsersForGroup`) → inserta filas `invitado`, saltando duplicados, y dispara `notifyGroupInvited`. El invitado ve la invitación en `/invitaciones` y llama `respondToGroupInvitation`: aceptar pasa a `miembro`; rechazar **borra** la fila (mismo patrón que las invitaciones a partido). **Unirse por link:** `/grupos/unirse/[token]` primero muestra una vista de confirmación (`getGroupPreviewByToken`, RPC de solo lectura) — abrir el link nunca une por sí solo, porque un GET (prefetch de Next, preview de link de WhatsApp) no debe tener efectos secundarios; el botón "Unirme" llama la action `joinGroupByToken`, que ejecuta la RPC `join_group_by_token` (inserta/actualiza a `miembro`, también acepta una invitación pendiente). Ambas RPCs son `SECURITY DEFINER` y tienen `EXECUTE` revocado de `anon` explícitamente — en Supabase el privilegio se otorga por defecto de forma directa al crear la función, así que `revoke ... from public` solo no alcanza. RLS de `group_members` usa tres helpers `SECURITY DEFINER` (`user_is_group_member`, `user_has_group_row`, `user_is_group_owner`) para evitar la recursión infinita que produciría una policy de SELECT auto-referenciada (mismo patrón que `user_is_match_participant`/`user_is_match_organizer`).

Regla de negocio clave que se repite en el código: **nunca hay pagos dentro de la app** — todo `payment*` en `matches` (banco, teléfono, cédula, monto) es solo información para coordinar el pago externo (Pago Móvil), no una transacción real.

## Autenticación

- Supabase Auth. Registro **solo por invitación** — no hay signup libre; `signup-form.tsx` requiere un código de invitación válido.
- `verifySession()` (memoizada con `cache()` de React, por request) es la fuente de verdad de sesión. `requireSession()`/`requireAdmin()` son los guards que usan los Server Actions.
- El middleware (`lib/supabase/proxy.ts`) solo refresca el token de cookies — **no es la barrera de seguridad**, cada action revalida sesión por su cuenta.
- `/login` acepta `?next=<path>` (usado por `/grupos/unirse/[token]` para volver ahí tras iniciar sesión): `login-form.tsx` lo manda como campo oculto y la action `login` solo redirige ahí si es un path relativo (`startsWith("/")` y no `"//"`, para evitar un open-redirect), si no cae en `/`.

## Notificaciones push

**Suscripción (cliente).** El usuario activa el toggle en `components/enable-notifications.tsx`
→ `subscribeToPush()` (`lib/push/subscribe-client.ts`) → la action `savePushSubscription`.
`Notification.requestPermission()` es lo **primero** que corre y tiene que
llamarse desde un gesto del usuario: iOS solo muestra el prompt nativo mientras
la página conserva user activation, y cualquier `await` previo lo pierde. Por eso
el onboarding ya no pide el permiso dentro de su form action — solo guarda los
scopes y remite a Ajustes.

**Envío (servidor).** `lib/push/send.ts` (`server-only`) envuelve `web-push`:
- `notifyUsers(userIds, payload)` — destinatarios concretos.
- `notifyMatchAudience(supabase, matchId, payload)` — difusión "faltan jugadores",
  uniendo los scopes de `AUDIENCE_SCOPES` vía la función SQL
  `resolve_audience_subscriptions` y deduplicando por endpoint.
- Todo es best-effort: nunca lanza (una notificación caída no puede tumbar la
  action que ya escribió), y ante 404/410 borra la suscripción muerta.

Los textos y la búsqueda de destinatarios viven en `lib/push/match-notifications.ts`,
para que `app/actions/matches.ts` siga tratando de la escritura. Disparadores:
`inviteToMatch`/`inviteGroupToMatch`, `joinMatch` (avisa al organizador), `respondToRequest` (solo al
aprobar), `cancelMatch` y `reopenMatch` (participantes confirmados). Crear un
partido **no** avisa por sí solo: la difusión a la audiencia es opt-in, con la
casilla `notifyAudience` del formulario de creación, y solo para públicos.
Mismo patrón para grupos en `lib/push/group-notifications.ts`: `inviteToGroup`
dispara `notifyGroupInvited` (único trigger — responder, salir, sacar o unirse
por link no notifican, igual que las solicitudes de amistad).
`sendTestNotification` y `getPushDiagnostics` en `app/actions/push.ts` permiten
verificar la cadena completa desde el propio teléfono (Ajustes → notificaciones).

**RLS.** `push_subscriptions` normalmente está limitada a su dueño, así que
notificar a otros usuarios prefiere el cliente service-role de
`lib/supabase/admin.ts` — es el único lugar que lo usa. La alternativa (una
función `SECURITY DEFINER` genérica) tendría que ser ejecutable por
`authenticated`, lo que le daría a cualquier usuario logueado las claves push del
resto. Si `SUPABASE_SERVICE_ROLE_KEY` no está configurada,
`getSubscriptionsForUsers` cae a leer con el cliente de la sesión: funciona si la
política de SELECT resulta permisiva, y si no, `getPushDiagnostics` lo reporta en
la UI en vez de fallar en silencio.

**Variables de entorno:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (se inlinea en build →
cambiarla exige redeploy), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` y
`SUPABASE_SERVICE_ROLE_KEY`. Si falta la pública, el toggle muestra
"no están configuradas en este servidor" en vez de fallar en silencio. Ver `.env.example`.

**iOS:** solo funciona con la PWA agregada a la pantalla de inicio (standalone);
en una pestaña de Safari `PushManager` no existe (`needsIosInstall()`).

`public/sw.js` es el service worker que recibe el push (`{ title, body, url }`),
muestra la notificación y maneja el click.

## Testing

- `tests/unit/` — Jest, sobre todo lógica pura de `lib/` (orden de canchas, home, definitions/Zod, dal, envío de push).
- `tests/e2e/` — Playwright, flujo de home end-to-end.

## Notas para trabajar con Claude Code en este repo

- `AGENTS.md` (raíz) advierte que esta versión de Next.js puede diferir de lo que Claude "sabe" de entrenamiento — revisar `node_modules/next/dist/docs/` antes de usar APIs de Next que parezcan poco comunes.
- No hay migraciones en el repo (no hay carpeta `supabase/`) — el esquema/RLS/realtime se maneja directamente en el proyecto remoto de Supabase (vía el MCP de Supabase: `apply_migration`, etc.). Si cambia el esquema, `lib/supabase/database.types.ts` se regenera (`generate_typescript_types`, no se edita a mano).
- Antes de agregar una función de lectura nueva, revisar si ya existe algo parecido en `lib/auth/dal.ts` — es el único lugar donde deberían vivir los `select` a Supabase desde el server.
