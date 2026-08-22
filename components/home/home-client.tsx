"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { haversineKm, formatDistance, type LatLng } from "@/lib/geo/distance";
import {
  filterCourtsByRadius,
  filterMatches,
  filterMatchesByRadius,
  RADIUS_EXPANSION_STEPS_KM,
  selectFeaturedCourts,
  smallestRadiusWithResults,
  sortByUrgency,
  type HomeCourt,
  type HomeMatch,
} from "@/lib/matches/home";
import type { MatchInvitation, Court, UserLocation } from "@/lib/auth/dal";
import { FeaturedCourtsCarousel } from "@/components/home/featured-courts-carousel";
import { NearbyMapCard } from "@/components/home/nearby-map-card";
import { InvitationsSection } from "@/components/home/invitations-section";
import { FriendsMatches } from "@/components/home/friends-matches";
import { NeededMatches } from "@/components/home/needed-matches";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";

const REALTIME_REFRESH_DEBOUNCE_MS = 800;

/** Orchestrates the home screen: sport filter, saved-location radius, and live match updates. */
export function HomeClient({
  matches,
  friendsMatches,
  invitations,
  officialCourts,
  allCourts,
  userLocation,
  preferredSports,
  startTour,
}: {
  matches: HomeMatch[];
  friendsMatches: HomeMatch[];
  invitations: MatchInvitation[];
  officialCourts: HomeCourt[];
  allCourts: Court[];
  userLocation: UserLocation | null;
  preferredSports?: string[];
  startTour?: boolean;
}) {
  const router = useRouter();
  const [sportFilter, setSportFilter] = useState<string[]>([]);
  const [radiusStepIndex, setRadiusStepIndex] = useState(0);

  const locationPos = useMemo<LatLng | null>(
    () => (userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null),
    [userLocation],
  );
  const radiusKm = RADIUS_EXPANSION_STEPS_KM[radiusStepIndex];
  const canExpandRadius = radiusStepIndex < RADIUS_EXPANSION_STEPS_KM.length - 1;

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
      .on("postgres_changes", { event: "*", schema: "public", table: "match_participants" }, () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => router.refresh(), REALTIME_REFRESH_DEBOUNCE_MS);
      })
      .subscribe();

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [router]);

  function toggleSport(sportKey: string) {
    setSportFilter((current) =>
      current.includes(sportKey)
        ? current.filter((s) => s !== sportKey)
        : [...current, sportKey],
    );
  }

  const distanceByCourtId = useMemo(() => {
    if (!locationPos) return undefined;
    const map = new Map<string, string>();
    const allCourts = [
      ...officialCourts,
      ...matches.map((m) => m.court).filter((c): c is HomeCourt => c !== null),
      ...friendsMatches.map((m) => m.court).filter((c): c is HomeCourt => c !== null),
      ...invitations.map((i) => i.match.court).filter((c): c is HomeCourt => c !== null),
    ];
    for (const court of allCourts) {
      if (map.has(court.id)) continue;
      map.set(court.id, formatDistance(haversineKm(locationPos, { lat: court.lat, lng: court.lng })));
    }
    return map;
  }, [locationPos, officialCourts, matches, friendsMatches, invitations]);

  // Featured courts are scoped to the user's saved location, widening the
  // radius automatically (no manual control) until at least one shows up.
  // If nothing is close even at the widest step, show none rather than
  // falling back to every official court in the app.
  const nearbyOfficialCourts = useMemo(() => {
    if (!locationPos) return officialCourts;
    const radius = smallestRadiusWithResults(officialCourts, locationPos);
    return radius == null ? [] : filterCourtsByRadius(officialCourts, locationPos, radius);
  }, [officialCourts, locationPos]);

  const featuredCourts = useMemo(
    () => selectFeaturedCourts(nearbyOfficialCourts, matches),
    [nearbyOfficialCourts, matches],
  );

  // "Sesiones públicas" defaults to DEFAULT_RADIUS_KM from the user's saved
  // location; `radiusStepIndex` lets them widen it manually when empty.
  const matchesNearLocation = useMemo(() => {
    if (!locationPos) return matches;
    return filterMatchesByRadius(matches, locationPos, radiusKm);
  }, [matches, locationPos, radiusKm]);

  const visibleMatches = useMemo(() => {
    const filtered = filterMatches(matchesNearLocation, {
      sports: sportFilter,
      today: false,
      search: "",
    });
    return sortByUrgency(filtered);
  }, [matchesNearLocation, sportFilter]);

  return (
    <div className="flex flex-1 flex-col gap-8 bg-surface pb-8 text-on-surface">
      <FeaturedCourtsCarousel courts={featuredCourts} distanceByCourtId={distanceByCourtId} />

      <NearbyMapCard courts={allCourts} userLocation={userLocation} preferredSports={preferredSports} />

      <InvitationsSection invitations={invitations} distanceByCourtId={distanceByCourtId} />

      <FriendsMatches matches={friendsMatches} distanceByCourtId={distanceByCourtId} />

      <NeededMatches
        matches={visibleMatches}
        hasAnyPublicMatches={matches.length > 0}
        distanceByCourtId={distanceByCourtId}
        radiusKm={locationPos ? radiusKm : undefined}
        canExpandRadius={canExpandRadius}
        showExpandRadius={
          !!locationPos && matchesNearLocation.length === 0 && matches.length > 0
        }
        onExpandRadius={() => setRadiusStepIndex((i) => Math.min(i + 1, RADIUS_EXPANSION_STEPS_KM.length - 1))}
        sportFilter={sportFilter}
        onToggleSport={toggleSport}
      />

      <OnboardingTour run={!!startTour} />
    </div>
  );
}
