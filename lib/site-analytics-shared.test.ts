import { describe, expect, it } from "vitest";

import { isTrackedPublicPathname, normalizeTrackedPathname } from "./site-analytics-shared";

describe("site analytics shared helpers", () => {
  it("normaliserer vanlige stier", () => {
    expect(normalizeTrackedPathname("/historie/")).toBe("/historie");
    expect(normalizeTrackedPathname("/")).toBe("/");
  });

  it("avviser ugyldige stier", () => {
    expect(normalizeTrackedPathname("historie")).toBeNull();
    expect(normalizeTrackedPathname(null)).toBeNull();
  });

  it("sporer offentlige stier", () => {
    expect(isTrackedPublicPathname("/")).toBe(true);
    expect(isTrackedPublicPathname("/vote")).toBe(true);
  });

  it("hopper over admin og api", () => {
    expect(isTrackedPublicPathname("/admin")).toBe(false);
    expect(isTrackedPublicPathname("/api/login")).toBe(false);
  });
});