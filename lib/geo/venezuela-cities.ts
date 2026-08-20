export type VenezuelaCity = { name: string; state: string; lat: number; lng: number };

/**
 * Curated list of Venezuelan cities/towns (state capitals plus other well
 * known cities) with coordinates. The app is Venezuela-scoped, and Nominatim
 * free-text geocoding was unreliable for smaller towns (e.g. "Lechería"
 * wouldn't surface a usable city-level result) — searching this static list
 * client-side is instant and always returns a real city.
 */
export const VENEZUELA_CITIES: VenezuelaCity[] = [
  { name: "Caracas", state: "Distrito Capital", lat: 10.4806, lng: -66.9036 },
  { name: "Maracaibo", state: "Zulia", lat: 10.6316, lng: -71.6444 },
  { name: "Valencia", state: "Carabobo", lat: 10.1621, lng: -68.0077 },
  { name: "Barquisimeto", state: "Lara", lat: 10.0678, lng: -69.3467 },
  { name: "Maracay", state: "Aragua", lat: 10.2469, lng: -67.5959 },
  { name: "Ciudad Guayana", state: "Bolívar", lat: 8.3533, lng: -62.6528 },
  { name: "Puerto Ordaz", state: "Bolívar", lat: 8.2959, lng: -62.7671 },
  { name: "San Cristóbal", state: "Táchira", lat: 7.7669, lng: -72.225 },
  { name: "Maturín", state: "Monagas", lat: 9.745, lng: -63.1783 },
  { name: "Barcelona", state: "Anzoátegui", lat: 10.1333, lng: -64.6833 },
  { name: "Puerto La Cruz", state: "Anzoátegui", lat: 10.2167, lng: -64.6167 },
  { name: "Lechería", state: "Anzoátegui", lat: 10.1953, lng: -64.6961 },
  { name: "Los Teques", state: "Miranda", lat: 10.3406, lng: -67.0417 },
  { name: "Mérida", state: "Mérida", lat: 8.592, lng: -71.1652 },
  { name: "Ejido", state: "Mérida", lat: 8.5514, lng: -71.2517 },
  { name: "El Vigía", state: "Mérida", lat: 8.6236, lng: -71.6544 },
  { name: "Cumaná", state: "Sucre", lat: 10.4606, lng: -64.1786 },
  { name: "Carúpano", state: "Sucre", lat: 10.6664, lng: -63.25 },
  { name: "Güiria", state: "Sucre", lat: 10.5744, lng: -62.3086 },
  { name: "Coro", state: "Falcón", lat: 11.4045, lng: -69.68 },
  { name: "Punto Fijo", state: "Falcón", lat: 11.6828, lng: -70.2075 },
  { name: "San Fernando de Apure", state: "Apure", lat: 7.8891, lng: -67.475 },
  { name: "Guanare", state: "Portuguesa", lat: 9.0417, lng: -69.75 },
  { name: "Acarigua", state: "Portuguesa", lat: 9.5597, lng: -69.2011 },
  { name: "Araure", state: "Portuguesa", lat: 9.5667, lng: -69.2167 },
  { name: "Barinas", state: "Barinas", lat: 8.6226, lng: -70.2075 },
  { name: "Trujillo", state: "Trujillo", lat: 9.3667, lng: -70.4333 },
  { name: "Valera", state: "Trujillo", lat: 9.3178, lng: -70.6094 },
  { name: "Boconó", state: "Trujillo", lat: 9.2694, lng: -70.2547 },
  { name: "San Juan de los Morros", state: "Guárico", lat: 9.9111, lng: -67.3361 },
  { name: "Tucupita", state: "Delta Amacuro", lat: 9.0669, lng: -62.0464 },
  { name: "La Asunción", state: "Nueva Esparta", lat: 11.0333, lng: -63.8631 },
  { name: "Porlamar", state: "Nueva Esparta", lat: 10.95, lng: -63.85 },
  { name: "San Carlos", state: "Cojedes", lat: 9.6614, lng: -68.5811 },
  { name: "El Tigre", state: "Anzoátegui", lat: 8.8869, lng: -64.25 },
  { name: "Anaco", state: "Anzoátegui", lat: 9.4372, lng: -64.4692 },
  { name: "Ciudad Bolívar", state: "Bolívar", lat: 8.1222, lng: -63.5497 },
  { name: "Upata", state: "Bolívar", lat: 8.0158, lng: -62.4028 },
  { name: "Guarenas", state: "Miranda", lat: 10.4736, lng: -66.6142 },
  { name: "Guatire", state: "Miranda", lat: 10.4739, lng: -66.5417 },
  { name: "Charallave", state: "Miranda", lat: 10.2464, lng: -66.8531 },
  { name: "Ocumare del Tuy", state: "Miranda", lat: 10.1147, lng: -66.7822 },
  { name: "Higuerote", state: "Miranda", lat: 10.4833, lng: -66.1 },
  { name: "Río Chico", state: "Miranda", lat: 10.3311, lng: -65.9756 },
  { name: "Cagua", state: "Aragua", lat: 10.1908, lng: -67.4472 },
  { name: "Turmero", state: "Aragua", lat: 10.2261, lng: -67.4761 },
  { name: "La Victoria", state: "Aragua", lat: 10.2314, lng: -67.3444 },
  { name: "Palo Negro", state: "Aragua", lat: 10.1794, lng: -67.575 },
  { name: "El Limón", state: "Aragua", lat: 10.29, lng: -67.64 },
  { name: "San Felipe", state: "Yaracuy", lat: 10.3389, lng: -68.7439 },
  { name: "Chivacoa", state: "Yaracuy", lat: 10.1017, lng: -68.9214 },
  { name: "Carora", state: "Lara", lat: 10.1731, lng: -70.0778 },
  { name: "Rubio", state: "Táchira", lat: 7.7061, lng: -72.3436 },
  { name: "La Grita", state: "Táchira", lat: 8.1358, lng: -71.9922 },
  { name: "San Antonio del Táchira", state: "Táchira", lat: 7.8386, lng: -72.4433 },
  { name: "Machiques", state: "Zulia", lat: 10.0644, lng: -72.5578 },
  { name: "Cabimas", state: "Zulia", lat: 10.3919, lng: -71.4514 },
  { name: "Ciudad Ojeda", state: "Zulia", lat: 10.2036, lng: -71.305 },
  { name: "Santa Bárbara del Zulia", state: "Zulia", lat: 8.9558, lng: -71.9506 },
];

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Instant client-side search over `VENEZUELA_CITIES` — startsWith matches rank above includes matches. */
export function searchVenezuelaCities(query: string, limit = 6): VenezuelaCity[] {
  const q = normalize(query);
  if (!q) return [];

  return VENEZUELA_CITIES.map((city) => {
    const name = normalize(city.name);
    const state = normalize(city.state);
    let score = -1;
    if (name.startsWith(q)) score = 3;
    else if (name.includes(q)) score = 2;
    else if (state.startsWith(q) || state.includes(q)) score = 1;
    return { city, score };
  })
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || a.city.name.localeCompare(b.city.name))
    .slice(0, limit)
    .map((entry) => entry.city);
}
