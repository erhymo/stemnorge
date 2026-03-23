import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { buildVerificationEmail, sendEmail } from "@/lib/email";
import { getJwtSecret } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = getJwtSecret();

export type AuthTokenPayload = {
  userId: number;
  name: string;
};

function toPublicUser(user: { id: number; name: string; email: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function createUserToken(user: { id: number; name: string }) {
  return jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function normalizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed || !trimmed.includes("@") || trimmed.length < 5) {
    return null;
  }

  return trimmed;
}

export async function registerUser(email: string, password: string, name: string) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = name.trim();

  if (!normalizedEmail) {
    throw new Error("Ugyldig e-postadresse.");
  }

  if (!trimmedName) {
    throw new Error("Navn er påkrevd.");
  }

  if (!password || password.length < 8) {
    throw new Error("Passord må være minst 8 tegn.");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existingUser) {
    throw new Error("Denne e-postadressen har allerede en konto.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const emailVerifyToken = randomUUID();
  const user = await prisma.user.create({
    data: { email: normalizedEmail, password: passwordHash, name: trimmedName, emailVerifyToken },
  });

  const emailContent = buildVerificationEmail(trimmedName, emailVerifyToken);
  await sendEmail({ to: normalizedEmail, ...emailContent }).catch((err) => {
    console.error("Kunne ikke sende verifiseringsmail:", err);
  });

  return {
    token: createUserToken(user),
    user: toPublicUser(user),
  };
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return null;
  }

  if (!user.emailVerified) {
    return { verified: false as const };
  }

  return {
    verified: true as const,
    token: createUserToken(user),
    user: toPublicUser(user),
  };
}

export async function verifyEmailToken(token: string) {
  if (!token) {
    return false;
  }

  const user = await prisma.user.findUnique({ where: { emailVerifyToken: token } });

  if (!user) {
    return false;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null },
  });

  return true;
}

export async function resendVerificationEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user || user.emailVerified) {
    return false;
  }

  const newToken = randomUUID();
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken: newToken },
  });

  const emailContent = buildVerificationEmail(user.name, newToken);
  await sendEmail({ to: normalizedEmail, ...emailContent });

  return true;
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return;
  }

  const { buildPasswordResetEmail } = await import("@/lib/email");

  const token = randomUUID();
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const emailContent = buildPasswordResetEmail(user.name, token);
  await sendEmail({ to: normalizedEmail, ...emailContent });
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword || newPassword.length < 8) {
    throw new Error("Ugyldig token eller passord (minst 8 tegn).");
  }

  const recentTokens = await prisma.passwordResetToken.findMany({
    where: { usedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  let matchedRecord = null;

  for (const record of recentTokens) {
    const isMatch = await bcrypt.compare(token, record.tokenHash);

    if (isMatch) {
      matchedRecord = record;
      break;
    }
  }

  if (!matchedRecord) {
    throw new Error("Ugyldig eller utløpt tilbakestillingslenke.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: matchedRecord.userId },
      data: { password: passwordHash, emailVerified: true },
    }),
    prisma.passwordResetToken.update({
      where: { id: matchedRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return true;
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.userId !== "number" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }

    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}
