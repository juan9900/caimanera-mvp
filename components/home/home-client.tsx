"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { haversineKm, formatDistance, type LatLng } from "@/lib/geo/distance";
import {
  filterMatches,
  selectFeaturedCourts,
  sortByUrgency,
  type HomeCourt,
  type HomeMatch,
} from "@/lib/matches/home";
import { QuickFilters, type QuickFilterState } from "@/components/home/quick-filters";
import { FeaturedCourtsCarousel } from "@/components/home/featured-courts-carousel";
import { NeededMatches } from "@/components/home/needed-matches";
import { CourtSponsorBanner } from "@/components/home/court-sponsor-banner";

const REALTIME_REFRESH_DEBOUNCE_MS = 800;

/** Orchestrates the home screen: search, quick filters, geolocation, and live match updates. */
export function HomeClient({
  matches,
  officialCourts,
}: {
  matches: HomeMatch[];
  officialCourts: HomeCourt[];
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<QuickFilterState>({
    sports: [],
    today: false,
    nearMe: false,
  });
  const [position, setPosition] = useState<LatLng | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);

  // Realtime: keep slot counts fresh without a manual refresh.
  useEffect(() => {
    const supabase = createClient();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const channel = supabase
      .channel("home-open-matches")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => router.refresh(), REALTIME_REFRESH_DEBOUNCE_MS);
      })
      .subscribe();

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [router]);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setGeoDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({ lat: result.coords.latitude, lng: result.coords.longitude });
        setGeoDenied(false);
      },
      () => {
        setGeoDenied(true);
        setFilters((f) => ({ ...f, nearMe: false }));
      },
    );
  }

  function handleFiltersChange(next: QuickFilterState) {
    if (next.nearMe && !position && !geoDenied) requestLocation();
    setFilters(next);
  }

  const distanceByCourtId = useMemo(() => {
    if (!position) return undefined;
    const map = new Map<string, string>();
    const allCourts = [
      ...officialCourts,
      ...matches.map((m) => m.court).filter((c): c is HomeCourt => c !== null),
    ];
    for (const court of allCourts) {
      if (map.has(court.id)) continue;
      map.set(court.id, formatDistance(haversineKm(position, { lat: court.lat, lng: court.lng })));
    }
    return map;
  }, [position, officialCourts, matches]);

  const featuredCourts = useMemo(
    () => selectFeaturedCourts(officialCourts, matches),
    [officialCourts, matches],
  );

  const visibleMatches = useMemo(() => {
    const filtered = filterMatches(matches, {
      sports: filters.sports,
      today: filters.today,
      search: "",
    });

    if (filters.nearMe && position) {
      return [...filtered].sort((a, b) => {
        if (!a.court) return 1;
        if (!b.court) return -1;
        return (
          haversineKm(position, a.court) - haversineKm(position, b.court)
        );
      });
    }

    return sortByUrgency(filtered);
  }, [matches, filters, position]);

  return (
    <div className="flex flex-1 flex-col gap-8 bg-surface pb-8 text-on-surface">
      <FeaturedCourtsCarousel courts={featuredCourts} distanceByCourtId={distanceByCourtId} />

      <div className="flex flex-col gap-2">
        <QuickFilters
          value={filters}
          onChange={handleFiltersChange}
          nearMeAvailable={!geoDenied}
        />
        {filters.nearMe && geoDenied && (
          <p className="px-4 font-body text-xs text-on-surface-variant">
            No pudimos usar tu ubicación. Activa el permiso de ubicación para ordenar por cercanía.
          </p>
        )}
      </div>

      <NeededMatches
        matches={visibleMatches}
        hasAnyPublicMatches={matches.length > 0}
        distanceByCourtId={distanceByCourtId}
      />

      <CourtSponsorBanner />
    </div>
  );
}
