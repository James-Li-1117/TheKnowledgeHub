import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const achievements = await prisma.achievement.findMany({ orderBy: { title: "asc" } });
  const earned = await prisma.userAchievement.findMany({
    where: { userId: session.user.id },
    select: { achievementId: true, earnedAt: true },
  });
  const earnedSet = new Set(earned.map((e) => e.achievementId));
  const earnedAt = Object.fromEntries(earned.map((e) => [e.achievementId, e.earnedAt]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">成就</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {achievements.map((a) => {
          const ok = earnedSet.has(a.id);
          return (
            <div
              key={a.id}
              className={`rounded-2xl border p-5 ${
                ok ? "border-emerald-500/50 bg-emerald-950/30" : "border-white/10 bg-slate-900/40"
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">{a.key}</p>
              <h2 className="mt-1 text-lg font-semibold text-white">{a.title}</h2>
              {a.description && <p className="mt-2 text-sm text-slate-400">{a.description}</p>}
              <p className="mt-3 text-xs text-slate-500">
                {ok ? `已获得 · ${earnedAt[a.id]?.toLocaleString()}` : "尚未解锁"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
