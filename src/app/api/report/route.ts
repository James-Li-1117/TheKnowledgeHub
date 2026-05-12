import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserCourseProgress } from "@/lib/progress";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courses = await prisma.course.findMany({ orderBy: { sortOrder: "asc" } });
  const noteCount = await prisma.note.count({ where: { authorId: session.user.id } });
  const studyMinutes = await prisma.studyLog.aggregate({
    where: { userId: session.user.id },
    _sum: { minutes: true },
  });
  const studyDates = await prisma.studyLog.findMany({
    where: { userId: session.user.id },
    select: { studiedAt: true },
  });
  const distinctDays = new Set(studyDates.map((s) => s.studiedAt.toISOString().slice(0, 10))).size;

  const courseRows = await Promise.all(
    courses.map(async (c) => {
      const p = await getUserCourseProgress(session.user.id, c.id);
      return {
        code: c.code,
        title: c.title,
        themeKey: c.themeKey,
        completedChapters: p.completedChapters,
        chapterCount: p.chapterCount,
        fraction: p.fraction,
        avgMastery: p.avgMastery,
      };
    })
  );

  const report = {
    generatedAt: new Date().toISOString(),
    user: { email: session.user.email, name: session.user.name },
    totals: {
      notes: noteCount,
      studyMinutes: studyMinutes._sum.minutes ?? 0,
      distinctStudyDays: distinctDays,
    },
    courses: courseRows,
  };

  return NextResponse.json(report, {
    headers: {
      "Content-Disposition": `attachment; filename="study-report-${session.user.id}.json"`,
    },
  });
}
