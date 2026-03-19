import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, hashMock, signMock, verifyMock, randomUuidMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  hashMock: vi.fn(),
  signMock: vi.fn(),
  verifyMock: vi.fn(),
  randomUuidMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("bcryptjs", () => ({ default: { hash: hashMock } }));
vi.mock("jsonwebtoken", () => ({ default: { sign: signMock, verify: verifyMock } }));
vi.mock("node:crypto", async () => {
  const actual = await vi.importActual<typeof import("node:crypto")>("node:crypto");
  return { ...actual, randomUUID: randomUuidMock };
});

import { doesUserExist, loginUser, registerUser, verifyToken } from "./auth";

beforeEach(() => {
  vi.clearAllMocks();
  hashMock.mockResolvedValue("hashed-password");
  signMock.mockReturnValue("signed-token");
  randomUuidMock.mockReturnValue("generated-uuid");
});

describe("auth", () => {
  it("finner eksisterende bruker via normalisert telefon", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.findMany.mockResolvedValue([{ id: 1, name: "Ada", phone: "90000001", password: "hash" }]);

    await expect(doesUserExist("+47 900 00 001")).resolves.toBe(true);
  });

  it("registrerer bruker med normalisert telefon og trimmet navn", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.create.mockResolvedValue({ id: 2, name: "Ada", phone: "+4790000001", password: "hashed-password" });

    const result = await registerUser("900 00 001", "  Ada  ");

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { name: "Ada", password: "hashed-password", phone: "+4790000001" },
    });
    expect(result).toEqual({
      token: "signed-token",
      user: { id: 2, name: "Ada", phone: "+4790000001" },
    });
  });

  it("oppdaterer lagret telefonformat ved innlogging", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.findMany.mockResolvedValue([{ id: 3, name: "Ada", phone: "90000001", password: "hash" }]);
    prismaMock.user.update.mockResolvedValue({ id: 3, name: "Ada", phone: "+4790000001", password: "hash" });

    const result = await loginUser("90000001");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { phone: "+4790000001" },
    });
    expect(result?.user.phone).toBe("+4790000001");
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