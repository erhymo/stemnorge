import { describe, expect, it } from "vitest";

import { normalizePhoneNumber } from "./phone";

describe("normalizePhoneNumber", () => {
  it("normaliserer norske nummer med mellomrom", () => {
    expect(normalizePhoneNumber("900 00 001")).toBe("+4790000001");
  });

  it("støtter nummer med 47-prefiks", () => {
    expect(normalizePhoneNumber("4790000001")).toBe("+4790000001");
  });

  it("støtter nummer med 0047-prefiks", () => {
    expect(normalizePhoneNumber("004790000001")).toBe("+4790000001");
  });

  it("returnerer null for ugyldig lengde", () => {
    expect(normalizePhoneNumber("1234567")).toBeNull();
    expect(normalizePhoneNumber("123456789")).toBeNull();
  });
});