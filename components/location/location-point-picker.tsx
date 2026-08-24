"use client";

import dynamic from "next/dynamic";

export const LocationPointPicker = dynamic(
  () => import("./location-point-picker-inner").then((mod) => mod.LocationPointPickerInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-xl bg-surface-container" />
    ),
  }
);
