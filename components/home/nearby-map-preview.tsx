"use client";

import dynamic from "next/dynamic";

export const NearbyMapPreview = dynamic(
  () => import("./nearby-map-preview-inner").then((mod) => mod.NearbyMapPreviewInner),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-surface-container" />,
  }
);
