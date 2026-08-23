# Arquitectura de Kancha

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
   - Llama a funciones de **lectura de datos** también en `lib/auth/dal.ts` (ej. `getOpenMatches()`, `getCourts()`) — estas hacen la query a Supabase directamente desde el server. `getMyInvolvedMatches()` es la que arma "Mis partidos" en `/partidos`: organizados + partidos donde soy participante `confirmado` (a diferencia de `getMyMatches()`, que solo cubre los que organizo).
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
    matches.ts      crear partido (con difusión opt-in), editar partido (`updateMatch`, `/partidos/[id]/editar`), unirse (públicos), invitar/responder invitación (públicos y privados), aprobar/rechazar, cambiar visibilidad
    courts.ts       agregar/editar cancha (admin)
    ratings.ts      calificar una cancha (1-5 estrellas, upsert por usuario+cancha)
    profile.ts      onboarding / editar perfil
    push.ts         guardar/borrar suscripción push, notificación de prueba, diagnóstico
    friends.ts      enviar/aceptar/rechazar/cancelar solicitud de amistad, eliminar amigo, buscar usuarios
    groups.ts       crear/renombrar/eliminar grupo, invitar/responder invitación de grupo, salir/sacar miembro, unirse por link (rotar/canjear token), buscar usuarios para invitar a un grupo
    location.ts     buscar lugar (geocoding) y guardar la ubicación del usuario
    notifications.ts  marcar notificaciones in-app como leídas (`markAllNotificationsRead`, `markNotificationRead`)
    chat.ts         enviar un mensaje al chat de un partido (`sendMatchMessage`)
    payments.ts     notificar pago de un jugador (`reportPayment`) y confirmarlo/marcarlo el organizador (`setPaymentConfirmed`)
  (rutas)/          una carpeta por ruta, `page.tsx` server + a veces un `*-form.tsx` cliente al lado (incluye `invitaciones/`, la página de invitaciones a partidos y grupos; `notificaciones/`, el centro de notificaciones in-app; `grupos/`, `grupos/[id]/` y `grupos/unirse/[token]/`; `mapa/` el mapa full-screen de canchas — `canchas/` renderiza la misma `MapExperience` que `/mapa`)
  admin/            panel simple (solo `is_admin`), sin nav propia — ve usuarios, partidos, canchas, métricas
  login/, signup/, onboarding/   flujo de auth y setup inicial de perfil
  recuperar/, restablecer/   pedir enlace de recuperación de contraseña y setear la nueva (ver sección Autenticación)
  auth/confirm/route.ts   Route Handler que recibe el link del email de confirmación o de recuperación (código PKCE) y crea la sesión server-side (ver sección Autenticación)

lib/
  auth/
    dal.ts          Data Access Layer: TODAS las lecturas de Supabase + verifySession/requireSession/requireAdmin (incluye `getMyRatingForCourt`)
    definitions.ts  tipos/esquemas de auth
  matches/, courts/, push/, friends/, groups/, chat/, payments/
    definitions.ts  esquemas Zod + tipos de formulario por dominio
    home.ts, sort.ts, amenities.ts, sports.tsx   lógica de negocio pura (ordenar, filtrar, catálogo de deportes) — testeada en tests/unit. `sports.tsx` es el catálogo canónico de deportes (`SPORTS`/`getSport`/`SPORT_CATALOG_KEYS`): cada deporte tiene un `icon` (`IconSource` de `lib/icons/svg-icon.ts`) que se renderiza tanto como componente React (`SportIcon`) como string SVG para los pines del mapa (`renderIconSource`), así el chip y el pin son el mismo dibujo. `IconSource` es `{kind:"stroke", nodes, strokeWidth?}` (glifo 24x24 a mano estilo lucide — futsal, tenis de mesa y racquetball, sin equivalente real) o `{kind:"fill", viewBox, markup}` (silueta rellena tomada de un asset SVG externo, con el `fill` hardcodeado quitado para que `currentColor` se herede — fútbol, básquet, vóleibol, y el mismo glifo de pelota de tenis compartido por tenis/pádel/tenis de playa).
    push/send.ts, push/match-notifications.ts, push/group-notifications.ts, push/friend-notifications.ts, push/chat-notifications.ts, push/payment-notifications.ts   envío Web Push (server-only) + copy/destinatarios por evento; `send.ts` expone `notifyAndPersist` (push + fila in-app) además del `notifyUsers`/`notifyMatchAudience` de solo push. `chat-notifications.ts` (`notifyMatchChat`) es la única excepción deliberada al patrón push+in-app: usa solo `notifyUsers` (sin persistir en `notifications`) porque un feed in-app con cada mensaje de chat sería ruido — mismo criterio que `notifyMatchAudience`
  notifications/
    create.ts       `persistNotifications` (server-only, admin client) — guarda la fila in-app en la tabla `notifications`, llamado desde `notifyAndPersist`
  supabase/
    server.ts       cliente Supabase para Server Components/Actions (cookies de next/headers)
    client.ts        cliente Supabase para Client Components (browser)
    admin.ts        cliente service-role (saltea RLS) — SOLO para el envío de push
    proxy.ts         refresca el token de sesión (llamado desde el middleware/proxy de Next)
    database.types.ts  tipos generados desde el esquema real de Supabase (no editar a mano)
  geo/
    distance.ts     cálculo de distancia (haversine) para ordenar/mostrar por cercanía
    geocode.ts      geocoding de texto libre (ciudad/estado) vía Nominatim, usado por app/actions/location.ts
  icons/svg-icon.ts  renderiza nodos estilo lucide-react a un string SVG (para pines de mapa, que no pueden montar componentes React)

components/
  home/             piezas del home (carrusel "Canchas Oficiales" — CTA "¿Tienes una cancha?" abre WhatsApp, ver `SPONSOR_INQUIRY_WHATSAPP` en `featured-courts-carousel.tsx`, mismo número que "Quiero ser partner" en `components/courts/official-upsell.tsx` —, tarjeta "Cerca de ti" con mini-mapa → `/mapa`, "invitaciones", "de tus amigos", "te necesitan ya" — este último con la fila de íconos de deporte debajo del título, filtro multi-select en memoria), add-to-home-screen-guide.tsx (guía de instrucciones para agregar la PWA a la pantalla de inicio del teléfono — oculta si ya está instalada, con pasos separados para iPhone y Android), match-card.tsx compartido
  matches/          visibility-toggle.tsx (3 niveles pública/amigos/privada, se usa al crear y en el detalle), match-visibility-switch.tsx, invite-players.tsx (organizador invita jugadores a un partido privado: sección plegable "Invitar a un grupo" por grupo — evita apilar un botón por grupo — + panel de amigos con buscador/lista con scroll, multi-selección y "invitar a todos mis amigos", combinando `getMyFriends()`/`getMyGroups()` con `searchUsersAction`), partidos-client.tsx (client de `/partidos`: control segmentado "Explorar"/"Mis partidos" — ambas listas verticales, un carrusel horizontal perjudicaría el escaneo de una lista para decidir — con filtro por chips de deporte en "Explorar", reutilizando `SPORTS`/`SportChip`), match-chat.tsx (`MatchChat`, chat de un partido en `/partidos/[id]`, visible solo a organizador/confirmados — ver "Chat y pago" abajo), report-payment-button.tsx (botón "Notificar pago" con input de referencia, llama `reportPayment`)
  courts/           inputs de formulario de cancha (comodidades + deportes), court-picker.tsx (selector desplegable de cancha al crear partido), sport-chip.tsx (chip de un deporte — ícono siempre, etiqueta opcional vía `showLabel` — compartido por el filtro del home, `/mapa` y el selector de deporte al crear partido), rating-stars.tsx (estrella/fila de estrellas + promedio y cantidad, solo lectura — variante `compact` para el badge del pin y las tarjetas de `/mapa`, `detail` para la ficha de la cancha; "Sin calificaciones" si `count === 0`), rate-court.tsx (picker interactivo de 1-5 estrellas en la ficha de la cancha, llama a `rateCourt`), court-hero.tsx (hero full-bleed con foto/degradado + badge "Oficial" para la ficha de canchas `is_official`, con fallback de color plano si no hay fotos), amenities-showcase.tsx (grid de comodidades en tiles con ícono, la versión "premium" de las mismas `AMENITIES` que `amenity-icons.tsx` renderiza como chips compactos en las tarjetas), official-upsell.tsx (tarjeta "hazte partner oficial" mostrada en la ficha de canchas no oficiales en vez de WhatsApp/Reserva/Comodidades/Fotos)
  friends/          buscador de usuarios + botón "agregar" (friend-search.tsx), usado en /amigos; add-friend-button.tsx (botón "Agregar" reutilizable que llama `sendFriendRequest` con estado optimista, usado en /grupos/[id] junto a miembros que no son amigos)
  groups/           buscador para invitar a un grupo (group-user-search.tsx — también lista los amigos del usuario para invitarlos de un toque sin buscar), form de renombrar (rename-group-form.tsx), usados en /grupos/[id]; create-group-form.tsx en /grupos
  location/         location-selector.tsx — dropdown de ubicación app-wide, montado en el cuerpo de `/` (home), `/mapa` y `/partidos`, guarda en `users.location_*` (`setUserLocation`) y refresca la página; city-picker.tsx — input de búsqueda + botón GPS + lista de resultados (`searchVenezuelaCities`, `lib/geo/venezuela-cities.ts`, lista curada de ciudades venezolanas — Nominatim no era confiable para pueblos chicos), factorizado de `location-selector.tsx` para poder incrustarse (sin dropdown) en el onboarding y en `/perfil`
  onboarding/       onboarding-tour.tsx (`OnboardingTour`) — tour interactivo de coach marks (spotlight) montado en `HomeClient`, se dispara una sola vez cuando `users.onboarding_tour_completed` es `false`. Resalta elementos reales del layout marcados con `data-tour` (el FAB de crear en `bottom-nav-inner.tsx`, los tabs `partidos`/`canchas`/`invitaciones` de la misma barra, y el botón "Social" de `header-nav.tsx`) con tarjetas centradas de bienvenida/cierre entre medio. Incluye un paso sobre guardar la app en la pantalla de inicio que referencia la guía del Home (ver `components/home/add-to-home-screen-guide.tsx`). Al terminar o saltar llama a `completeOnboardingTour` (`app/actions/profile.ts`) y espeja el flag en `localStorage` para no parpadear en visitas repetidas antes de que el server revalide
  profile/          edit-profile-section.tsx — sección editable de `/perfil` (ciudad vía `CityPicker`, vibra, deportes favoritos vía `SportChip` multi-select, todo menos `name`), llama `updateProfile`; mismo patrón `useTransition` + action que `notification-preferences.tsx`
  mapa/             pantalla full-screen de `/mapa`: chips de deporte (ícono + etiqueta, single-select, vía `SportChip`), mapa y carrusel de tarjetas de canchas
  map/map-shared.tsx  tiles oscuros (`DarkTiles`) + `buildCourtIcon` (pin oscuro: cero deportes → pin genérico, uno → badge redondo con su ícono, dos o más → píldora horizontal con hasta 3 íconos — priorizando los deportes favoritos del usuario (`opts.preferredSports`, de `profile.sport_preferences`) que la cancha ofrece y rellenando con el resto — más un "+N" si la cancha ofrece más de 3, ver `pickPinSports`; badge de check en la esquina cuando `opts.official`/`is_official`, mismos colores que el chip "Oficial" del resto de la app) + `CourtPopupContent` (contenido del popup del pin: nombre, `RatingStars` compacto si se pasan `ratingAvg`/`ratingCount` (solo el popup de `/mapa` los pasa), chips de deporte si son varios, link "Ver cancha" opcional) — usados por todos los mapas del repo
  bottom-nav*.tsx   tab bar inferior — navegación PRIMARIA, igual en toda resolución (solo visible logueado): Inicio · Partidos · [+ Crear] · Canchas · Invitaciones (badge con conteo de invitaciones a partido+grupo, refrescado por realtime en match_participants/group_members)
  site-logo.tsx     wordmark de la app (`SiteLogo`, `next/image` `unoptimized` apuntando al asset de Cloudinary) — usado en el header y en `/login`
  site-header.tsx   header superior; monta el logo (`SiteLogo`, izquierda, linkea a `/`) y `HeaderNav` (derecha). El selector de ubicación ya no vive aquí, ver `location/` arriba
  header-nav.tsx    navegación SECUNDARIA del header, igual en toda resolución — deliberadamente no duplica el tab bar: campana de notificaciones (→ `/notificaciones`, badge de no leídas, refrescado por realtime en `notifications`), menú "Social" (Amigos + Grupos, badge de solicitudes de amistad, refrescado por realtime en friendships) y menú de cuenta (avatar con inicial → Perfil, Admin si `is_admin`, Cerrar sesión)
  notifications/notifications-list.tsx   feed de `/notificaciones` (client): ícono por tipo de evento, resalta no leídas, marca todo como leído al montar (`markAllNotificationsRead`), cada ítem enlaza al deep-link guardado en la notificación
  *-map*.tsx        mapas Leaflet (hay un wrapper "-inner" porque Leaflet no soporta SSR)

docs/
  mvp-spec.md       qué es el producto, qué SÍ y qué NO construir, modelo de datos, modelo de monetización
  home-ui-spec.md   detalle de implementación del home
```

## Modelo de datos (resumen — ver `docs/mvp-spec.md` para el detalle y el porqué)

- `users` — perfil, `is_admin`. `location_label`/`location_lat`/`location_lng` son la ciudad del usuario — **un solo campo, una sola fuente de verdad**, usado tanto para centrar mapas/calcular distancias como para mostrarse en el perfil. Se fija en el onboarding y se puede editar en dos lugares que escriben las mismas columnas: el dropdown de `/`, `/mapa` y `/partidos` (`components/location/location-selector.tsx` → `setUserLocation` en `app/actions/location.ts`) y `/perfil` (`EditProfileSection` → `updateProfile`, ver `components/profile/`) — cambiarla desde cualquiera de los dos actualiza el otro (ambos hacen `revalidatePath("/", "layout")`). Ambos reusan el mismo picker de ciudades venezolanas, `components/location/city-picker.tsx`. La columna `zone` (texto libre tipo "zona/barrio") quedó sin usar por el código de la app — ya no se pide ni se edita ni se muestra en ningún lado (perfil, onboarding, tarjetas de /amigos, /grupos, /admin); no se borró de la base de datos, solo se dejó de leer/escribir. `vibe` y `sport_preferences` (array de claves de `SPORT_CATALOG_KEYS`, elegidas con `SportChip` multi-select) se fijan en el onboarding (`completeOnboarding`) y se pueden editar después desde `/perfil` (`EditProfileSection` → `updateProfile`); `name` es la única excepción, solo de lectura tras el onboarding. `sport_preferences` también alimenta los pines del mapa: `buildCourtIcon` los usa para priorizar qué íconos de deporte mostrar primero en canchas multi-deporte (ver `map/map-shared.tsx` arriba). `onboarding_tour_completed` (default `false`) rastrea si el usuario ya vio el tour interactivo del home (ver `components/onboarding/` arriba); se marca `true` con `completeOnboardingTour` (`app/actions/profile.ts`) al terminarlo o saltarlo.
- `friendships` — amistad mutua entre dos usuarios (`requester_id`, `addressee_id`, `status`: `pendiente`/`aceptada`/`rechazada`). Una amistad `aceptada` es también lo que define la "red directa" del organizador de un partido: la RPC `is_direct_network(organizer, candidate)` consulta esta tabla, y de ahí sale si alguien entra `confirmado` (amigo directo) o `pendiente` (externo) al pedir unirse a un partido público (ver `match_participants` abajo). Un índice único evita pares duplicados sin importar la dirección. `getFriendRelations(userIds)` (`lib/auth/dal.ts`) centraliza el cálculo de la relación de amistad del usuario actual contra una lista de ids — lo usan `searchUsers`, `getGroup` (este último etiqueta cada `GroupMemberRow` con `friendRelation` para mostrar el botón "Agregar" a miembros de un grupo que todavía no son amigos) y `/partidos/[id]` (llama `getFriendRelations` sobre los participantes `confirmado` del partido para mostrar el mismo botón `AddFriendButton`/estado junto a cada jugador de la lista "Confirmados", sin importar si sos el organizador).
- `courts` — cancha. `is_official` distingue cancha "de verdad" (con ficha, fotos, aparece en explorador y en el home) de una ubicación disponible solo para elegir al crear partido. En la ficha de la cancha (`app/canchas/[id]/page.tsx`) `is_official` además gatea la UI: solo las oficiales muestran el hero de foto (`CourtHero`), WhatsApp/Reservar (`CourtContactActions`), la sección de comodidades (`AmenitiesShowcase`) y la galería de fotos — las no oficiales ven una versión mínima (nombre, mapa, rating, "Cómo llegar") + una tarjeta de upsell (`OfficialUpsell`) invitando a hacerse partner. `sponsored_until`/`sponsor_priority` son el nivel pago (destacado en home) y es un concepto aparte de `is_official` (una cancha oficial puede o no estar patrocinada; el badge "Patrocinado" en la ficha depende solo de `sponsored_until`). `sports` (array de claves de `lib/courts/sports.tsx`) determina qué deportes ofrece — se elige con checkboxes en el form de admin (`CourtSponsorshipFields`) — y los íconos del pin en el mapa (`buildCourtIcon`, ver arriba). `address` es texto libre mostrado en las tarjetas de `/mapa`. `schedule` es texto libre para la ficha de la cancha; `opens_at`/`closes_at` (hora) + `open_days` (array de días con la convención `Date.getDay()` de JS: 0=domingo..6=sábado) son el horario estructurado usado para calcular "abierto hoy" — ver `lib/courts/hours.ts`. Por ahora el badge de horario en el selector de crear partido solo se muestra para canchas `is_official` (hoy, Cantera — que ofrece fútbol, pádel y futsal). `rating_avg`/`rating_count` son un agregado desnormalizado mantenido por un trigger (`recompute_court_rating`) sobre `court_ratings` — se lee directo de `courts` (sin join) en todos los mapas y en la ficha de la cancha. Aplica tanto a canchas oficiales como no oficiales; en las tarjetas de `/mapa` el rating reemplaza al cuadro de imagen en las no oficiales (que nunca tienen fotos).
- `court_ratings` — una fila por `(court_id, user_id)` (constraint único, permite upsert = "editar mi calificación"), `rating` entero 1-5. RLS: lectura abierta a autenticados, escritura solo de la fila propia (`user_id = auth.uid()`). Se califica desde la ficha de la cancha (`components/courts/rate-court.tsx` → `rateCourt` en `app/actions/ratings.ts`); el promedio/cantidad vive desnormalizado en `courts.rating_avg`/`rating_count` (ver arriba), no se lee esta tabla para mostrarlo.
- `matches` — partido: cancha, deporte (`sport`, uno de `SPORT_CATALOG_KEYS` de `lib/courts/sports.tsx`; se elige al crear el partido con `SportChip` y solo se listan/muestran en el mapa las canchas cuyo `sports[]` incluye ese deporte), organizador, fecha, cupos, `status` (`abierto`/`completo`/`cancelado`/`vencido`), `visibility` (enum `match_visibility`: `publica`/`amigos`/`privada`) controla la **visibilidad Y cómo se llenan los cupos**: `publica` = aparece en el explorador/home (excepto para su propio organizador, ver `getOpenMatchesWithCourtGeo`) y cualquiera puede pedir unirse (`joinMatch`, sigue aprobación del organizador) — el organizador **también** puede invitar directamente; `amigos` = no aparece en `/partidos` ni en el explorador público, pero sí en la sección "De tus amigos" del home (`getFriendsMatches` en `lib/auth/dal.ts`) para cada amigo directo del organizador, quien puede pedir unirse igual que en una pública; `privada` = no aparece en ningún listado, ni siquiera para amigos — no hay "pedir unirse", el organizador solo puede **invitar** explícitamente (`inviteToMatch`, ver abajo). En los tres casos, si al partido le siguen faltando cupos y no es `publica`, el detalle le sugiere al organizador hacerlo público (reutiliza `setMatchVisibility`) en vez de ofrecer un canal de notificación por audiencia. La lectura de `amigos`/`privada` fuera de esos canales ya es posible por la RLS de `SELECT` de `matches` (permite leer cualquier `status = "abierto"` sin importar `visibility`), pero el filtrado por nivel vive en la capa de app (DAL), no en RLS. **Editar (`/partidos/[id]/editar`, `updateMatch`):** el organizador puede corregir cancha, deporte, fecha/hora, vibra, cupos y pago móvil de un partido `abierto`/`completo` (no `cancelado`/`vencido`) — la visibilidad sigue teniendo su propio switch, fuera de este form. Reutiliza `UpdateMatchFormSchema` (deriva del mismo shape que `CreateMatchFormSchema` en `lib/matches/definitions.ts`, sin `visibility`/`notifyAudience`). No deja bajar `totalSlots` por debajo de `slots_filled` actual. Si cambia alguno de los campos que le importan a un jugador (fecha/hora, cancha, deporte, vibra, cupos), dispara `notifyMatchUpdated` a los confirmados; los cambios de pago móvil no notifican.
- `match_participants` — quién está en qué partido, con `status`: `confirmado` (jugando), `pendiente` (solicitud a un partido público, esperando aprobación del organizador vía `respondToRequest`), `rechazado` (solicitud rechazada), o `invitado` (invitación del organizador a un partido privado, esperando respuesta del invitado — ver abajo). El organizador se inserta `confirmado` al crear el partido (no es una solicitud). `joined_via` (`red_directa`/`externo`, calculado con la RPC `is_direct_network`) es solo informativo. El trigger `recalc_match_slots` solo cuenta filas `confirmado` para `slots_filled`, así que ni una solicitud `pendiente` ni una invitación `invitado` ocupan cupo hasta confirmarse. `getMyInvolvedMatches` (`lib/auth/dal.ts`) además cuenta, por cada partido que el usuario organiza, sus filas `pendiente` (`MatchWithCourt.pendingRequestCount`) para el badge "N por aprobar" que muestra `partidos-client.tsx` en "Mis partidos". `payment_reference`/`payment_reported_at`/`payment_confirmed_at` son el estado de pago de dos pasos — ver "Chat y confirmación de pago" abajo.
  - **Flujo de invitación (públicos y privados):** el organizador de cualquier partido abierto con cupos libres llama `inviteToMatch` (elige "todos mis amigos" o usuarios específicos vía el panel de amigos de `components/matches/invite-players.tsx`, que combina la lista de `getMyFriends()` con `searchUsersAction`) o `inviteGroupToMatch` (invita de un toque a todos los `miembro` de uno de sus grupos, elegido en la sección plegable "Invitar a un grupo" del mismo `invite-players.tsx` + `getGroupMemberIds`) — ambas comparten el helper privado `inviteUserIdsToMatch` (skip de duplicados, `is_direct_network`, insert, `notifyInvited`, `revalidatePath`) para no duplicar esa lógica. Insertan filas `invitado`, saltando duplicados. El invitado ve la invitación en el home (`InvitationsSection`), en `/invitaciones`, y en el detalle del partido, y llama `respondToInvitation`: aceptar pasa la fila a `confirmado` directo (sin aprobación extra del organizador — ya decidió al invitar); rechazar **borra** la fila, así el organizador puede reinvitar. RLS: policy de INSERT permite al organizador insertar `invitado`; policy de UPDATE permite al invitado pasar su propia fila de `invitado` a `confirmado` (no puede escribir otro status).
- `push_subscriptions` — suscripciones Web Push por usuario.
- `notifications` — historial in-app de eventos sociales (`user_id` destinatario, `type`, `title`/`body`, `url` deep-link, `actor_id` opcional, `read_at`). Se escribe en el mismo punto donde hoy se envía el push equivalente, vía `notifyAndPersist` (ver más abajo). RLS: `SELECT`/`UPDATE` solo de la fila propia (`user_id = auth.uid()`); **sin** policy de `INSERT` para clientes normales — se escribe con el cliente service-role (`lib/supabase/admin.ts`), igual que la lectura cross-user de `push_subscriptions`. Habilitada en `supabase_realtime` para el badge de la campana.
- `court_events` — tracking simple (impresión, click, whatsapp, directions, promo_copy, match_created) usado en métricas de admin.
- `groups` — grupo de amigos con nombre, `owner_id` (creador) e `invite_token` (uuid, rotable con `rotateGroupInviteToken`, único, es lo que canjea `/grupos/unirse/[token]`). El creador no puede salirse del grupo (solo eliminarlo, `on delete cascade` limpia las membresías) y es el único que renombra/elimina/saca miembros; cualquier `miembro` puede invitar y compartir el link.
- `group_members` — quién pertenece a qué grupo, con `status` (`invitado`/`miembro`) e `inviter_id`. Índice único por par `(group_id, user_id)`, igual que `friendships`. **Flujo de invitación:** un miembro llama `inviteToGroup` (buscador `components/groups/group-user-search.tsx` + `searchUsersForGroup`) → inserta filas `invitado`, saltando duplicados, y dispara `notifyGroupInvited`. El invitado ve la invitación en `/invitaciones` y llama `respondToGroupInvitation`: aceptar pasa a `miembro`; rechazar **borra** la fila (mismo patrón que las invitaciones a partido). **Unirse por link:** `/grupos/unirse/[token]` primero muestra una vista de confirmación (`getGroupPreviewByToken`, RPC de solo lectura) — abrir el link nunca une por sí solo, porque un GET (prefetch de Next, preview de link de WhatsApp) no debe tener efectos secundarios; el botón "Unirme" llama la action `joinGroupByToken`, que ejecuta la RPC `join_group_by_token` (inserta/actualiza a `miembro`, también acepta una invitación pendiente). Ambas RPCs son `SECURITY DEFINER` y tienen `EXECUTE` revocado de `anon` explícitamente — en Supabase el privilegio se otorga por defecto de forma directa al crear la función, así que `revoke ... from public` solo no alcanza. RLS de `group_members` usa tres helpers `SECURITY DEFINER` (`user_is_group_member`, `user_has_group_row`, `user_is_group_owner`) para evitar la recursión infinita que produciría una policy de SELECT auto-referenciada (mismo patrón que `user_is_match_participant`/`user_is_match_organizer`).

- `chat_messages` — mensajes del chat de un partido (`match_id`, `user_id`, `body`, `created_at`). RLS de `SELECT`/`INSERT` exige `user_is_match_organizer(match_id) OR user_is_confirmed_in_match(match_id)` (este último ya existía para la RLS de `match_participants`); sin `UPDATE`/`DELETE`. Habilitada en `supabase_realtime`.

Regla de negocio clave que se repite en el código: **nunca hay pagos dentro de la app** — todo `payment*` en `matches` (banco, teléfono, cédula, monto) es solo información para coordinar el pago externo (Pago Móvil), no una transacción real. Lo mismo aplica a la confirmación de pago descrita abajo: la referencia es solo un dato para que el organizador verifique el Pago Móvil por fuera.

## Chat y confirmación de pago

**Chat (`/partidos/[id]`, sección "Chat del partido").** Visible solo al organizador y a los participantes `confirmado` (mismo criterio que la RLS de `chat_messages`). `getChatMessages` (`lib/auth/dal.ts`) trae el historial server-side; `components/matches/match-chat.tsx` (`MatchChat`) se suscribe a `postgres_changes` INSERT en `chat_messages` filtrado por `match_id` y agrega `payload.new` directo al estado local — a diferencia del patrón `home-client.tsx`/`header-nav.tsx`/`bottom-nav-inner.tsx` (realtime → debounce → `router.refresh()`), acá no tiene sentido re-pedir toda la página por cada mensaje. Enviar un mensaje (`sendMatchMessage`, `app/actions/chat.ts`) dispara `notifyMatchChat` (`lib/push/chat-notifications.ts`) a los demás confirmados + organizador — solo push, sin persistir en `notifications` (ver arriba, mismo criterio que `notifyMatchAudience`).

**Pago, flujo de dos pasos.** Si el organizador dejó `payment_amount_bs` en el partido, cada jugador `confirmado` ve un botón "Notificar pago" (`components/matches/report-payment-button.tsx`) que pide un número de referencia y llama `reportPayment` (`app/actions/payments.ts`) → RPC `report_match_payment` (`SECURITY DEFINER`, valida que quien llama esté `confirmado` en ese partido y que el partido tenga datos de pago) → dispara `notifyPaymentReported` al organizador. El check verde en la lista de "Confirmados" **solo aparece cuando el organizador confirma** — con el mismo botón cubre dos casos: confirmar la referencia notificada, o marcar manualmente a alguien que pagó por otro medio (efectivo, etc.) sin haber notificado nada. Ambos casos llaman `setPaymentConfirmed` (`app/actions/payments.ts`) → RPC `set_participant_payment_confirmed` (`SECURITY DEFINER`, valida que quien llama sea `user_is_match_organizer` de esa fila) → dispara `notifyPaymentConfirmed` al jugador solo al confirmar (no al desmarcar). Estas dos RPCs existen porque la RLS normal de `match_participants` no permite que el propio jugador ni el organizador escriban estas columnas directamente.

## Autenticación

- Supabase Auth. Registro **abierto** — cualquiera puede crear cuenta desde `/signup` (`signup-form.tsx`), sin código de invitación. `handle_new_user` (trigger de alta) solo crea la fila en `public.users`; ya no valida ni depende de ningún código.
- `verifySession()` (memoizada con `cache()` de React, por request) es la fuente de verdad de sesión. `requireSession()`/`requireAdmin()` son los guards que usan los Server Actions.
- El middleware (`lib/supabase/proxy.ts`) solo refresca el token de cookies — **no es la barrera de seguridad**, cada action revalida sesión por su cuenta.
- `/login` acepta `?next=<path>` (usado por `/grupos/unirse/[token]` para volver ahí tras iniciar sesión): `login-form.tsx` lo manda como campo oculto y la action `login` solo redirige ahí si es un path relativo (`startsWith("/")` y no `"//"`, para evitar un open-redirect), si no cae en `/`.
- **Confirmación de email tras el signup.** `signup` (`app/actions/auth.ts`) llama `supabase.auth.signUp` con `emailRedirectTo: <origin>/auth/confirm?next=/onboarding` (origin sacado del header `Origin` de la request, así funciona igual en local y en prod sin env var). Si no hay sesión inmediata devuelve `{ success: true, message }` y `signup-form.tsx` reemplaza el form por una pantalla de confirmación en vez de seguir mostrando los inputs. Ese link apunta al `/auth/v1/verify` hosteado por Supabase, que verifica el token y redirige a `redirect_to` (el `emailRedirectTo` de arriba). Como el cliente usa `flowType: "pkce"` (default de `@supabase/ssr`, ver `lib/supabase/server.ts`/`client.ts`), esa redirección llega con `?code=...` en vez de tokens en el hash — por eso `app/auth/confirm/route.ts` (Route Handler, no Server/Client Component: necesita leer query params server-side) hace `exchangeCodeForSession(code)` para dejar la sesión en cookies (lo que lee `verifySession()`), y redirige a `next` si funciona. Si `exchangeCodeForSession` falla (típicamente porque falta la cookie `code_verifier` — el link se abrió en un navegador/app distinto al que hizo el signup o la recuperación), el email/token ya quedó validado igual del lado de Supabase (eso pasa en `/verify`, antes de llegar a este Route Handler) — por eso ese caso redirige a `/login` sin el mensaje de "link inválido o expirado" (sería falso: si hubiera sido eso, `exchangeCodeForSession` no habría llegado a ejecutarse porque tampoco habría `code`). Ese mensaje (`/login?error=confirmacion`) solo aplica cuando no hay `code` ni `token_hash` válido de entrada. También soporta `token_hash`/`type` (`verifyOtp`) como fallback, por si algún día se cambia algún template a `{{ .TokenHash }}`.
- **Recuperación de contraseña.** `/recuperar` (`recuperar-form.tsx`) llama a la action `requestPasswordReset`, que hace `supabase.auth.resetPasswordForEmail(email, { redirectTo: <origin>/auth/confirm?next=/restablecer })` y **siempre** responde con el mismo mensaje de éxito, exista o no ese email (evita que el endpoint sirva para enumerar cuentas). El link del correo cae en `app/auth/confirm/route.ts` (mismo Route Handler que la confirmación de signup), que intercambia el código y deja la sesión en cookies, y redirige a `/restablecer`. Ahí, `restablecer-form.tsx` llama a la action `updatePassword`, que usa `supabase.auth.updateUser({ password })` sobre esa sesión ya autenticada.
- **Envío de correos de auth (Resend).** El proyecto no envía correos desde el código de la app — Supabase los manda directo, configurado con **SMTP custom apuntando a Resend** (dashboard → Authentication → Emails/SMTP Settings). Los templates HTML branded (logo, paleta oscura + lima) están versionados en `docs/email-templates/` (`confirm-signup.html`, `reset-password.html`) para pegar en el dashboard de Supabase → Email Templates; ambos usan `{{ .ConfirmationURL }}`, que es la variable que espera el flujo PKCE de arriba (no cambiar a `{{ .TokenHash }}`). La API key de Resend vive solo en la config de Supabase, nunca en el repo ni en env vars de la app. Pasos completos de configuración (dominio en Resend, SMTP, templates, URL Configuration): `docs/email-setup.md`. **Importante:** en el dashboard de Supabase (Authentication → URL Configuration) el `Site URL` y los `Redirect URLs` tienen que incluir el dominio de prod (`https://juegakancha.netlify.app/**`) — si el `Site URL` sigue en `localhost`, los correos (confirmación y recuperación) linkean ahí sin importar lo que haga el código.

## Notificaciones (push + centro in-app)

**Suscripción (cliente).** El usuario activa el toggle en `components/enable-notifications.tsx`
→ `subscribeToPush()` (`lib/push/subscribe-client.ts`) → la action `savePushSubscription`.
Si el toggle está desactivado (`getPushSubscriptionStatus()` devuelve `disabled`/`denied`),
`components/home/notifications-banner.tsx` muestra un aviso permanente debajo del carrusel de
canchas oficiales en el Home, que enlaza a `/perfil#notificaciones` (id agregado en
`notification-preferences.tsx`) para activarlas desde ahí.
`Notification.requestPermission()` es lo **primero** que corre y tiene que
llamarse desde un gesto del usuario: iOS solo muestra el prompt nativo mientras
la página conserva user activation, y cualquier `await` previo lo pierde. Por eso
el onboarding ya no pide el permiso dentro de su form action — solo guarda los
scopes y remite a Ajustes.

**Envío (servidor).** `lib/push/send.ts` (`server-only`) envuelve `web-push`:
- `notifyUsers(userIds, payload)` — solo push, destinatarios concretos.
- `notifyMatchAudience(supabase, matchId, payload)` — solo push, difusión "faltan
  jugadores", uniendo los scopes de `AUDIENCE_SCOPES` vía la función SQL
  `resolve_audience_subscriptions` y deduplicando por endpoint.
- `notifyAndPersist(supabase, userIds, payload, type, actorId?)` — push (`notifyUsers`)
  **y**, en paralelo, guarda la misma notificación en la tabla `notifications`
  (`persistNotifications`, `lib/notifications/create.ts`) para que quien no vio/no
  tiene el push activado la encuentre igual en `/notificaciones`. Es lo que usan
  todos los eventos dirigidos a usuarios concretos; los de audiencia amplia
  (`notifyMatchAudience`, "faltan jugadores") se quedan solo en push a propósito —
  serían ruido en un feed personal.
- Todo es best-effort: nunca lanza (una notificación caída no puede tumbar la
  action que ya escribió), y ante 404/410 borra la suscripción muerta.

Los textos y la búsqueda de destinatarios viven en `lib/push/match-notifications.ts`,
para que `app/actions/matches.ts` siga tratando de la escritura. Disparadores:
`inviteToMatch`/`inviteGroupToMatch`, `joinMatch` (avisa al organizador de la solicitud),
`respondToInvitation` aceptando (avisa al organizador de que el invitado ya está dentro,
vía `notifyMatchJoined` — el organizador se entera de todo ingreso, sea por solicitud o
por invitación aceptada), `respondToRequest` (solo al aprobar), `cancelMatch`, `reopenMatch`
y `updateMatch` (participantes confirmados; `notifyMatchUpdated` solo si cambió algo que les
importa — fecha/hora, cancha, deporte, vibra o cupos). Crear un
partido **no** avisa por sí solo: la difusión a la audiencia es opt-in, con la
casilla `notifyAudience` del formulario de creación, y solo para públicos.
Mismo patrón para grupos en `lib/push/group-notifications.ts`: `inviteToGroup`
dispara `notifyGroupInvited`, y aceptar una invitación o unirse por link dispara
`notifyGroupJoined` al dueño del grupo (salir o sacar a alguien no notifican).
Y para amistades en `lib/push/friend-notifications.ts`: `sendFriendRequest` dispara
`notifyFriendRequest`, `acceptFriendRequest` dispara `notifyFriendAccepted`
(rechazar/cancelar/eliminar no notifican). El chat y la confirmación de pago
de un partido tienen su propio patrón — ver "Chat y confirmación de pago" arriba.
`sendTestNotification` y `getPushDiagnostics` en `app/actions/push.ts` permiten
verificar la cadena completa desde el propio teléfono (Ajustes → notificaciones) —
pero solo cubren el push a uno mismo (subscription propia, legible por RLS); no
prueban el camino cross-user (`notifyAndPersist` a otro usuario), que depende de
la service-role key de más abajo.

**Centro in-app (`/notificaciones`).** Cada fila que `notifyAndPersist` guarda queda
disponible en `getNotifications()`/`getUnreadNotificationCount()` (`lib/auth/dal.ts`).
La campana de `header-nav.tsx` (badge de no leídas, refrescado por realtime sobre
`notifications`) enlaza a `app/notificaciones/page.tsx`, que renderiza
`components/notifications/notifications-list.tsx` y marca todo como leído
(`markAllNotificationsRead`, `app/actions/notifications.ts`) al montarse. Es un feed
puramente informativo — no reemplaza `/invitaciones` ni sus badges, que siguen
siendo el lugar donde se acepta/rechaza.

**RLS.** `push_subscriptions` y `notifications` normalmente están limitadas a su
dueño, así que escribir/notificar a otros usuarios prefiere el cliente
service-role de `lib/supabase/admin.ts` — es el único lugar que lo usa (tanto
`getSubscriptionsForUsers` como `persistNotifications`). La alternativa (una
función `SECURITY DEFINER` genérica) tendría que ser ejecutable por
`authenticated`, lo que le daría a cualquier usuario logueado las claves push (o
la posibilidad de escribir notificaciones) del resto. Si `SUPABASE_SERVICE_ROLE_KEY`
no está configurada: `getSubscriptionsForUsers` cae a leer con el cliente de la
sesión (funciona solo si la política de SELECT resulta permisiva; si no,
`getPushDiagnostics` lo reporta en la UI en vez de fallar en silencio) y
`persistNotifications` simplemente no-opea con un `console.warn` — este fue
justo el bug reportado ("no llegan los push de solicitud de unirse pero la
prueba sí"): la prueba se manda a la propia subscription (legible por RLS con
la sesión propia), pero avisar a otro usuario (el organizador) sí necesita la key.

**Variables de entorno:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (se inlinea en build →
cambiarla exige redeploy), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` y
`SUPABASE_SERVICE_ROLE_KEY`. Si falta la pública, el toggle muestra
"no están configuradas en este servidor" en vez de fallar en silencio. Ver `.env.example`.

**iOS:** solo funciona con la PWA agregada a la pantalla de inicio (standalone);
en una pestaña de Safari `PushManager` no existe (`needsIosInstall()`).

`public/sw.js` es el service worker que recibe el push (`{ title, body, url }`),
muestra la notificación y maneja el click: reutiliza y **navega** (`client.navigate`)
una ventana ya abierta al `url` del payload en vez de solo enfocarla — enfocar sin
navegar es lo que hacía que tocar la notificación abriera el home en una PWA con
una pestaña ya abierta.

## Testing

- `tests/unit/` — Jest, sobre todo lógica pura de `lib/` (orden de canchas, home, definitions/Zod, dal, envío de push).
- `tests/e2e/` — Playwright, flujo de home end-to-end.

## Notas para trabajar con Claude Code en este repo

- `AGENTS.md` (raíz) advierte que esta versión de Next.js puede diferir de lo que Claude "sabe" de entrenamiento — revisar `node_modules/next/dist/docs/` antes de usar APIs de Next que parezcan poco comunes.
- No hay migraciones en el repo (no hay carpeta `supabase/`) — el esquema/RLS/realtime se maneja directamente en el proyecto remoto de Supabase (vía el MCP de Supabase: `apply_migration`, etc.). Si cambia el esquema, `lib/supabase/database.types.ts` se regenera (`generate_typescript_types`, no se edita a mano).
- Antes de agregar una función de lectura nueva, revisar si ya existe algo parecido en `lib/auth/dal.ts` — es el único lugar donde deberían vivir los `select` a Supabase desde el server.
