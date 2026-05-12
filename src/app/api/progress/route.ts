import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserCourseProgress } from "@/lib/progress";
import { snapshotProgress } from "@/lib/progress";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const courseId = url.searchParams.get("courseId");
  if (courseId) {
    const detail = await getUserCourseProgress(session.user.id, courseId);
    return NextResponse.json({ detail });
  }

  const courses = await prisma.course.findMany({ orderBy: { sortOrder: "asc" } });
  const summaries = await Promise.all(
    courses.map(async (c) => {
      const p = await getUserCourseProgress(session.user.id, c.id);
      return {
        courseId: c.id,
        code: c.code,
        title: c.title,
        themeKey: c.themeKey,
        accentColor: c.accentColor,
        fraction: p.fraction,
        completedChapters: p.completedChapters,
        chapterCount: p.chapterCount,
      };
    })
  );

  const snapshots = await prisma.progressSnapshot.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return NextResponse.json({ summaries, snapshots });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = z.object({ label: z.string().max(120).optional() }).safeParse(json);
  const label = parsed.success ? parsed.data.label : undefined;

  const data = await snapshotProgress(session.user.id, label);
  return NextResponse.json({ data });
}
