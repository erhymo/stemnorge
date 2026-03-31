import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { buildVerificationEmail, sendEmail } from "@/lib/email";
import { isDisposableEmail, normalizeEmailAlias } from "@/lib/email-validation";
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

  return normalizeEmailAlias(trimmed);
}

function getRawEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  return trimmed && trimmed.includes("@") && trimmed.length >= 5 ? trimmed : null;
}

async function findUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (user) {
    return user;
  }

  const rawEmail = getRawEmail(email);

  if (!rawEmail || rawEmail === normalizedEmail) {
    return null;
  }

  return prisma.user.findUnique({ where: { email: rawEmail } });
}

export async function registerUser(email: string, password: string, name: string) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = name.trim();

  if (!normalizedEmail) {
    throw new Error("Ugyldig e-postadresse.");
  }

  if (isDisposableEmail(normalizedEmail)) {
    throw new Error("Engångs-e-postadresser er ikke tillatt. Bruk en vanlig e-postkonto.");
  }

  if (!trimmedName) {
    throw new Error("Navn er påkrevd.");
  }

  if (!password || password.length < 8) {
    throw new Error("Passord må være minst 8 tegn.");
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new Error("Denne e-postadressen har allerede en konto.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const emailVerifyToken = randomUUID();
  const emailVerifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const user = await prisma.user.create({
    data: { email: normalizedEmail, password: passwordHash, name: trimmedName, emailVerifyToken, emailVerifyTokenExpiresAt },
  });

  const emailContent = buildVerificationEmail(trimmedName, emailVerifyToken);
  await sendEmail({ to: normalizedEmail, ...emailContent }).catch((err) => {
    console.error("Kunne ikke sende verifiseringsmail:", err);
  });

  return {
    user: toPublicUser(user),
  };
}

export async function loginUser(email: string, password: string) {
  if (!normalizeEmail(email) || !password) {
    return null;
  }

  const user = await findUserByEmail(email);

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

  // Check expiration if set (tokens created before the migration have no expiry)
  if (user.emailVerifyTokenExpiresAt && user.emailVerifyTokenExpiresAt <= new Date()) {
    return false;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null, emailVerifyTokenExpiresAt: null },
  });

  return true;
}

export async function resendVerificationEmail(email: string) {
  if (!normalizeEmail(email)) {
    return false;
  }

  const user = await findUserByEmail(email);

  if (!user || user.emailVerified) {
    return false;
  }

  const newToken = randomUUID();
  const emailVerifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken: newToken, emailVerifyTokenExpiresAt },
  });

  const emailContent = buildVerificationEmail(user.name, newToken);
  await sendEmail({ to: user.email, ...emailContent });

  return true;
}

export async function requestPasswordReset(email: string) {
  if (!normalizeEmail(email)) {
    return;
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return;
  }

  const { buildPasswordResetEmail } = await import("@/lib/email");

  const tokenId = randomUUID();
  const secret = randomUUID();
  const tokenHash = await bcrypt.hash(secret, 10);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenId, tokenHash, expiresAt },
  });

  // The full token sent to the user is "tokenId.secret"
  const fullToken = `${tokenId}.${secret}`;
  const emailContent = buildPasswordResetEmail(user.name, fullToken);
  await sendEmail({ to: user.email, ...emailContent });
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword || newPassword.length < 8) {
    throw new Error("Ugyldig token eller passord (minst 8 tegn).");
  }

  // Token format: "tokenId.secret"
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) {
    throw new Error("Ugyldig eller utløpt tilbakestillingslenke.");
  }

  const tokenId = token.slice(0, dotIndex);
  const secret = token.slice(dotIndex + 1);

  if (!tokenId || !secret) {
    throw new Error("Ugyldig eller utløpt tilbakestillingslenke.");
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenId },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    throw new Error("Ugyldig eller utløpt tilbakestillingslenke.");
  }

  const isMatch = await bcrypt.compare(secret, record.tokenHash);

  if (!isMatch) {
    throw new Error("Ugyldig eller utløpt tilbakestillingslenke.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: passwordHash, emailVerified: true },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
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
