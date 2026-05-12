export const COURSE_THEMES: Record<
  string,
  {
    label: string;
    branchCurve: "smooth" | "angular" | "spiral";
    leafShape: "ellipse" | "diamond" | "hex";
    bgGradient: string;
    particle: "none" | "dots" | "rings" | "lines";
  }
> = {
  surface: {
    label: "曲面生长",
    branchCurve: "smooth",
    leafShape: "ellipse",
    bgGradient: "from-sky-950/40 via-blue-900/20 to-slate-950",
    particle: "dots",
  },
  ode: {
    label: "相轨迹",
    branchCurve: "spiral",
    leafShape: "ellipse",
    bgGradient: "from-violet-950/50 via-purple-900/20 to-slate-950",
    particle: "lines",
  },
  linear: {
    label: "基向量网格",
    branchCurve: "angular",
    leafShape: "hex",
    bgGradient: "from-fuchsia-950/40 via-pink-900/15 to-slate-950",
    particle: "dots",
  },
  pde: {
    label: "波前扩散",
    branchCurve: "smooth",
    leafShape: "diamond",
    bgGradient: "from-cyan-950/45 via-teal-900/15 to-slate-950",
    particle: "rings",
  },
  mechanics: {
    label: "受力骨架",
    branchCurve: "angular",
    leafShape: "ellipse",
    bgGradient: "from-amber-950/40 via-yellow-900/10 to-slate-950",
    particle: "none",
  },
  em: {
    label: "场线环绕",
    branchCurve: "spiral",
    leafShape: "ellipse",
    bgGradient: "from-orange-950/45 via-amber-900/10 to-slate-950",
    particle: "rings",
  },
  wave: {
    label: "干涉条纹",
    branchCurve: "smooth",
    leafShape: "diamond",
    bgGradient: "from-teal-950/45 via-emerald-900/15 to-slate-950",
    particle: "lines",
  },
  quantum: {
    label: "量子跃迁",
    branchCurve: "angular",
    leafShape: "hex",
    bgGradient: "from-purple-950/50 via-indigo-900/20 to-slate-950",
    particle: "dots",
  },
  maxwell: {
    label: "Maxwell 场域",
    branchCurve: "smooth",
    leafShape: "ellipse",
    bgGradient: "from-red-950/50 via-rose-900/15 to-slate-950",
    particle: "rings",
  },
};

export function getCourseTheme(themeKey: string) {
  return COURSE_THEMES[themeKey] ?? COURSE_THEMES.surface;
}
