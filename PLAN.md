# Caimanera — Plan de desarrollo del MVP

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

## Fase 2 — Canchas

Objetivo: existe un catálogo de canchas reales para poder armar partidos ahí.

- Listado de canchas (server component, fetch directo a `courts`).
- Mapa con `react-leaflet` mostrando canchas por lat/lng.
- Detalle de cancha (horario, teléfono de contacto, fotos, si es oficial).
- Formulario para agregar cancha nueva (`added_by` = usuario actual).

## Fase 3 — Partidos

Objetivo: organizar y unirse a caimaneras.

- Crear partido: elegir cancha, deporte, fecha/hora, vibe, cupos totales (`organizer_id` = usuario actual).
- Listado de partidos abiertos (filtrado por red directa vs. externos usando `is_direct_network`).
- Unirse a un partido → inserta en `match_participants`, actualiza `slots_filled`.
- Vista de detalle del partido: cupos, lista de confirmados, estado (`abierto`/`completo`/`cancelado`).
- Cancelar partido / salir de un partido.
- Cierre automático a `completo` cuando `slots_filled = total_slots`.

## Fase 4 — Red e invitaciones sociales

Objetivo: la red de invitados influye en quién ve y prioriza qué partidos.

- Distinguir en la UI cupos de red directa vs. externos (`joined_via_type`).
- Vista de "mi red": quién invité, quién me invitó.
- Compartir partido por link/WhatsApp para llenar cupos externos cuando la red directa no alcanza.

## Fase 5 — Pulido y lanzamiento

Objetivo: MVP usable en producción para el primer grupo real de usuarios.

- Responsive/mobile-first pass, estados de carga y error, vacíos (empty states).
- Notificaciones básicas (recordatorio de partido, cupo confirmado) — WhatsApp deep link o email.
- Deploy (Vercel) + variables de entorno de producción en Supabase.
- Suite de tests e2e cubriendo: invitación → onboarding → crear partido → unirse.
