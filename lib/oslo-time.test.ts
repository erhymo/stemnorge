import { describe, expect, it } from "vitest";

import { parseOsloDatetimeLocal, toDatetimeLocalValueInOslo } from "./oslo-time";

describe("oslo-time", () => {
  it("parser sommertid i Oslo til riktig UTC", () => {
    expect(parseOsloDatetimeLocal("2026-04-20T06:00")?.toISOString()).toBe("2026-04-20T04:00:00.000Z");
    expect(parseOsloDatetimeLocal("2026-04-26T18:00")?.toISOString()).toBe("2026-04-26T16:00:00.000Z");
  });

  it("parser vintertid i Oslo til riktig UTC", () => {
    expect(parseOsloDatetimeLocal("2026-01-05T06:00")?.toISOString()).toBe("2026-01-05T05:00:00.000Z");
  });

  it("formatterer UTC-datoer tilbake til norsk datetime-local", () => {
    expect(toDatetimeLocalValueInOslo(new Date("2026-04-20T04:00:00.000Z"))).toBe("2026-04-20T06:00");
  });
});