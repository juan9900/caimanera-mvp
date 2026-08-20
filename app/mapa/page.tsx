import { redirect } from "next/navigation";
import { verifySession, getCurrentUserProfile, getCourts, getUserLocation } from "@/lib/auth/dal";
import { MapExperience } from "@/components/mapa/map-experience";

export default async function MapaPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const [courts, userLocation] = await Promise.all([getCourts(), getUserLocation()]);

  return <MapExperience courts={courts} userLocation={userLocation} />;
}
