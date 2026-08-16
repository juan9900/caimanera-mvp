import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-leaflet's MapContainer isn't safe under React Strict Mode's dev-only
  // double-invoked refs/effects: it re-inits the Leaflet map on the same DOM
  // node and throws ("iconUrl not set" / "_leaflet_events" on undefined).
  // Strict Mode is dev-only tooling, so this doesn't affect production behavior.
  reactStrictMode: false,
};

export default nextConfig;
