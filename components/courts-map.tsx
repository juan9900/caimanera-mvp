"use client";

import dynamic from "next/dynamic";

export const CourtsMap = dynamic(
  () => import("./courts-map-inner").then((mod) => mod.CourtsMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 w-full animate-pulse rounded-md bg-zinc-200" />
    ),
  }
);
