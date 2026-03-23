import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, hashMock, compareMock, signMock, verifyMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
  hashMock: vi.fn(),
  compareMock: vi.fn(),
  signMock: vi.fn(),
  verifyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("bcryptjs", () => ({ default: { hash: hashMock, compare: compareMock } }));
vi.mock("jsonwebtoken", () => ({ default: { sign: signMock, verify: verifyMock } }));

import { loginUser, registerUser, verifyToken } from "./auth";

beforeEach(() => {
  vi.clearAllMocks();
  hashMock.mockResolvedValue("hashed-password");
  compareMock.mockResolvedValue(true);
  signMock.mockReturnValue("signed-token");
});

describe("auth", () => {
  it("registrerer bruker med e-post, passord og trimmet navn", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 2, name: "Ada", email: "ada@test.no", password: "hashed-password" });

    const result = await registerUser("Ada@Test.No", "hemmelighet1", "  Ada  ");

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { name: "Ada", password: "hashed-password", email: "ada@test.no" },
    });
    expect(result).toEqual({
      token: "signed-token",
      user: { id: 2, name: "Ada", email: "ada@test.no" },
    });
  });

  it("avviser for kort passord", async () => {
    await expect(registerUser("ada@test.no", "kort", "Ada")).rejects.toThrow("Passord må være minst 8 tegn.");
  });

  it("avviser ugyldig e-post", async () => {
    await expect(registerUser("ugyldig", "hemmelighet1", "Ada")).rejects.toThrow("Ugyldig e-postadresse.");
  });

  it("avviser duplikat e-post", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1 });

    await expect(registerUser("ada@test.no", "hemmelighet1", "Ada")).rejects.toThrow("allerede en konto");
  });

  it("logger inn med riktig passord", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 3, name: "Ada", email: "ada@test.no", password: "hash" });
    compareMock.mockResolvedValue(true);

    const result = await loginUser("ada@test.no", "hemmelighet1");

    expect(result?.user.email).toBe("ada@test.no");
  });

  it("avviser feil passord", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 3, name: "Ada", email: "ada@test.no", password: "hash" });
    compareMock.mockResolvedValue(false);

    const result = await loginUser("ada@test.no", "feilpassord");

    expect(result).toBeNull();
  });

  it("returnerer null for ukjent e-post", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await loginUser("ukjent@test.no", "hemmelighet1");

    expect(result).toBeNull();
  });

  it("verifiserer gyldige JWT-payloads", () => {
    verifyMock.mockReturnValue({ userId: 7, name: "Ada" });

    expect(verifyToken("token")).toEqual({ userId: 7, name: "Ada" });
  });

  it("returnerer null for ugyldige JWT-payloads", () => {
    verifyMock.mockReturnValue({ userId: "7", name: "Ada" });

    expect(verifyToken("token")).toBeNull();
  });
});