import { createHmac } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSmsCodeSecret } from "./env";

const { prismaMock, sendSmsMock, canExposeDevSmsCodeMock, randomIntMock } = vi.hoisted(() => ({
  prismaMock: {
    smsVerificationChallenge: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  sendSmsMock: vi.fn(),
  canExposeDevSmsCodeMock: vi.fn(),
  randomIntMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/sms", () => ({
  canExposeDevSmsCode: canExposeDevSmsCodeMock,
  sendSmsMessage: sendSmsMock,
}));
vi.mock("node:crypto", async () => {
  const actual = await vi.importActual<typeof import("node:crypto")>("node:crypto");
  return { ...actual, randomInt: randomIntMock };
});

import { parseSmsVerificationPurpose, requestSmsVerificationCode, verifySmsVerificationCode } from "./sms-auth";

function createCodeHash(phone: string, purpose: "login" | "register", code: string) {
  return createHmac("sha256", getSmsCodeSecret())
    .update(`${purpose}:${phone}:${code}`)
    .digest("hex");
}

beforeEach(() => {
  vi.clearAllMocks();
  randomIntMock.mockReturnValue(123456);
  canExposeDevSmsCodeMock.mockReturnValue(true);
  sendSmsMock.mockResolvedValue({ accepted: true, provider: "mock" });
  prismaMock.smsVerificationChallenge.count.mockResolvedValue(0);
  prismaMock.smsVerificationChallenge.updateMany.mockResolvedValue({ count: 0 });
  prismaMock.smsVerificationChallenge.update.mockResolvedValue({});
});

describe("sms-auth", () => {
  it("parser kun gyldige formål", () => {
    expect(parseSmsVerificationPurpose("login")).toBe("login");
    expect(parseSmsVerificationPurpose("register")).toBe("register");
    expect(parseSmsVerificationPurpose("other")).toBeNull();
  });

  it("oppretter en ny SMS-kode og eksponerer dev-kode i mock-modus", async () => {
    prismaMock.smsVerificationChallenge.create.mockResolvedValue({ id: 1 });

    const result = await requestSmsVerificationCode("90000001", "register");

    expect(prismaMock.smsVerificationChallenge.count).toHaveBeenCalled();
    expect(prismaMock.smsVerificationChallenge.updateMany).toHaveBeenCalled();
    expect(prismaMock.smsVerificationChallenge.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        phone: "+4790000001",
        purpose: "register",
      }),
    });
    expect(sendSmsMock).toHaveBeenCalledWith({
      to: "+4790000001",
      message: expect.stringContaining("123456"),
    });
    expect(result).toEqual(expect.objectContaining({ normalizedPhone: "+4790000001", devCode: "123456" }));
  });

  it("rate-limiter nye kodeforespørsler per telefon og formål", async () => {
    prismaMock.smsVerificationChallenge.count.mockResolvedValue(3);

    await expect(requestSmsVerificationCode("90000001", "register")).rejects.toMatchObject({
      name: "SmsRateLimitError",
      message: "For mange SMS-kodeforespørsler. Vent litt og prøv igjen.",
    });

    expect(prismaMock.smsVerificationChallenge.create).not.toHaveBeenCalled();
    expect(prismaMock.smsVerificationChallenge.updateMany).not.toHaveBeenCalled();
    expect(sendSmsMock).not.toHaveBeenCalled();
  });

  it("avviser koder som ikke har 6 sifre", async () => {
    await expect(verifySmsVerificationCode("90000001", "login", "12")).resolves.toEqual({
      ok: false,
      error: "Koden må bestå av 6 sifre.",
    });
  });

  it("øker antall forsøk ved feil kode", async () => {
    prismaMock.smsVerificationChallenge.findFirst.mockResolvedValue({
      id: 10,
      attempts: 0,
      codeHash: createCodeHash("+4790000001", "login", "654321"),
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await verifySmsVerificationCode("90000001", "login", "123456");

    expect(result).toEqual({ ok: false, error: "Feil kode." });
    expect(prismaMock.smsVerificationChallenge.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { attempts: { increment: 1 } },
    });
  });

  it("markerer koden som brukt når den er gyldig", async () => {
    prismaMock.smsVerificationChallenge.findFirst.mockResolvedValue({
      id: 11,
      attempts: 0,
      codeHash: createCodeHash("+4790000001", "login", "123456"),
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await verifySmsVerificationCode("90000001", "login", "123456");

    expect(result).toEqual({ ok: true, normalizedPhone: "+4790000001" });
    expect(prismaMock.smsVerificationChallenge.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: { consumedAt: expect.any(Date) },
    });
  });
});