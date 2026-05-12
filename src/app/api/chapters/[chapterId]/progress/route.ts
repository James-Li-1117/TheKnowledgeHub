import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { recomputeChapterMastery } from "@/lib/progress";
import { evaluateAchievements } from "@/lib/achievements";

export async function PATCH(req: Request, ctx: { params: Promise<{ chapterId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId } = await ctx.params;
  const body = await req.json();
  const parsed = z.object({ completed: z.boolean() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.chapterProgress.upsert({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
    create: {
      userId: session.user.id,
      chapterId,
      completed: parsed.data.completed,
      mastery: parsed.data.completed ? 0.55 : 0.12,
    },
    update: { completed: parsed.data.completed },
  });

  await recomputeChapterMastery(session.user.id, chapterId);
  await evaluateAchievements(session.user.id);

  const progress = await prisma.chapterProgress.findUnique({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
  });

  return NextResponse.json({ progress });
}
