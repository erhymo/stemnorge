import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { getSmsCodeSecret } from "@/lib/env";
import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { canExposeDevSmsCode, sendSmsMessage } from "@/lib/sms";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_REQUESTS_PER_WINDOW = 3;
const SMS_CODE_SECRET = getSmsCodeSecret();
const PURPOSES = new Set(["login", "register"]);

export type SmsVerificationPurpose = "login" | "register";

export class SmsRateLimitError extends Error {
  constructor(message = "For mange SMS-kodeforespørsler. Vent litt og prøv igjen.") {
    super(message);
    this.name = "SmsRateLimitError";
  }
}

function hashCode(phone: string, purpose: SmsVerificationPurpose, code: string) {
  return createHmac("sha256", SMS_CODE_SECRET).update(`${purpose}:${phone}:${code}`).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function buildSmsMessage(purpose: SmsVerificationPurpose, code: string) {
  const label = purpose === "login" ? "innlogging" : "registrering";
  return `StemNorge ${label}: koden din er ${code}. Koden utløper om ${CODE_TTL_MINUTES} minutter.`;
}

export function parseSmsVerificationPurpose(value: unknown): SmsVerificationPurpose | null {
  return typeof value === "string" && PURPOSES.has(value) ? (value as SmsVerificationPurpose) : null;
}

export async function requestSmsVerificationCode(phone: string, purpose: SmsVerificationPurpose) {
  const normalizedPhone = normalizePhoneNumber(phone);

  if (!normalizedPhone) {
    throw new Error("Ugyldig telefonnummer.");
  }

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  const recentRequestCount = await prisma.smsVerificationChallenge.count({
    where: {
      phone: normalizedPhone,
      purpose,
      createdAt: { gte: windowStart },
    },
  });

  if (recentRequestCount >= MAX_REQUESTS_PER_WINDOW) {
    throw new SmsRateLimitError();
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000);

  await prisma.smsVerificationChallenge.updateMany({
    where: { phone: normalizedPhone, purpose, consumedAt: null },
    data: { consumedAt: now },
  });

  await prisma.smsVerificationChallenge.create({
    data: {
      phone: normalizedPhone,
      purpose,
      codeHash: hashCode(normalizedPhone, purpose, code),
      expiresAt,
    },
  });

  await sendSmsMessage({ to: normalizedPhone, message: buildSmsMessage(purpose, code) });

  return {
    normalizedPhone,
    expiresAt,
    ...(canExposeDevSmsCode() ? { devCode: code } : {}),
  };
}

export async function verifySmsVerificationCode(phone: string, purpose: SmsVerificationPurpose, code: string) {
  const normalizedPhone = normalizePhoneNumber(phone);
  const sanitizedCode = code.replace(/[^0-9]/g, "").trim();

  if (!normalizedPhone) {
    return { ok: false as const, error: "Ugyldig telefonnummer." };
  }

  if (sanitizedCode.length !== 6) {
    return { ok: false as const, error: "Koden må bestå av 6 sifre." };
  }

  const challenge = await prisma.smsVerificationChallenge.findFirst({
    where: { phone: normalizedPhone, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    return { ok: false as const, error: "Ingen aktiv kode funnet. Be om en ny SMS-kode." };
  }

  if (challenge.expiresAt.getTime() <= Date.now()) {
    return { ok: false as const, error: "Koden har utløpt. Be om en ny SMS-kode." };
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { ok: false as const, error: "For mange feilforsøk. Be om en ny SMS-kode." };
  }

  const valid = safeEqual(hashCode(normalizedPhone, purpose, sanitizedCode), challenge.codeHash);

  if (!valid) {
    await prisma.smsVerificationChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });

    return { ok: false as const, error: "Feil kode." };
  }

  await prisma.smsVerificationChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true as const, normalizedPhone };
}