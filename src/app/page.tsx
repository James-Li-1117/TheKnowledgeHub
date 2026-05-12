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
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400/90">Summer Study Hub</p>
        <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">把暑假复习，长成一棵知识大树</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          与朋友一起上传笔记、记录学习时长，章节完成会让枝干更茂盛。数学与物理九门课各有独特的进度视觉主题。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="rounded-xl bg-emerald-500 px-5 py-2.5 font-medium text-emerald-950 hover:bg-emerald-400"
            >
              进入仪表盘
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-xl bg-emerald-500 px-5 py-2.5 font-medium text-emerald-950 hover:bg-emerald-400"
              >
                注册账号
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/20 px-5 py-2.5 text-slate-100 hover:bg-white/10"
              >
                登录
              </Link>
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">全局知识树</h2>
        <GlobalKnowledgeTreeDynamic courses={stats} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { t: "笔记整合", d: "按课程与章节归档，支持 Markdown 与文件上传（可接 Supabase）。" },
          { t: "进度可视化", d: "React Flow + d3 布局：全局九枝 + 每课章节分枝。" },
          { t: "多人协作", d: "各自账号与成就；学习打卡累计分钟与连续天数。" },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
            <h3 className="font-semibold text-emerald-200">{x.t}</h3>
            <p className="mt-2 text-sm text-slate-400">{x.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
