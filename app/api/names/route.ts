import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).max(100000).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  type GeneratedNameWithFavorite = {
    id: string;
    name: string;
    description: string;
    industry: string;
    tone: string;
    keywords: string | null;
    createdAt: Date;
    favorites: Array<{ id: string }>;
  };

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
  });

  const limit = parsed.success ? (parsed.data.limit ?? 25) : 25;
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    prisma.generatedName.count({ where: { userId: session.user.id } }),
    prisma.generatedName.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      select: {
        id: true,
        name: true,
        description: true,
        industry: true,
        tone: true,
        keywords: true,
        createdAt: true,
        favorites: {
          where: { userId: session.user.id },
          select: { id: true },
          take: 1,
        },
      },
    }) as Promise<GeneratedNameWithFavorite[]>,
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize: limit,
    items: items.map((x: GeneratedNameWithFavorite) => ({
      id: x.id,
      name: x.name,
      description: x.description,
      industry: x.industry,
      tone: x.tone,
      keywords: x.keywords,
      createdAt: x.createdAt,
      isFavorite: x.favorites.length > 0,
    })),
  });
}
