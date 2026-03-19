import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { getJwtSecret } from "@/lib/env";
import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = getJwtSecret();

export type AuthTokenPayload = {
  userId: number;
  name: string;
};

function toPublicUser(user: { id: number; name: string; phone: string }) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
  };
}

function createUserToken(user: { id: number; name: string }) {
  return jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

async function updateUserPhoneIfNeeded(user: { id: number; name: string; phone: string; password: string }, normalizedPhone: string) {
  if (user.phone === normalizedPhone) {
    return user;
  }

  try {
    return await prisma.user.update({
      where: { id: user.id },
      data: { phone: normalizedPhone },
    });
  } catch {
    return { ...user, phone: normalizedPhone };
  }
}

async function findUserByNormalizedPhone(normalizedPhone: string) {
  const exactMatch = await prisma.user.findUnique({ where: { phone: normalizedPhone } });

  if (exactMatch) {
    return exactMatch;
  }

  const users = await prisma.user.findMany();
  return users.find((user) => normalizePhoneNumber(user.phone) === normalizedPhone) ?? null;
}

async function createLoginResult(user: { id: number; name: string; phone: string; password: string }, normalizedPhone?: string) {
  const resolvedUser = normalizedPhone ? await updateUserPhoneIfNeeded(user, normalizedPhone) : user;

  return {
    token: createUserToken(resolvedUser),
    user: toPublicUser(resolvedUser),
  };
}

export async function doesUserExist(phone: string) {
  const normalizedPhone = normalizePhoneNumber(phone);

  if (!normalizedPhone) {
    return false;
  }

  const user = await findUserByNormalizedPhone(normalizedPhone);
  return Boolean(user);
}

export async function registerUser(phone: string, name: string) {
  const normalizedPhone = normalizePhoneNumber(phone);
  const trimmedName = name.trim();

  if (!normalizedPhone) {
    throw new Error("Ugyldig telefonnummer.");
  }

  if (!trimmedName) {
    throw new Error("Navn er påkrevd.");
  }

  const existingUser = await findUserByNormalizedPhone(normalizedPhone);

  if (existingUser) {
    throw new Error("Dette telefonnummeret har allerede en konto.");
  }

  const passwordHash = await bcrypt.hash(randomUUID(), 10);
  const user = await prisma.user.create({
    data: { phone: normalizedPhone, password: passwordHash, name: trimmedName },
  });

  return createLoginResult(user);
}

export async function loginUser(phone: string) {
  const normalizedPhone = normalizePhoneNumber(phone);

  if (!normalizedPhone) {
    return null;
  }

  const user = await findUserByNormalizedPhone(normalizedPhone);

  if (!user) {
    return null;
  }

  return createLoginResult(user, normalizedPhone);
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
