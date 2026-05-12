import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserCourseProgress } from "@/lib/progress";
import type { GlobalCourseStat } from "@/components/tree/GlobalKnowledgeTree";
import { saveProgressSnapshotAction } from "@/app/actions/progress";
import { GlobalKnowledgeTreeDynamic } from "@/components/tree/GlobalKnowledgeTreeDynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const courses = await prisma.course.findMany({ orderBy: { sortOrder: "asc" } });
  const stats: GlobalCourseStat[] = [];
  for (const c of courses) {
    const p = await getUserCourseProgress(session.user.id, c.id);
    stats.push({
      id: c.id,
      code: c.code,
      title: c.title,
      themeKey: c.themeKey,
      accentColor: c.accentColor,
      fraction: p.fraction,
    });
  }

  const noteCount = await prisma.note.count({ where: { authorId: session.user.id } });
  const study = await prisma.studyLog.aggregate({
    where: { userId: session.user.id },
    _sum: { minutes: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">仪表盘</h1>
        <p className="text-slate-400">欢迎，{session.user.name || session.user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="笔记数" value={String(noteCount)} />
        <StatCard label="学习分钟（累计）" value={String(study._sum.minutes ?? 0)} />
        <StatCard label="课程数" value={String(courses.length)} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">你的知识树</h2>
        <GlobalKnowledgeTreeDynamic courses={stats} />
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/courses"
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
        >
          浏览课程
        </Link>
        <Link href="/notes/new" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
          上传笔记
        </Link>
        <Link
          href="/study"
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
        >
          学习打卡
        </Link>
        <form action={saveProgressSnapshotAction}>
          <button
            type="submit"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            保存进度快照
          </button>
        </form>
        <a
          href="/api/report"
          className="inline-block rounded-xl border border-emerald-500/40 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/10"
        >
          导出学习报告 JSON
        </a>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
