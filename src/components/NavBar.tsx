import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/app/actions/auth";

export async function NavBar() {
  const session = await auth();
  return (
    <header className="border-b border-white/10 bg-black/30 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-emerald-300">
          <span className="tree-pulse inline-block h-3 w-3 rounded-full bg-emerald-400" />
          学习大树
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <Link className="hover:text-white" href="/">
            首页
          </Link>
          {session?.user ? (
            <>
              <Link className="hover:text-white" href="/dashboard">
                仪表盘
              </Link>
              <Link className="hover:text-white" href="/courses">
                课程
              </Link>
              <Link className="hover:text-white" href="/notes">
                笔记
              </Link>
              <Link
                href="/notes/new"
                className="rounded-md bg-emerald-600 px-3 py-1 font-medium text-white hover:bg-emerald-500"
              >
                上传笔记
              </Link>
              <Link className="hover:text-white" href="/study">
                学习打卡
              </Link>
              <Link className="hover:text-white" href="/achievements">
                成就
              </Link>
              <span className="text-slate-500">|</span>
              <span className="max-w-[140px] truncate text-slate-400">{session.user.email}</span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-md bg-white/10 px-2 py-1 hover:bg-white/20"
                >
                  退出
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="hover:text-white" href="/login">
                登录
              </Link>
              <Link
                className="rounded-md bg-emerald-600 px-3 py-1 font-medium text-white hover:bg-emerald-500"
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
