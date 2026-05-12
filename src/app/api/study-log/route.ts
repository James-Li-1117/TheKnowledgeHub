import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { evaluateAchievements } from "@/lib/achievements";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = z
    .object({
      minutes: z.number().int().min(1).max(600),
      courseId: z.string().nullable().optional(),
      chapterId: z.string().nullable().optional(),
      note: z.string().max(500).optional(),
    })
    .safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const log = await prisma.studyLog.create({
    data: {
      userId: session.user.id,
      minutes: parsed.data.minutes,
      courseId: parsed.data.courseId ?? undefined,
      chapterId: parsed.data.chapterId ?? undefined,
      note: parsed.data.note,
    },
  });

  await evaluateAchievements(session.user.id);

  return NextResponse.json({ log });
}
