import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, hashMock, compareMock, signMock, verifyMock, sendEmailMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  hashMock: vi.fn(),
  compareMock: vi.fn(),
  signMock: vi.fn(),
  verifyMock: vi.fn(),
  sendEmailMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("bcryptjs", () => ({ default: { hash: hashMock, compare: compareMock } }));
vi.mock("jsonwebtoken", () => ({ default: { sign: signMock, verify: verifyMock } }));
vi.mock("@/lib/email", () => ({
  sendEmail: sendEmailMock,
  buildVerificationEmail: () => ({ subject: "Bekreft", text: "lenke", html: "<a>lenke</a>" }),
  buildPasswordResetEmail: () => ({ subject: "Reset", text: "lenke", html: "<a>lenke</a>" }),
}));

import { loginUser, registerUser, verifyToken, verifyEmailToken, resendVerificationEmail } from "./auth";

beforeEach(() => {
  vi.clearAllMocks();
  hashMock.mockResolvedValue("hashed-password");
  compareMock.mockResolvedValue(true);
  signMock.mockReturnValue("signed-token");
  sendEmailMock.mockResolvedValue({ provider: "mock", accepted: true });
});

describe("auth", () => {
  it("registrerer bruker med e-post, passord og trimmet navn", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 2, name: "Ada", email: "ada@test.no", password: "hashed-password" });

    const result = await registerUser("Ada@Test.No", "hemmelighet1", "  Ada  ");

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: "Ada", password: "hashed-password", email: "ada@test.no" }),
    });
    expect(result).toEqual({
      token: "signed-token",
      user: { id: 2, name: "Ada", email: "ada@test.no" },
    });
    expect(sendEmailMock).toHaveBeenCalled();
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

  it("logger inn med riktig passord og verifisert e-post", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 3, name: "Ada", email: "ada@test.no", password: "hash", emailVerified: true });
    compareMock.mockResolvedValue(true);

    const result = await loginUser("ada@test.no", "hemmelighet1");

    expect(result).not.toBeNull();
    expect(result?.verified).toBe(true);
    if (result?.verified) {
      expect(result.user.email).toBe("ada@test.no");
    }
  });

  it("returnerer verified=false for uverifisert e-post", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 3, name: "Ada", email: "ada@test.no", password: "hash", emailVerified: false });
    compareMock.mockResolvedValue(true);

    const result = await loginUser("ada@test.no", "hemmelighet1");

    expect(result).not.toBeNull();
    expect(result?.verified).toBe(false);
  });

  it("avviser feil passord", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 3, name: "Ada", email: "ada@test.no", password: "hash", emailVerified: true });
    compareMock.mockResolvedValue(false);

    const result = await loginUser("ada@test.no", "feilpassord");

    expect(result).toBeNull();
  });

  it("returnerer null for ukjent e-post", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await loginUser("ukjent@test.no", "hemmelighet1");

    expect(result).toBeNull();
  });

  it("verifiserer e-post med gyldig token", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1, emailVerifyToken: "tok" });
    prismaMock.user.update.mockResolvedValue({});

    const ok = await verifyEmailToken("tok");

    expect(ok).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { emailVerified: true, emailVerifyToken: null },
    });
  });

  it("returnerer false for ugyldig verifiseringstoken", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const ok = await verifyEmailToken("ugyldig");

    expect(ok).toBe(false);
  });

  it("sender ny verifiseringsmail", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1, name: "Ada", email: "ada@test.no", emailVerified: false });
    prismaMock.user.update.mockResolvedValue({});

    const ok = await resendVerificationEmail("ada@test.no");

    expect(ok).toBe(true);
    expect(sendEmailMock).toHaveBeenCalled();
  });

  it("sender ikke verifiseringsmail til allerede verifisert bruker", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1, name: "Ada", email: "ada@test.no", emailVerified: true });

    const ok = await resendVerificationEmail("ada@test.no");

    expect(ok).toBe(false);
    expect(sendEmailMock).not.toHaveBeenCalled();
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