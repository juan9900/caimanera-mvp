import { isCourtSponsored, sortCourtsForPicker, sortCourtsForCreateMatchPicker } from "@/lib/courts/sort";

const FUTURE = "2099-01-01T00:00:00.000Z";
const PAST = "2020-01-01T00:00:00.000Z";

function makeCourt(overrides: Partial<{
  id: string;
  name: string;
  sponsored_until: string | null;
  sponsor_priority: number;
  is_official: boolean;
}> = {}) {
  return {
    id: "court-1",
    name: "Cancha Z",
    sponsored_until: null,
    sponsor_priority: 0,
    is_official: false,
    ...overrides,
  };
}

describe("isCourtSponsored", () => {
  it("is true only when sponsored_until is set and in the future", () => {
    expect(isCourtSponsored({ sponsored_until: FUTURE })).toBe(true);
    expect(isCourtSponsored({ sponsored_until: PAST })).toBe(false);
    expect(isCourtSponsored({ sponsored_until: null })).toBe(false);
  });
});

describe("sortCourtsForPicker", () => {
  it("puts actively sponsored courts before unsponsored ones", () => {
    const sponsored = makeCourt({ id: "a", name: "Zeta", sponsored_until: FUTURE });
    const unsponsored = makeCourt({ id: "b", name: "Alpha", sponsored_until: null });

    const sorted = sortCourtsForPicker([unsponsored, sponsored]);

    expect(sorted.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("orders multiple sponsored courts by priority, highest first", () => {
    const low = makeCourt({ id: "low", sponsored_until: FUTURE, sponsor_priority: 1 });
    const high = makeCourt({ id: "high", sponsored_until: FUTURE, sponsor_priority: 5 });

    const sorted = sortCourtsForPicker([low, high]);

    expect(sorted.map((c) => c.id)).toEqual(["high", "low"]);
  });

  it("falls back to alphabetical name order within the same tier", () => {
    const b = makeCourt({ id: "b", name: "Beta", sponsored_until: null });
    const a = makeCourt({ id: "a", name: "Alfa", sponsored_until: null });

    const sorted = sortCourtsForPicker([b, a]);

    expect(sorted.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("treats an expired sponsorship as unsponsored", () => {
    const expired = makeCourt({ id: "expired", name: "Zeta", sponsored_until: PAST });
    const plain = makeCourt({ id: "plain", name: "Alfa", sponsored_until: null });

    const sorted = sortCourtsForPicker([expired, plain]);

    expect(sorted.map((c) => c.id)).toEqual(["plain", "expired"]);
  });
});

describe("sortCourtsForCreateMatchPicker", () => {
  it("puts the official court first, even ahead of a sponsored one", () => {
    const sponsored = makeCourt({ id: "sponsored", name: "Alfa", sponsored_until: FUTURE });
    const official = makeCourt({ id: "official", name: "Zeta", is_official: true });

    const sorted = sortCourtsForCreateMatchPicker([sponsored, official]);

    expect(sorted.map((c) => c.id)).toEqual(["official", "sponsored"]);
  });

  it("falls back to sponsorship then name among non-official courts", () => {
    const plain = makeCourt({ id: "plain", name: "Beta" });
    const sponsored = makeCourt({ id: "sponsored", name: "Zeta", sponsored_until: FUTURE });

    const sorted = sortCourtsForCreateMatchPicker([plain, sponsored]);

    expect(sorted.map((c) => c.id)).toEqual(["sponsored", "plain"]);
  });
});
