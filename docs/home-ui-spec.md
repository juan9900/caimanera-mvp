# UI Spec: Home

Este documento describe la pantalla principal (home) de la web app. Es el punto de entrada más importante de la aplicación — referirse también a `mvp-spec.md` para el contexto de producto, modelo de datos y lógica de negocio completa.

## Objetivo de la pantalla

Resolver dos cosas en orden de prioridad:
1. Ayudar al usuario a encontrar rápido un partido que necesita gente cerca de él (prioridad #1, siempre).
2. Dar visibilidad a canchas destacadas/oficiales (prioridad #2 — es donde vive la monetización futura, pero nunca debe sentirse invasivo ni ocupar el primer scroll).

## Referencia de estilo

Inspiración de layout: apps tipo delivery (ej. Yummy) — buscador arriba, banner promocional, categorías de acceso rápido, listas priorizadas debajo. Adaptar esa estructura al dominio de "partidos deportivos", no copiar literalmente.

## Estructura, de arriba hacia abajo

### 1. Header: ubicación + buscador
- Texto pequeño de ubicación actual, ej. "Maracaibo, cerca de ti" (por ahora la ciudad está hardcodeada a Maracaibo, sin selector — eso es fase futura).
- Campo de búsqueda debajo, placeholder "Buscar cancha o zona". Al escribir, filtra tanto partidos abiertos como canchas por nombre/zona. No requiere pantalla separada de resultados en el MVP — puede filtrar la misma lista en scroll hacia abajo.

### 2. Carrusel de banners (canchas destacadas)
- Componente de carrusel horizontal, reutilizable, aunque al inicio solo tenga 1 slide (la cancha ancla).
- Cada slide muestra: nombre de la cancha, un dato dinámico y relevante (ej. "3 partidos abiertos ahora mismo" — contar partidos con status `abierto` para esa cancha), y esta ligado a `courts` donde `is_official = true`.
- Tap en el banner lleva al detalle de esa cancha (lista de sus partidos abiertos). Si el detalle de cancha no existe aún como pantalla, por ahora puede llevar a la lista general filtrada por esa cancha.
- Este componente debe construirse pensando en que en el futuro habrá múltiples canchas pagando por aparecer aquí — dejar la lógica de "qué banners mostrar y en qué orden" en una función separada y fácil de modificar (por ahora: mostrar todas las `is_official = true`, sin necesidad aún de lógica de pago/rotación).

### 3. Categorías rápidas (chips de filtro de un toque)
- Fila horizontal de 4 chips: Futbol, Tenis, Hoy, Cerca de mí.
- Comportamiento: son toggles que filtran la sección "Te necesitan ya" de abajo. Múltiples chips pueden estar activos a la vez (ej. Futbol + Hoy). No navegan a otra pantalla, filtran in-place.
- Chip activo se distingue visualmente del inactivo (fondo solido vs. borde).

### 4. Sección "Te necesitan ya"
- Título de sección fijo: "Te necesitan ya".
- Lista vertical de partidos con status `abierto`, ordenados por:
  1. Menor cantidad de cupos faltantes primero (mayor urgencia).
  2. Como desempate, el más próximo en el tiempo primero.
- Cada card de partido muestra: nombre de la cancha, fecha/hora relativa (ej. "Hoy, 6:00 pm"), deporte, y un badge de urgencia ("Falta 1" / "Faltan 2", etc.) con color de advertencia.
- Tap en la card lleva a la pantalla de detalle/unirse al partido (fuera de alcance de este doc — ver spec general).
- Si no hay partidos abiertos cerca: mostrar un estado vacío invitando a crear uno, no una lista vacía sin contexto. Copy sugerido: encabezado tipo "Ningun partido necesita gente ahorita" + botón "Crear partido".

### 5. Sección "Canchas destacadas cerca"
- Título de sección: "Canchas destacadas cerca".
- Lista horizontal (scroll lateral) de cards de canchas con `is_official = true`: imagen/logo, nombre, distancia aproximada.
- Si hay menos de 3 canchas oficiales (que será el caso por mucho tiempo al inicio), agregar al final del scroll horizontal una card visual distinta (borde punteado, sin foto) con texto tipo "Mas canchas destacadas pronto" — para que la sección no se sienta vacía o rota con solo 1 elemento.
- Esta sección puede ocultarse por completo si `is_official` count es 0, pero con la cancha ancla precargada esto no debería pasar en el MVP.

### 6. CTA fijo: Crear partido
- Botón de ancho completo, fijo en la parte inferior de la pantalla (sticky/fixed dentro del viewport de la app, no del documento completo si hay scroll largo).
- Siempre visible sin importar cuánto se haga scroll en las secciones de arriba.
- Lleva a la pantalla de creación de partido (ver spec general del MVP).

## Datos que esta pantalla necesita del backend (Supabase)

- Lista de `matches` con status `abierto`, join con `courts` para nombre/ubicación, filtrable por deporte y ordenable por `slots_filled`/`total_slots` y `datetime`.
- Lista de `courts` donde `is_official = true`.
- Conteo de partidos abiertos por cancha oficial (para el dato dinámico del banner).
- Usar Supabase Realtime en la lista de "Te necesitan ya" para que el badge de cupos se actualice en vivo sin refrescar la pantalla (alguien más se puede unir a un partido mientras el usuario tiene el home abierto).

## Fuera de alcance de esta pantalla

- Selector de ciudad (hardcodear Maracaibo).
- Resultados de búsqueda en pantalla separada (filtrar in-place es suficiente para el MVP).
- Cualquier lógica de pago, rotación pagada de banners, o priorización comercial de resultados — el orden de banners y canchas destacadas es simple (todas las oficiales, sin ranking pago) hasta que exista ese modelo.
