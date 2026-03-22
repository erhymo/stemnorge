import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    agendaTip: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { createAgendaTip, getAgendaTips } from "./tips";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("tips", () => {
  it("lagrer et trimmet agenda-tips", async () => {
    prismaMock.agendaTip.create.mockResolvedValue({ id: 1, message: "Bedre kollektivtilbud", status: "new" });

    const result = await createAgendaTip({ message: "  Bedre kollektivtilbud  " });

    expect(prismaMock.agendaTip.create).toHaveBeenCalledWith({
      data: {
        message: "Bedre kollektivtilbud",
      },
    });
    expect(result).toEqual({ id: 1, message: "Bedre kollektivtilbud", status: "new" });
  });

  it("avviser for korte tips", async () => {
    await expect(createAgendaTip({ message: "for kort" })).rejects.toThrow("Tipset må være minst 10 tegn langt.");
    expect(prismaMock.agendaTip.create).not.toHaveBeenCalled();
  });

  it("henter tips sortert nyeste først", async () => {
    prismaMock.agendaTip.findMany.mockResolvedValue([{ id: 2 }, { id: 1 }]);

    const result = await getAgendaTips({ limit: 10, status: "new" });

    expect(prismaMock.agendaTip.findMany).toHaveBeenCalledWith({
      where: { status: "new" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    expect(result).toEqual([{ id: 2 }, { id: 1 }]);
  });
});