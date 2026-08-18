import { haversineKm, formatDistance } from "@/lib/geo/distance";
import {
  filterMatches,
  selectFeaturedCourts,
  slotsNeeded,
  sortByUrgency,
  type HomeCourt,
  type HomeMatch,
} from "@/lib/matches/home";

function makeCourt(overrides: Partial<HomeCourt> = {}): HomeCourt {
  return {
    id: "court-1",
    name: "Cancha Ancla",
    lat: 10.65,
    lng: -71.64,
    is_official: true,
    photos: null,
    logo_url: null,
    amenities: [],
    promo_text: null,
    promo_code: null,
    promo_expires_at: null,
    sponsored_until: null,
    sponsor_priority: 0,
    ...overrides,
  };
}

function makeMatch(overrides: Partial<HomeMatch>): HomeMatch {
  return {
    id: "match-1",
    court_id: "court-1",
    organizer_id: "user-1",
    sport: "futbol",
    datetime: "2026-08-17T22:00:00.000Z",
    total_slots: 10,
    slots_filled: 8,
    status: "abierto",
    is_public: true,
    vibe: "relajado",
    payment_amount_bs: null,
    payment_bank: null,
    payment_cedula: null,
    payment_phone: null,
    reopened_at: null,
    created_at: "2026-08-01T00:00:00.000Z",
    court: makeCourt(),
    organizer: { name: "Juan" },
    ...overrides,
  };
}

describe("haversineKm / formatDistance", () => {
  it("returns 0 for identical points", () => {
    expect(haversineKm({ lat: 10.65, lng: -71.64 }, { lat: 10.65, lng: -71.64 })).toBeCloseTo(0);
  });

  it("returns a plausible distance between two Maracaibo-area points", () => {
    const km = haversineKm({ lat: 10.65, lng: -71.64 }, { lat: 10.70, lng: -71.60 });
    expect(km).toBeGreaterThan(5);
    expect(km).toBeLessThan(10);
  });

  it("formats sub-km distances in meters and longer ones in km", () => {
    expect(formatDistance(0.8)).toBe("800 m");
    expect(formatDistance(3.2)).toBe("~3.2 km");
  });
});

describe("slotsNeeded", () => {
  it("computes remaining slots", () => {
    expect(slotsNeeded({ total_slots: 10, slots_filled: 8 })).toBe(2);
  });

  it("never goes negative", () => {
    expect(slotsNeeded({ total_slots: 5, slots_filled: 7 })).toBe(0);
  });
});

describe("sortByUrgency", () => {
  it("sorts by fewest open slots first, then soonest", () => {
    const urgent = makeMatch({ id: "a", total_slots: 10, slots_filled: 9, datetime: "2026-08-18T12:00:00.000Z" });
    const soon = makeMatch({ id: "b", total_slots: 10, slots_filled: 8, datetime: "2026-08-17T20:00:00.000Z" });
    const later = makeMatch({ id: "c", total_slots: 10, slots_filled: 8, datetime: "2026-08-18T20:00:00.000Z" });

    const sorted = sortByUrgency([later, urgent, soon]);

    expect(sorted.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });
});

describe("filterMatches", () => {
  const matches = [
    makeMatch({ id: "futbol-hoy", sport: "futbol", datetime: new Date().toISOString() }),
    makeMatch({ id: "otro-later", sport: "otro", datetime: "2099-01-01T00:00:00.000Z" }),
  ];

  it("filters by sport chips", () => {
    const result = filterMatches(matches, { sports: ["otro"], today: false, search: "" });
    expect(result.map((m) => m.id)).toEqual(["otro-later"]);
  });

  it("filters by today", () => {
    const result = filterMatches(matches, { sports: [], today: true, search: "" });
    expect(result.map((m) => m.id)).toEqual(["futbol-hoy"]);
  });

  it("filters by court name search, case-insensitive", () => {
    const result = filterMatches(matches, { sports: [], today: false, search: "ancla" });
    expect(result).toHaveLength(2);

    const noMatch = filterMatches(matches, { sports: [], today: false, search: "cancha inexistente" });
    expect(noMatch).toHaveLength(0);
  });
});

describe("selectFeaturedCourts", () => {
  it("counts open matches per official court", () => {
    const courts: HomeCourt[] = [
      makeCourt({ id: "court-1", name: "Cancha Ancla" }),
      makeCourt({ id: "court-2", name: "Cancha Sin Partidos", lat: 10.6, lng: -71.6 }),
    ];
    const matches = [
      makeMatch({ id: "m1", court_id: "court-1" }),
      makeMatch({ id: "m2", court_id: "court-1" }),
    ];

    const featured = selectFeaturedCourts(courts, matches);

    expect(featured).toEqual([
      { court: courts[0], openMatchCount: 2 },
      { court: courts[1], openMatchCount: 0 },
    ]);
  });
});
