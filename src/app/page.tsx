import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserCourseProgress } from "@/lib/progress";
import type { GlobalCourseStat } from "@/components/tree/GlobalKnowledgeTree";
import { GlobalKnowledgeTreeDynamic } from "@/components/tree/GlobalKnowledgeTreeDynamic";

async function courseStatsForUser(userId: string): Promise<GlobalCourseStat[]> {
  const courses = await prisma.course.findMany({ orderBy: { sortOrder: "asc" } });
  const out: GlobalCourseStat[] = [];
  for (const c of courses) {
    const p = await getUserCourseProgress(userId, c.id);
    out.push({
      id: c.id,
      code: c.code,
      title: c.title,
      themeKey: c.themeKey,
      accentColor: c.accentColor,
      fraction: p.fraction,
    });
  }
  return out;
}

export default async function HomePage() {
  const session = await auth();
  const courses = await prisma.course.findMany({ orderBy: { sortOrder: "asc" } });

  let stats: GlobalCourseStat[] = courses.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    themeKey: c.themeKey,
    accentColor: c.accentColor,
    fraction: 0,
  }));

  if (session?.user?.id) {
    stats = await courseStatsForUser(session.user.id);
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-pink-100 bg-white/90 p-8 shadow-sm backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-pink-500">Summer Study Hub</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">把暑假复习，长成一棵知识大树</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          用思维导图串起每门课：自由加节点、贴便利贴式预览，笔记和进度都更直观。风格更明亮可爱，学习也轻松一点。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full bg-emerald-500 px-5 py-2.5 font-medium text-white shadow hover:bg-emerald-600"
              >
                进入仪表盘
              </Link>
              <Link
                href="/notes/new"
                className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 font-medium text-emerald-800 hover:bg-emerald-100"
              >
                上传笔记
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-full bg-emerald-500 px-5 py-2.5 font-medium text-white shadow hover:bg-emerald-600"
              >
                注册账号
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-slate-700 shadow-sm hover:bg-slate-50"
              >
                登录
              </Link>
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">全局知识树</h2>
        <GlobalKnowledgeTreeDynamic courses={stats} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { t: "思维导图式笔记", d: "每门课从根节点延伸，上传 PDF/图片可生成便利贴预览。" },
          { t: "进度可视化", d: "React Flow + 可爱枝干风：全局九枝 + 每课章节分枝。" },
          { t: "多人协作", d: "各自账号与成就；学习打卡累计分钟与连续天数。" },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl border border-slate-100 bg-white/95 p-5 shadow-sm">
            <h3 className="font-semibold text-emerald-600">{x.t}</h3>
            <p className="mt-2 text-sm text-slate-600">{x.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
