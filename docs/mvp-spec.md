# MVP: App para conseguir jugadores cerca (futbol/tenis) — Maracaibo

## Contexto y problema

Grupos de amigos que juegan futbol/tenis regularmente en Maracaibo coordinan partidos por WhatsApp. Cuando falta gente (~1 vez por semana falta 1-2 jugadores), el organizador tiene que escribirle uno por uno a contactos para ver quién puede llegar — proceso lento, incierto ("ruleta"), y a veces el partido se juega incompleto (ej. 4v4 en vez de 5v5).

**Lo que esta app NO hace:** no reemplaza el grupo de WhatsApp existente. La gente sigue preguntando ahí primero, como siempre. La app entra en juego solo cuando ese círculo cercano no pudo completar el cupo, conectando con jugadores de otros círculos que juegan en la misma zona/cancha.

## Principios de diseño (no negociables para el MVP)

1. **Cero manejo de dinero dentro de la app.** No hay pagos, no hay reservas pagadas, no hay wallet. Los pagos de cancha se siguen haciendo como siempre (efectivo, Pago Móvil) por fuera de la app. Esto es intencional: evita fricción de pasarelas de pago (PayPal/Stripe no operan bien en Venezuela) y evita responsabilidad legal de custodiar dinero.
2. **Registro solo por invitación.** No hay "crear cuenta libremente" desde una landing pública. Todo usuario nuevo entra con un link de invitación generado por alguien que ya está en la app. Esto crea una cadena de confianza social rastreable ("invitado por X").
3. **El organizador del partido tiene la última palabra.** Cuando alguien externo (fuera del círculo directo) pide unirse a un partido, el organizador aprueba o rechaza. Nunca es automático.
4. **Canchas "oficiales" vs. "agregadas por jugador" son visualmente distintas y funcionalmente distintas.** Una cancha agregada por un jugador es solo un pin con nombre y ubicación — sin ficha, sin fotos, sin aparecer en un buscador/directorio, y solo visible dentro del partido específico al que quedó ligada. Una cancha oficial tiene ficha completa (fotos, horarios, contacto) y aparece en el explorador/buscador de canchas. Esta distinción es la base del futuro modelo de monetización B2B (cobrarle a canchas por presencia destacada) — no confundir los dos tipos de dato en el modelo.
5. **Nunca se expone ubicación privada de un usuario**, solo la ubicación pública de la cancha/lugar de encuentro.

## Alcance del MVP (qué SÍ construir)

### Roles

- **Jugador**: puede crear partidos, unirse a partidos, invitar gente, agregar canchas.
- No hay rol de "admin de cancha" todavía — eso es fase 2 (canchas oficiales/monetización).

### Funcionalidades core

1. **Autenticación**
   - Login por número de teléfono (OTP vía SMS/WhatsApp) — más confiable que email en Venezuela y sirve como capa básica de verificación anti-perfiles falsos.
   - Registro únicamente vía link/código de invitación de otro usuario. Guardar `invited_by` en el perfil.

2. **Perfil de usuario**
   - Nombre, foto (opcional), deporte(s) que juega, zona/municipio donde suele jugar.
   - Campo de "vibra": `relajado` o `competitivo` (autoseleccionado, no calculado).
   - Ver quién lo invitó y a quién ha invitado (cadena de confianza visible).

3. **Canchas**
   - Cualquier jugador puede agregar una cancha nueva al crear un partido: nombre libre + ubicación (mapa/GPS).
   - Campo booleano `is_official` (default `false`). Sin UI para que un usuario se auto-declare oficial — eso lo activas tú manualmente desde Supabase por ahora, no hace falta panel de admin en el MVP.
   - Cancha con `is_official = true` tiene campos extra: fotos (array de URLs), horario, teléfono de contacto. Estos campos existen en el esquema desde ya, aunque el MVP no tenga UI para llenarlos (los llenas tú a mano en la base de datos cuando conviertas una cancha).

4. **Partidos**
   - Crear partido: deporte, cancha (elegir existente o agregar nueva), fecha/hora, cupos totales, cupos faltantes, vibra.
   - Estado del partido: `abierto`, `completo`, `cancelado`.
   - Lista de partidos cercanos: filtro por deporte y por "hoy/esta semana". Ordenar por proximidad y por urgencia (menos cupos faltantes primero).
   - Unirse a un partido:
     - Si el usuario es de la red directa del organizador (fue invitado por él o comparten un invitador en común) → se une directo, cupo baja automáticamente.
     - Si es externo a esa red directa → queda en estado `pendiente` y el organizador debe aprobar desde una notificación/pantalla simple.
   - Cuando el cupo llega a 0 → partido pasa a `completo` automáticamente y deja de aparecer en la lista de "necesita gente".

5. **Notificaciones push**
   - Al organizador: cuando alguien pide unirse (para aprobar).
   - A jugadores relevantes (misma zona/deporte, conexión de 1-2 grados): cuando se crea o queda abierto un partido cerca con cupos disponibles.
   - Confirmación cuando el partido se completa.

6. **Invitaciones**
   - Generar link de invitación (deep link) desde el perfil, para compartir por WhatsApp.
   - El link, al abrirse sin la app instalada, lleva a una landing simple de descarga que preserva el código de invitación.

### Fuera de alcance del MVP (explícitamente NO construir todavía)

- Pagos o repartición de costos entre jugadores.
- Chat interno (se sigue usando WhatsApp).
- Sistema de rating/reputación numérica de jugadores (la "buena onda post-partido" es fase 2).
- Panel de administración para canchas oficiales.
- Búsqueda/directorio público de canchas oficiales.
- Soporte multi-ciudad (todo hardcodeado/asumido para Maracaibo por ahora, sin lógica de expansión geográfica compleja).

## Stack técnico

**Decisión clave: el MVP es una web app (idealmente PWA), no una app nativa.** El lanzamiento oficial en tiendas (React Native / Expo) se evalúa después, una vez validada la demanda con el grupo cerrado. Esto evita desde ya el tema de cuentas de developer de Apple/Google desde Venezuela, tiempos de revisión de tienda, y fricción de instalación para el grupo de prueba (un link que abren en el navegador basta).

- **Frontend**: Next.js (App Router) o Vite + React — cualquiera de los dos sirve para un MVP de este tamaño. Next.js facilita un poco más si luego quieres SEO/landing pública para captar canchas; Vite es más liviano si eso no importa todavía. Configurar como PWA (manifest + service worker) para que se pueda "agregar a inicio" en el celular y se sienta como app, con soporte de notificaciones push web.
- **Backend/DB**: Supabase
  - Auth: Supabase Auth con OTP por teléfono.
  - Base de datos: Postgres vía Supabase, con Row Level Security activado desde el inicio (importante: los datos de partidos/canchas no deben ser editables por cualquiera, solo por su creador u organizador).
  - Realtime: usar Supabase Realtime para que el contador de cupos se actualice en vivo en la lista de partidos sin necesidad de refrescar.
  - Storage: Supabase Storage para fotos de perfil y (fase 2) fotos de canchas oficiales.
- **Notificaciones push**: Web Push (API nativa del navegador vía service worker) disparadas por triggers/webhooks de Supabase cuando cambian filas relevantes (nuevo partido, solicitud de unión, cupo lleno). Nota: en iOS, el "agregar a inicio" + push web requiere iOS 16.4+ y que el usuario efectivamente instale la PWA a la pantalla de inicio — comunicar ese paso claramente en el onboarding del grupo de prueba.
- **Distribución**: compartir directo por link (WhatsApp) al grupo cerrado de invitados. Sin publicación en tienda en esta fase.
- **Migración futura a nativo**: al mantener toda la lógica en Supabase (auth, datos, realtime, RLS) desacoplada del frontend, el día que se justifique una app React Native, se reutiliza el mismo backend sin reescribir nada del lado de datos — solo se construye la capa de UI nativa y se resuelve ahí el tema de cuentas de developer.

## Modelo de datos (borrador inicial)

```
users
  id, phone, name, photo_url, sport_preferences[], zone, vibe (relajado|competitivo),
  invited_by (fk -> users.id), created_at

courts
  id, name, location (lat/lng), added_by (fk -> users.id), is_official (bool, default false),
  photos[] (nullable, solo si is_official), schedule (nullable), contact_phone (nullable),
  created_at

matches
  id, sport, court_id (fk -> courts.id), organizer_id (fk -> users.id),
  datetime, total_slots, slots_filled, vibe, status (abierto|completo|cancelado),
  created_at

match_participants
  id, match_id (fk -> matches.id), user_id (fk -> users.id),
  status (confirmado|pendiente|rechazado), joined_via (red_directa|externo),
  created_at

invitations
  id, code, created_by (fk -> users.id), used_by (fk -> users.id, nullable),
  created_at, used_at
```

## Criterio de éxito del MVP

No mires número de descargas. Mide:

1. **% de partidos que se llenan completamente** (vs. quedar incompletos como pasa hoy sin la app).
2. **Cuántos partidos consecutivos** organiza el mismo usuario sin necesidad de recordárselo — indica retención orgánica real.
3. **Cuántas canchas "agregadas por jugador" se repiten en múltiples partidos de distintos organizadores** — esa es la señal para saber a qué canchas contactar primero para el modelo de monetización B2B (fase 2, fuera de este MVP).

## Modelo de monetización

El modelo de negocio completo (planes, precios, reglas de torneos, roadmap técnico) vive en `docs/business-model.md` — este párrafo original (marketplace de dos lados, jugadores gratis siempre) sigue siendo el principio rector, pero el detalle y los precios ya están definidos ahí, no aquí.

## Estructura del home (referencia — el detalle de implementación vive en el archivo separado `home-ui-spec.md`)

El home sigue una lógica de prioridad: primero resolver el problema del usuario (utilidad), después mostrar inventario de negocio (monetización). Order fijo:

1. Buscador + ubicación.
2. Carrusel de banners de canchas destacadas (nivel 3 de monetización) — funciona aunque al inicio solo tenga la cancha ancla.
3. Categorías rápidas (deporte, cuándo, cercanía).
4. Sección "Sesiones públicas" — partidos abiertos ordenados por urgencia (menos cupos primero). Esta sección va antes que las canchas destacadas a propósito: la utilidad viene primero para ganar confianza, la monetización después.
5. Sección "Canchas destacadas cerca" — solo canchas con `is_official = true`.
6. Botón fijo de "Crear partido", siempre visible.

## Plan de rollout sugerido

1. Lanzar solo con el círculo de invitación de los 2 amigos fundadores y sus grupos de WhatsApp de futbol en Maracaibo.
2. Una cancha "ancla" acordada de antemano (contactar al dueño para que esté cómodo con el flujo, aunque en el MVP no tenga ficha oficial todavía).
3. No abrir registro público. Crecimiento solo vía invitación directa durante esta fase de validación.
