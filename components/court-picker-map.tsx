"use client";

import dynamic from "next/dynamic";

export const CourtPickerMap = dynamic(
  () => import("./court-picker-map-inner").then((mod) => mod.CourtPickerMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 w-full animate-pulse rounded-md bg-zinc-200" />
    ),
  }
);
