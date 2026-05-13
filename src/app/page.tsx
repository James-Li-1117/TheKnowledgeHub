import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export default async function HomePage() {
  const session = await auth();
  const courseCount = await prisma.course.count();

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-pink-100 bg-white/90 p-8 shadow-sm backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-pink-500">The Knowledge Hub</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">思维导图 + 笔记上传</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          按课程整理思维导图，在节点上上传笔记；所有登录用户可浏览笔记与提交者，仅作者可编辑自己的笔记。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {session?.user ? (
            <>
              <Link
                href="/courses"
                className="rounded-full bg-emerald-500 px-5 py-2.5 font-medium text-white shadow hover:bg-emerald-600"
              >
                进入课程
              </Link>
              <Link
                href="/notes"
                className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 font-medium text-emerald-800 hover:bg-emerald-100"
              >
                全部笔记
              </Link>
              <Link
                href="/notes/new"
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-slate-700 shadow-sm hover:bg-slate-50"
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

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { t: "思维导图", d: "每门课独立画布：增删子节点、拖拽布局，节点可绑定笔记与预览。" },
          { t: "笔记与作者", d: "登录后查看全部笔记及提交者；他人无法修改你的笔记。" },
          { t: "课程目录", d: `当前种子包含 ${courseCount} 门课程，可从列表进入思维导图。` },
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
