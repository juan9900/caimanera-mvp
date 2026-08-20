"use client";

import dynamic from "next/dynamic";

export const MapArea = dynamic(() => import("./map-area-inner").then((mod) => mod.MapAreaInner), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface-container" />,
});
