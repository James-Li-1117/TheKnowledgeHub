"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("邮箱或密码不正确");
      return;
    }
    window.location.href = res?.url || callbackUrl;
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-md">
      <h1 className="text-2xl font-bold text-slate-900">登录</h1>
      <p className="mt-2 text-sm text-slate-600">使用注册时的邮箱与密码</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-xs text-slate-500">邮箱</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">密码</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-emerald-500 py-2.5 font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-60"
        >
          {loading ? "登录中…" : "登录"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        还没有账号？{" "}
        <Link className="font-medium text-emerald-600 hover:underline" href="/register">
          注册
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-md animate-pulse rounded-2xl border border-slate-100 bg-white/80 p-8">加载…</div>}
    >
      <LoginForm />
    </Suspense>
  );
}
