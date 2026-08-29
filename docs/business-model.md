# Modelo de negocio de Kancha

Este documento es la fuente de verdad del modelo comercial: planes, precios, reglas anti-abuso y el roadmap técnico para construirlo. Reemplaza la sección "Modelo de monetización" de `docs/mvp-spec.md` (que queda solo como referencia histórica del principio original). Ver `architecture.md` para cómo funciona el producto hoy.

## 1. Principio rector

Kancha es un marketplace de dos lados:

- **Los jugadores nunca pagan.** Son el inventario y el motor de datos de la plataforma. Cobrarles ahora mataría el efecto de red que todavía se está construyendo.
- **Los negocios (canchas) pagan** por acceso a esa demanda y por herramientas de operación (visibilidad, reservas, torneos).
- **La app nunca custodia dinero.** Se mantiene el principio no negociable de `docs/mvp-spec.md`: toda transacción real (suscripción del plan, inscripción a un torneo, pago de una reserva) se liquida por fuera de la app, vía Pago Móvil, transferencia o Zelle. Esto es intencional: evita depender de una pasarela de pago que no opera bien en Venezuela y evita responsabilidad legal de custodiar dinero de terceros.

**Etapa actual:** pre-lanzamiento, menos de 100 usuarios, una sola cancha oficial (Cantera, Maracaibo). En esta etapa la prioridad es sumar canchas al nivel Básico (§3) para armar el directorio — el ingreso de los niveles superiores (Agenda, Pro) llega después, cuando hay demanda demostrable (partidos, clics, reservas) que mostrarle al dueño con sus propias métricas.

## 2. Cómo se cobra

Cobro manual, sin pasarela: el dueño de la cancha transfiere por Pago Móvil/Zelle y un admin activa o renueva el plan a mano desde `/admin/canchas`. No hay facturación automática ni recordatorios de cobro automatizados en esta fase — el seguimiento de vencimientos es responsabilidad operativa, no del producto.

## 3. Escalera de planes

| Nivel | Precio | Qué desbloquea | Estado técnico |
|---|---|---|---|
| **0. Pin comunitario** | Gratis, siempre | Cualquier jugador agrega una ubicación al crear un partido: nombre + pin en el mapa. Sin ficha, sin fotos, no aparece en el explorador. Es el radar de demanda: qué pines se repiten en partidos de organizadores distintos indica a qué negocio contactar primero. | Ya existe — `courts.verified = false` |
| **1. Básico** | **US$ 20/mes** (US$ 200/año) | Perfil verificado: ficha completa (fotos, comodidades, horario, WhatsApp, botón "Reservar" con enlace a su propio sistema si lo tiene, rating), aparece en el explorador y en el mapa, carrusel de destacados del home, prioridad en listado y mapa, banner de promoción/cupón activo, métricas completas (impresiones, clics, leads generados, horarios de mayor demanda). | `courts.is_official = true`, `sponsored_until`, `sponsor_priority`, `promo_text/promo_code/promo_expires_at` ya existen; falta el panel de dueño y el gating por plan (ver §9, Fase A) |
| **2. Agenda** | **US$ 45/mes** (US$ 450/año) | Todo lo anterior + reservas dentro de Kancha: disponibilidad por bloques horarios, confirmación, recordatorios push, control de inasistencias, link público de reserva para compartir en Instagram/WhatsApp. | Por construir — Fase B |
| **3. Pro** | **US$ 60/mes** (US$ 600/año) | Todo lo anterior + módulo de torneos: crear, abrir inscripciones, generar fixture, tabla de resultados, presencia en `/torneos`. Incluye **1 torneo activo**. | Por construir — Fase C |

El único nivel gratis dentro de la escalera comercial es el pin comunitario (nivel 0) — cualquier ficha real, aunque sea la más simple, ya es un producto pago desde el nivel 1. Esto cambia el rol del "perfil verificado": ya no es una entrada de compromiso sin ingreso, es la puerta de entrada al negocio — el primer paso de conversión es lograr que una cancha reclame su ficha y pague el Básico, no solo que la reclame.

**Nota técnica:** el nivel Básico usa internamente el valor de enum `visible` en `court_subscriptions.plan` (y sigue siendo el umbral de `plan >= 'visible'` que activa `sponsored_until` en la base de datos) — el antiguo nivel de entrada más barato (enum `basico`, ficha sin destacados) quedó deprecado y fusionado con este. Ver `lib/billing/plans.ts` (`PLANS`, `SELECTABLE_PLAN_ORDER`).

### Lugares públicos: fuera de la escalera comercial, no confundir con "gratis por ahora"

Un lugar como el Parque Ana María Campos no es un negocio y nunca lo va a ser: es una cancha pública, de acceso libre, sin dueño que pueda o deba pagar por ella. Esto es un tercer tipo de dato, distinto de los dos anteriores:

- **Pin comunitario** (nivel 0) — cualquier jugador lo agrega al vuelo, `verified = false`, no tiene ficha ni aparece en el explorador.
- **Sitio público** — `is_public = true` (columna ya existente en `courts`, independiente de `is_official`). Un admin lo cura igual que a cualquier cancha (nombre, ubicación, deportes, horario si aplica), aparece en el explorador y el mapa con la etiqueta "Lugar público" — pero **nunca entra en la escalera de planes**, no tiene sello "Oficial" (`is_official`), no puede comprar destacado, agenda ni torneos, y no hay a quién cobrarle. Es infraestructura de la comunidad, no inventario comercial.
- **Cancha de negocio** (nivel 1 en adelante) — `is_official = true`, tiene dueño identificable, y es la única categoría a la que aplica la escalera de pago de §3.

En la práctica: el sello "Oficial" (y todo lo que compra, desde Básico hasta Pro) es exclusivo de negocios reales con `booking_url`/contacto propio. Un parque público jamás debería mostrar ese sello ni un botón "Reservar" — se le puede marcar `is_public = true` gratis y para siempre, sin que eso implique que "todavía no le cobramos pero algún día sí".

## 4. Ingresos variables (sin suscripción)

Pensados para negocios que no quieren comprometerse a una mensualidad todavía, o que — como el caso de Cantera abajo — no necesitan todo el plan.

- **Pack de leads** — US$ 15 por 100 clics verificados al botón "Reservar"/WhatsApp de su ficha, medibles con `court_events` (ya trackea `whatsapp`, `directions`, `promo_copy`, etc.). Es la puerta de entrada para una cancha que ya tiene su propio sistema de agenda y no necesita el plan Agenda.
- **Torneo suelto** — US$ 15 por torneo publicado (hasta 32 equipos), para canchas que no están en Pro y solo quieren un evento puntual.
- **Torneo adicional en Pro** — US$ 9 por torneo activo extra sobre el que ya incluye el plan.
- **Futuro (Fase D):** patrocinio de marca en el carrusel del home (tiendas deportivas, bebidas isotónicas), y comisión sobre inscripciones a torneos el día que exista una pasarela de pago local viable.

## 5. Canchas que ya tienen su propio sistema de reservas (caso Cantera)

No tiene sentido venderles el plan Agenda — competiría con una herramienta que ya usan y pagan. La oferta para este perfil es:

1. **Básico** (US$ 20) con su `booking_url` apuntando a su sistema propio — el botón "Reservar" ya hace ese deep-link hoy (`components/courts/court-cta.tsx`). Incluye destacados y métricas completas desde este nivel.
2. **Pack de leads** (US$ 15/100 clics) para monetizar tráfico adicional sin tocar su agenda.
3. **Pro** (US$ 60) cuando exista el módulo de torneos — ahí el valor no es la agenda, es que Kancha les opera el torneo (inscripciones, fixture, difusión a la base de jugadores) sin que tengan que montar nada.

El argumento de venta: *"tu sistema de reservas sigue siendo tuyo; nosotros te traemos jugadores y te operamos los torneos."*

## 6. Reglas de la sección de torneos (anti-monopolio)

Problema a resolver: que un negocio con el plan más caro no pueda llenar `/torneos` con sus propios eventos y desplazar a todos los demás. Se resuelve con cuatro capas independientes, no una sola:

1. **Cuota por plan.** Un "torneo activo" es uno publicado con inscripciones abiertas o en curso. Pro incluye 1 activo; cada extra cuesta US$ 9/mes; un torneo suelto fuera de Pro cuesta US$ 15. Publicar 10 torneos simultáneos costaría ≈US$ 141/mes (Pro + 9 extras) — el precio ya es el primer freno.
2. **El orden de la lista nunca depende del plan pagado.** `/torneos` se ordena por relevancia para el jugador: deporte preferido (`users.sport_preferences`) → cercanía a `users.location_lat/lng` → cierre de inscripción más próximo → cupos restantes. El plan compra el **derecho a publicar**, nunca el puesto en la lista.
3. **Regla de diversidad en la superficie.** Máximo 1 torneo del mismo negocio en el bloque destacado del home, y no más de 2 torneos consecutivos del mismo negocio en el listado completo — mismo criterio que ya aplica hoy a las canchas destacadas del carrusel del home.
4. **Calidad mínima + penalización.** Publicar exige formato, deporte, cupo, fechas, costo de inscripción y reglas completas. Un torneo sin inscritos se auto-despublica al vencer el plazo de inscripción. Cancelar un torneo que ya tiene inscritos baja la prioridad del negocio por un período; un admin puede despublicar en cualquier momento.

## 7. Modalidades de torneo a soportar

El formato determina cómo se genera el fixture; el resto del módulo (inscripciones, tabla, resultados, chat) es común a todos:

- Liga / round-robin
- Eliminación simple
- Eliminación doble
- Grupos + playoffs
- Sistema suizo (útil para tenis de mesa, pickleball — muchos jugadores, pocas rondas)
- Americano / rotación de parejas (pádel, tenis de playa)

## 8. Métricas del negocio

**North star (producto):** % de partidos que se llenan completamente — es la métrica que ya define el éxito del MVP en `docs/mvp-spec.md` y no cambia con la monetización.

**Comerciales:**
- Canchas con pin comunitario (nivel 0) que convierten a Básico (nivel 1) — es la conversión clave: pasar de "aparece porque un jugador la agregó" a "el dueño paga por su ficha".
- Conversión Básico → Agenda/Pro (nivel 1 → 2/3).
- MRR y churn por plan.
- Leads entregados por cancha/mes (derivado de `court_events`).
- Reservas confirmadas por cancha/mes (una vez exista Agenda).
- Torneos completados vs. cancelados/despublicados.

**Precio sin validar todavía.** US$ 20/45/60 es una hipótesis, no un dato confirmado. Antes de publicar precios en cualquier material de venta, preguntar directamente a 3–5 dueños de cancha en Maracaibo cuánto gastan hoy en promoción (típicamente Instagram) para ajustar el ancla, y considerar probar tanto la mensualidad fija como un cobro por partido/torneo efectivamente lleno.

## 9. Roadmap técnico

Referencia rápida — el detalle de cada tabla/RLS se decide al implementar, con el MCP de Supabase (`apply_migration`); no hay migraciones versionadas en el repo, el esquema vive en el proyecto remoto y `lib/supabase/database.types.ts` se regenera después de cada cambio.

### Fase A — Monetizar lo que ya existe
Lo que se puede cobrar sin construir nada nuevo de producto, solo la capa de gestión y de gating:
- Tabla `court_managers` (`court_id`, `user_id`, `role`) — hoy no existe ningún rol de "dueño de cancha", solo `users.is_admin`. RLS vía helper `SECURITY DEFINER` `user_manages_court(court_id)`, mismo patrón que `user_is_group_owner`/`user_is_match_organizer`.
- Tabla `court_subscriptions` (`court_id`, `plan`, `status`, `started_at`, `expires_at`, `price_usd`, `payment_note`) — histórico de cobros manuales. `sponsored_until`/`sponsor_priority` en `courts` se siguen derivando de ahí para no romper `getOfficialCourts()` (`lib/auth/dal.ts`).
- `lib/billing/plans.ts` — catálogo de planes y `planAllows(plan, feature)`, lógica pura con tests unitarios (mismo patrón que `lib/courts/sort.ts`). Importante: hoy `is_official = true` ya desbloquea toda la ficha completa sin ningún control de pago (`app/canchas/[id]/page.tsx`) — esta fase tiene que además **gatear** esa UI por `court_subscriptions.status = active` (equivalente al nivel Básico), no solo agregar los niveles pagos de arriba. Las canchas actuales con `is_official = true` (Cantera) se migran a Básico activo sin interrupción. Este gating no toca `is_public`: un sitio público sigue mostrando su ficha mínima (nombre, mapa, "Lugar público") sin pasar por `court_subscriptions` ni por `court_managers` — no tiene dueño que gestione nada.
- Panel de dueño en `/mi-cancha` — reutiliza `getCourtMetrics()` y el form de `app/admin/canchas/[id]/editar/edit-court-form.tsx`, gateado por `court_managers` en vez de `is_admin`, con los campos comerciales (`sponsored_until`, `is_official`) en solo lectura.
- Acción `setCourtPlan` en `app/actions/courts.ts` para que un admin active/renueve un plan a mano desde `/admin/canchas`.

### Fase B — Agenda
- Tablas `court_availability` (bloques por día de la semana) y `bookings` (`court_id`, `user_id`, `starts_at`, `ends_at`, `status`, `match_id` opcional).
- La disponibilidad parte de `opens_at`/`closes_at`/`open_days`, que ya existen en `courts` — reutilizar `lib/courts/hours.ts` en vez de modelar el horario de nuevo.
- Confirmación de reserva dispara `notifyAndPersist` (`lib/push/send.ts`) al dueño y al jugador, con recordatorio antes del horario reservado.
- Un partido puede quedar ligado a una reserva (`matches.booking_id`) para que crear el partido reserve la cancha en el mismo paso.

### Fase C — Torneos
- Tablas `tournaments`, `tournament_teams`, `tournament_registrations`, `tournament_matches`.
- `lib/tournaments/formats.ts` — generación de fixture por modalidad (§7).
- `lib/tournaments/sort.ts` — orden por relevancia + regla de diversidad (§6.2–6.3), con tests unitarios.
- Rutas `/torneos`, `/torneos/[id]`; gestión del organizador bajo `/mi-cancha/torneos`, con la cuota de torneos activos verificada en el Server Action vía `planAllows`.

### Fase D — Expansión
Facturación del pack de leads directamente desde `court_events`, patrocinio de marca en el home, soporte multi-ciudad.
