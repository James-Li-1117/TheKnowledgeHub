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
        <h1 className="text-2xl font-bold text-slate-900">仪表盘</h1>
        <p className="text-slate-600">欢迎，{session.user.name || session.user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="笔记数" value={String(noteCount)} />
        <StatCard label="学习分钟（累计）" value={String(study._sum.minutes ?? 0)} />
        <StatCard label="课程数" value={String(courses.length)} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">你的知识树</h2>
        <GlobalKnowledgeTreeDynamic courses={stats} />
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/courses"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
        >
          浏览课程
        </Link>
        <Link
          href="/notes/new"
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600"
        >
          上传笔记
        </Link>
        <Link
          href="/study"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
        >
          学习打卡
        </Link>
        <form action={saveProgressSnapshotAction}>
          <button
            type="submit"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
          >
            保存进度快照
          </button>
        </form>
        <a
          href="/api/report"
          className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
        >
          导出学习报告 JSON
        </a>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
