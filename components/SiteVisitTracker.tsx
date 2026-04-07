"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { SITE_VISIT_COOLDOWN_MS, SITE_VISIT_STORAGE_KEY, isTrackedPublicPathname } from "@/lib/site-analytics-shared";

export default function SiteVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isTrackedPublicPathname(pathname)) {
      return;
    }

    try {
      const lastVisitAt = Number(window.localStorage.getItem(SITE_VISIT_STORAGE_KEY) || "0");

      if (Number.isFinite(lastVisitAt) && Date.now() - lastVisitAt < SITE_VISIT_COOLDOWN_MS) {
        return;
      }

      window.localStorage.setItem(SITE_VISIT_STORAGE_KEY, String(Date.now()));
    } catch {
      return;
    }

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pathname }),
      keepalive: true,
    });
  }, [pathname]);

  return null;
}