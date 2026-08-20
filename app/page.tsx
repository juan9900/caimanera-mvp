import { redirect } from "next/navigation";
import {
  verifySession,
  getCurrentUserProfile,
  getOpenMatchesWithCourtGeo,
  getFriendsPrivateMatches,
  getMyInvitations,
  getOfficialCourts,
  getCourts,
  getUserLocation,
} from "@/lib/auth/dal";
import { HomeClient } from "@/components/home/home-client";

export default async function Home() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const [matches, friendsMatches, invitations, officialCourts, allCourts, userLocation] =
    await Promise.all([
      getOpenMatchesWithCourtGeo(),
      getFriendsPrivateMatches(),
      getMyInvitations(),
      getOfficialCourts(),
      getCourts(),
      getUserLocation(),
    ]);

  return (
    <HomeClient
      matches={matches}
      friendsMatches={friendsMatches}
      invitations={invitations}
      officialCourts={officialCourts}
      allCourts={allCourts}
      userLocation={userLocation}
    />
  );
}
