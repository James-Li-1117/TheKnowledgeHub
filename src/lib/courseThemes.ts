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
    bgGradient: "from-sky-100/90 via-blue-50/80 to-white",
    particle: "dots",
  },
  ode: {
    label: "相轨迹",
    branchCurve: "spiral",
    leafShape: "ellipse",
    bgGradient: "from-violet-100/90 via-purple-50/80 to-white",
    particle: "lines",
  },
  linear: {
    label: "基向量网格",
    branchCurve: "angular",
    leafShape: "hex",
    bgGradient: "from-fuchsia-100/85 via-pink-50/80 to-white",
    particle: "dots",
  },
  pde: {
    label: "波前扩散",
    branchCurve: "smooth",
    leafShape: "diamond",
    bgGradient: "from-cyan-100/90 via-teal-50/80 to-white",
    particle: "rings",
  },
  mechanics: {
    label: "受力骨架",
    branchCurve: "angular",
    leafShape: "ellipse",
    bgGradient: "from-amber-100/90 via-yellow-50/70 to-white",
    particle: "none",
  },
  em: {
    label: "场线环绕",
    branchCurve: "spiral",
    leafShape: "ellipse",
    bgGradient: "from-orange-100/90 via-amber-50/75 to-white",
    particle: "rings",
  },
  wave: {
    label: "干涉条纹",
    branchCurve: "smooth",
    leafShape: "diamond",
    bgGradient: "from-teal-100/90 via-emerald-50/80 to-white",
    particle: "lines",
  },
  quantum: {
    label: "量子跃迁",
    branchCurve: "angular",
    leafShape: "hex",
    bgGradient: "from-purple-100/90 via-indigo-50/80 to-white",
    particle: "dots",
  },
  maxwell: {
    label: "Maxwell 场域",
    branchCurve: "smooth",
    leafShape: "ellipse",
    bgGradient: "from-rose-100/90 via-red-50/75 to-white",
    particle: "rings",
  },
};

export function getCourseTheme(themeKey: string) {
  return COURSE_THEMES[themeKey] ?? COURSE_THEMES.surface;
}
