import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/app/actions/auth";

export async function NavBar() {
  const session = await auth();
  return (
    <header className="border-b border-pink-100/80 bg-white/85 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-emerald-600">
          <span className="tree-pulse inline-block h-3 w-3 rounded-full bg-emerald-400" />
          The Knowledge Hub
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <Link className="rounded-md px-1 py-0.5 hover:bg-pink-50 hover:text-slate-900" href="/">
            首页
          </Link>
          {session?.user ? (
            <>
              <Link className="rounded-md px-1 py-0.5 hover:bg-pink-50 hover:text-slate-900" href="/courses">
                课程
              </Link>
              <Link className="rounded-md px-1 py-0.5 hover:bg-pink-50 hover:text-slate-900" href="/notes">
                笔记
              </Link>
              <Link
                href="/notes/new"
                className="rounded-full bg-emerald-500 px-3 py-1 font-medium text-white shadow-sm hover:bg-emerald-600"
              >
                上传笔记
              </Link>
              <span className="text-slate-300">|</span>
              <span className="max-w-[140px] truncate text-slate-500">{session.user.email}</span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  退出
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="rounded-md px-1 py-0.5 hover:bg-pink-50 hover:text-slate-900" href="/login">
                登录
              </Link>
              <Link
                className="rounded-full bg-emerald-500 px-3 py-1 font-medium text-white shadow-sm hover:bg-emerald-600"
                href="/register"
              >
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
