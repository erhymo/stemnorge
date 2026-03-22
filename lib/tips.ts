import { type AgendaTip } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const AGENDA_TIP_MIN_LENGTH = 10;
export const AGENDA_TIP_MAX_LENGTH = 600;

export type AgendaTipStatus = "new" | "archived";

type GetAgendaTipsOptions = {
  limit?: number;
  status?: AgendaTipStatus;
};

export type AgendaTipsAdminResult = {
  tips: AgendaTip[];
  unavailable: boolean;
};

type PrismaErrorWithCode = {
  code?: unknown;
  meta?: {
    modelName?: unknown;
  };
};

function clampTipLimit(limit: number) {
  return Math.min(Math.max(limit, 1), 100);
}

function isAgendaTipStorageUnavailableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const { code, meta } = error as PrismaErrorWithCode;

  if (code !== "P2021" && code !== "P2022") {
    return false;
  }

  return meta?.modelName === undefined || meta.modelName === "AgendaTip";
}

export function validateAgendaTipMessage(value: string) {
  const message = value.trim();

  if (!message) {
    throw new Error("Skriv noen ord om saken du ønsker på agendaen.");
  }

  if (message.length < AGENDA_TIP_MIN_LENGTH) {
    throw new Error(`Tipset må være minst ${AGENDA_TIP_MIN_LENGTH} tegn langt.`);
  }

  if (message.length > AGENDA_TIP_MAX_LENGTH) {
    throw new Error(`Tipset kan være maks ${AGENDA_TIP_MAX_LENGTH} tegn langt.`);
  }

  return message;
}

export function isAgendaTipValidationError(message: string) {
  return message.includes("agendaen") || message.includes("minst") || message.includes("maks");
}

export async function createAgendaTip(input: { message: string }): Promise<AgendaTip> {
  const message = validateAgendaTipMessage(input.message);

  return prisma.agendaTip.create({
    data: {
      message,
    },
  });
}

export async function getAgendaTips(options: GetAgendaTipsOptions = {}) {
  const { limit = 25, status } = options;

  return prisma.agendaTip.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: clampTipLimit(limit),
  });
}

export async function getAgendaTipsForAdmin(options: GetAgendaTipsOptions = {}): Promise<AgendaTipsAdminResult> {
  try {
    return {
      tips: await getAgendaTips(options),
      unavailable: false,
    };
  } catch (error) {
    if (isAgendaTipStorageUnavailableError(error)) {
      return {
        tips: [],
        unavailable: true,
      };
    }

    throw error;
  }
}