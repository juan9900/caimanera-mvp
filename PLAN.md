# Kancha — Plan de desarrollo del MVP

Producto: red cerrada por invitación para armar caimaneras (partidos pickup de fútbol/tenis) en Maracaibo. Se entra por invitación de otro usuario, se arman partidos en canchas reales y la gente de tu red confirma cupo.

## Fase 0 — Scaffold (hecho)

- Next.js 16 (App Router) + React 19 + Tailwind v4, PWA básica (manifest, service worker).
- Supabase: cliente browser/server (`lib/supabase/client.ts`, `server.ts`), refresco de sesión vía `proxy.ts` (reemplaza middleware.ts en Next 16).
- Esquema de base de datos (Postgres/Supabase):
  - `users` (perfil: name, phone, photo_url, zone, sport_preferences, vibe, invited_by).
  - `invitations` (code, created_by, used_by/used_at).
  - `courts` (name, lat/lng, schedule, contact_phone, is_official, photos).
  - `matches` (court_id, organizer_id, sport, datetime, vibe, total_slots/slots_filled, status).
  - `match_participants` (match_id, user_id, status, joined_via).
  - Enums: `vibe_type`, `match_status`, `participant_status`, `joined_via_type`.
  - Funciones RPC: `validate_invite_code`, `is_direct_network`.
- DAL de auth (`lib/auth/dal.ts`): `verifySession`, `requireSession`, `getCurrentUserProfile` — boundary de seguridad server-only.
- Tooling: Jest + Testing Library (unit), Playwright (e2e), ESLint. Tests iniciales para el DAL y un smoke test del home.

## Fase 1 — Registro por invitación y perfil (hecho)

Objetivo: alguien con un código de invitación puede entrar, autenticarse y completar su perfil de jugador.

- Auth con email + contraseña vía Supabase (`/signup`, `/login`, logout server action).
- Canje de invitación resuelto en la base de datos: el trigger `handle_new_user` valida el código, crea la fila en `public.users` con `invited_by`, y marca la invitación usada — todo atómico en el signup. Se agregó bootstrap: si `public.users` está vacía, el primer usuario (founder) no necesita código (migración `allow_founder_bootstrap_signup`).
- Onboarding de perfil (`/onboarding`): nombre, zona, deportes preferidos, vibe. Server Action `completeOnboarding` protegida con `requireSession`.
- Redirecciones: sin sesión → `/login`; con sesión sin perfil completo → `/onboarding`; con perfil → home.
- Generación de invitaciones propias (`/invitaciones`): cada usuario ve sus códigos y genera nuevos.
- `SiteHeader` con estado de sesión (login/signup vs. nombre + cerrar sesión) en el layout raíz.
- Validación con Zod (`lib/auth/definitions.ts`) + tests unitarios de los schemas.

Pendiente para más adelante: confirmar en un entorno real que el flujo de signup completa el envío de email de confirmación (no se pudo verificar en vivo en esta sesión por el rate limit del mailer por defecto de un proyecto Supabase recién creado); considerar edición de perfil post-onboarding.

## Fase 2 — Canchas (hecho)

Objetivo: existe un catálogo de canchas reales para poder armar partidos ahí.

- Listado de canchas (`/canchas`, server component, fetch directo a `courts` vía `getCourts` en el DAL).
- Mapa con `react-leaflet` mostrando canchas por lat/lng (`components/courts-map-inner.tsx`), cargado sin SSR desde un wrapper cliente (`components/courts-map.tsx`) porque `leaflet` toca `window` al importarse.
- Detalle de cancha (`/canchas/[id]`): horario, teléfono de contacto, si es oficial.
- Formulario para agregar cancha nueva (`/canchas/nueva`, Server Action `createCourt`, `added_by` = usuario actual). Validación con Zod (`lib/courts/definitions.ts`).
- Ajuste de RLS: la política de `SELECT` sobre `courts` heredada de Fase 0 solo dejaba ver canchas oficiales, propias, o ligadas a un partido — lo que rompía el catálogo compartido (canchas no oficiales de otros eran invisibles hasta que existiera un partido ahí). Se abrió a cualquier usuario autenticado (migración `open_courts_select_to_network`), razonable porque la red ya es cerrada por invitación.
- Fotos de cancha (`photos`) quedan pendientes — no había forma de subir archivos aún en el DAL/UI.

Pendiente para más adelante: no se pudo verificar el flujo completo en vivo (signup → agregar cancha) en esta sesión por el mismo rate limit del mailer de Supabase mencionado en Fase 1. Se verificó con `next build`, typecheck, lint, tests unitarios, y un chequeo e2e de que las rutas protegidas redirigen a `/login` sin sesión.

## Fase 3 — Partidos (hecho)

Objetivo: organizar y unirse a caimaneras.

- Crear partido (`/partidos/nuevo`): elegir cancha, deporte, fecha/hora, vibe, cupos totales (`organizer_id` = usuario actual). Server Action `createMatch` protegida con `requireSession`, validación con Zod (`lib/matches/definitions.ts`).
- Listado de partidos abiertos (`/partidos`), ordenado por fecha, con cancha y organizador.
- Unirse a un partido (`joinMatch`): el server action resuelve con la RPC `is_direct_network` si el cupo entra directo (`confirmado`/`red_directa`) o queda pendiente de aprobación (`pendiente`/`externo`) — la política RLS de `INSERT` en `match_participants` exige que la combinación coincida. `slots_filled` y el cierre automático a `completo` los recalcula un trigger (`recalc_match_slots`), ya existente desde la Fase 0; no hace falta tocarlo desde la app.
- Vista de detalle del partido (`/partidos/[id]`): cupos, confirmados, solicitudes pendientes (si sos el organizador, con aprobar/rechazar), estado (`abierto`/`completo`/`cancelado`).
- Organizador puede cancelar el partido o quitar un participante; cualquier participante puede salirse o cancelar su solicitud.
- Todo el modelado (tablas, enums, RLS, RPC `is_direct_network`, trigger `recalc_match_slots`) ya estaba en la migración `initial_schema` de la Fase 0 — esta fase fue enteramente de capa de aplicación (DAL, Server Actions, UI).

Pendiente para más adelante: mismo problema de rate limit del mailer de Supabase para probar el flujo en vivo con dos usuarios reales (organizador + invitado externo). Se verificó con `next build`, typecheck, lint, tests unitarios, y que las rutas protegidas redirigen a `/login` sin sesión.

## Fase 4 — Red e invitaciones sociales (hecho)

Objetivo: la red de invitados influye en quién ve y prioriza qué partidos.

- Badge de "Red directa" / "Externo" (`joined_via_type`) junto a cada participante confirmado o pendiente en el detalle del partido.
- Vista "mi red" (`/red`): quién te invitó y a quién invitaste, resuelto por `invited_by` sobre `public.users` — la política de `SELECT` ya era abierta a cualquier usuario autenticado (Fase 2), así que no hizo falta tocar RLS. DAL: `getMyInvitees`, `getMyInviter`.
- Botón "Compartir" en el detalle del partido (`components/share-match-button.tsx`, client component): usa `navigator.share` si está disponible y si no cae a un link de `wa.me` con el texto armado en el cliente (necesita `window.location`, por eso no puede ser server component).

Pendiente para más adelante: mismo problema de rate limit del mailer de Supabase para probar en vivo con dos usuarios reales compartiendo/uniéndose por WhatsApp. Se verificó con `next build`, typecheck, lint y tests unitarios.

## Fase 5 — Pulido y lanzamiento

Objetivo: MVP usable en producción para el primer grupo real de usuarios.

- Responsive/mobile-first pass, estados de carga y error, vacíos (empty states).
- Notificaciones básicas (recordatorio de partido, cupo confirmado) — WhatsApp deep link o email.
- Deploy (Vercel) + variables de entorno de producción en Supabase.
- Suite de tests e2e cubriendo: invitación → onboarding → crear partido → unirse.
