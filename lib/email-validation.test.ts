import { describe, expect, it } from "vitest";

import { isDisposableEmail, normalizeEmailAlias } from "./email-validation";

describe("isDisposableEmail", () => {
  it("blokkerer kjente engangs-e-postdomener", () => {
    expect(isDisposableEmail("test@guerrillamail.com")).toBe(true);
    expect(isDisposableEmail("test@mailinator.com")).toBe(true);
    expect(isDisposableEmail("test@yopmail.com")).toBe(true);
    expect(isDisposableEmail("test@tempmail.com")).toBe(true);
  });

  it("tillater vanlige e-postdomener", () => {
    expect(isDisposableEmail("test@gmail.com")).toBe(false);
    expect(isDisposableEmail("test@outlook.com")).toBe(false);
    expect(isDisposableEmail("test@hotmail.com")).toBe(false);
    expect(isDisposableEmail("test@stemnorge.no")).toBe(false);
  });
});

describe("normalizeEmailAlias", () => {
  it("fjerner dots fra Gmail-adresser", () => {
    expect(normalizeEmailAlias("t.e.s.t@gmail.com")).toBe("test@gmail.com");
  });

  it("fjerner +suffix fra Gmail-adresser", () => {
    expect(normalizeEmailAlias("test+alias@gmail.com")).toBe("test@gmail.com");
  });

  it("normaliserer googlemail.com til gmail.com", () => {
    expect(normalizeEmailAlias("test@googlemail.com")).toBe("test@gmail.com");
  });

  it("håndterer kombinasjon av dots og +suffix for Gmail", () => {
    expect(normalizeEmailAlias("t.e.s.t+noe@gmail.com")).toBe("test@gmail.com");
  });

  it("fjerner +suffix for ikke-Gmail-adresser", () => {
    expect(normalizeEmailAlias("test+alias@outlook.com")).toBe("test@outlook.com");
  });

  it("beholder dots for ikke-Gmail-adresser", () => {
    expect(normalizeEmailAlias("first.last@outlook.com")).toBe("first.last@outlook.com");
  });

  it("returnerer uendret adresse uten alias", () => {
    expect(normalizeEmailAlias("bruker@firma.no")).toBe("bruker@firma.no");
  });
});

