import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
  const user = await prisma.user.create({
    data: { email: normalizedEmail, password: passwordHash, name: trimmedName },
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

  return {
    token: createUserToken(user),
    user: toPublicUser(user),
  };
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
