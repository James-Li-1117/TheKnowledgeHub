import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { StudyLogForm } from "./StudyLogForm";

export default async function StudyPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const courses = await prisma.course.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, code: true, title: true },
  });

  const recent = await prisma.studyLog.findMany({
    where: { userId: session.user.id },
    orderBy: { studiedAt: "desc" },
    take: 12,
    include: { course: { select: { code: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">学习打卡</h1>
        <p className="text-sm text-slate-400">累计分钟用于成就「Forest friend」等。</p>
      </div>
      <StudyLogForm courses={courses} />
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">最近记录</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          {recent.map((r) => (
            <li key={r.id} className="flex justify-between rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2">
              <span>
                {r.studiedAt.toLocaleString()} · {r.minutes} 分钟
                {r.course ? ` · ${r.course.code}` : ""}
              </span>
              {r.note && <span className="max-w-[40%] truncate text-slate-500">{r.note}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
