import { prisma } from "@/lib/prisma";
import { isTrackedPublicPathname, normalizeTrackedPathname } from "@/lib/site-analytics-shared";

export async function recordSiteVisit(pathname: string | null | undefined) {
  const normalized = normalizeTrackedPathname(pathname);

  if (!normalized || !isTrackedPublicPathname(normalized)) {
    return null;
  }

  return prisma.siteVisit.create({
    data: {
      pathname: normalized,
    },
  });
}

export async function getSiteVisitStats(now = new Date()) {
  const monthStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [totalVisits, monthlyVisits] = await Promise.all([
    prisma.siteVisit.count(),
    prisma.siteVisit.count({
      where: {
        createdAt: {
          gte: monthStartUtc,
        },
      },
    }),
  ]);

  return {
    totalVisits,
    monthlyVisits,
  };
}