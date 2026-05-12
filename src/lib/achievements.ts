import prisma from "@/lib/prisma";

export async function evaluateAchievements(userId: string) {
  const achievements = await prisma.achievement.findMany();
  const earned = new Set(
    (
      await prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      })
    ).map((e) => e.achievementId)
  );

  const noteCount = await prisma.note.count({ where: { authorId: userId } });
  const completedChapters = await prisma.chapterProgress.count({
    where: { userId, completed: true },
  });
  const studyMinutes = await prisma.studyLog.aggregate({
    where: { userId },
    _sum: { minutes: true },
  });
  const studyDates = await prisma.studyLog.findMany({
    where: { userId },
    select: { studiedAt: true },
  });
  const dayCount = new Set(
    studyDates.map((s) => s.studiedAt.toISOString().slice(0, 10))
  ).size;

  const courses = await prisma.course.findMany({
    include: { chapters: { select: { id: true } } },
  });

  const newly: string[] = [];

  async function grant(key: string, condition: boolean) {
    const a = achievements.find((x) => x.key === key);
    if (!a || !condition || earned.has(a.id)) return;
    await prisma.userAchievement.create({
      data: { userId, achievementId: a.id },
    });
    earned.add(a.id);
    newly.push(key);
  }

  await grant("first_note", noteCount >= 1);
  await grant("streak_7", dayCount >= 7);
  await grant("chapters_10", completedChapters >= 10);
  await grant("forest_friend", (studyMinutes._sum.minutes ?? 0) >= 500);

  for (const c of courses) {
    const total = c.chapters.length;
    if (total === 0) continue;
    const done = await prisma.chapterProgress.count({
      where: {
        userId,
        completed: true,
        chapterId: { in: c.chapters.map((ch) => ch.id) },
      },
    });
    await grant("course_canopy", done === total && total >= 3);
  }

  return { newlyUnlocked: newly };
}
