import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ChapterSeed = {
  title: string;
  slug: string;
  children?: ChapterSeed[];
};

type CourseSeed = {
  code: string;
  title: string;
  themeKey: string;
  accentColor: string;
  sortOrder: number;
  tree: ChapterSeed[];
};

const COURSES: CourseSeed[] = [
  {
    code: "MATH212",
    title: "MATH 212 — Multivariable Calculus",
    themeKey: "surface",
    accentColor: "#2563eb",
    sortOrder: 1,
    tree: [
      { title: "Vectors & geometry", slug: "vectors", children: [
        { title: "Dot & cross product", slug: "dot-cross" },
        { title: "Lines & planes", slug: "lines-planes" },
      ]},
      { title: "Partial derivatives", slug: "partials", children: [
        { title: "Chain rule", slug: "chain" },
        { title: "Tangent planes", slug: "tangent-planes" },
      ]},
      { title: "Multiple integrals", slug: "integrals", children: [
        { title: "Polar & cylindrical", slug: "polar-cyl" },
        { title: "Spherical coords", slug: "spherical" },
      ]},
      { title: "Vector fields", slug: "vector-fields", children: [
        { title: "Line integrals", slug: "line-int" },
        { title: "Green's theorem", slug: "green" },
      ]},
    ],
  },
  {
    code: "MATH211",
    title: "MATH 211 — Ordinary Differential Equations",
    themeKey: "ode",
    accentColor: "#7c3aed",
    sortOrder: 2,
    tree: [
      { title: "First-order ODEs", slug: "first-order", children: [
        { title: "Separable equations", slug: "separable" },
        { title: "Integrating factors", slug: "integrating-factors" },
      ]},
      { title: "Linear systems", slug: "linear-systems", children: [
        { title: "Eigenmethods", slug: "eigen" },
        { title: "Phase portraits", slug: "phase" },
      ]},
      { title: "Higher-order linear", slug: "higher-order", children: [
        { title: "Undetermined coefficients", slug: "undetermined" },
        { title: "Variation of parameters", slug: "variation" },
      ]},
    ],
  },
  {
    code: "MATH355",
    title: "MATH 355 — Linear Algebra",
    themeKey: "linear",
    accentColor: "#db2777",
    sortOrder: 3,
    tree: [
      { title: "Vector spaces", slug: "vector-spaces", children: [
        { title: "Subspaces & bases", slug: "bases" },
        { title: "Dimension", slug: "dimension" },
      ]},
      { title: "Linear maps", slug: "linear-maps", children: [
        { title: "Matrices", slug: "matrices" },
        { title: "Rank-nullity", slug: "rank-nullity" },
      ]},
      { title: "Eigenvalues", slug: "eigenvalues", children: [
        { title: "Diagonalization", slug: "diagonalization" },
        { title: "Inner products", slug: "inner-products" },
      ]},
    ],
  },
  {
    code: "CMOR304",
    title: "CMOR 304 — Partial Differential Equations",
    themeKey: "pde",
    accentColor: "#0891b2",
    sortOrder: 4,
    tree: [
      { title: "Classification & models", slug: "models", children: [
        { title: "Heat equation", slug: "heat" },
        { title: "Wave equation", slug: "wave-eq" },
      ]},
      { title: "Separation of variables", slug: "separation", children: [
        { title: "Fourier series", slug: "fourier" },
        { title: "Sturm–Liouville", slug: "sturm-liouville" },
      ]},
      { title: "Green's functions", slug: "greens", children: [
        { title: "Fundamental solutions", slug: "fundamental" },
      ]},
    ],
  },
  {
    code: "PHYS111",
    title: "PHYS 111 — Introductory Mechanics",
    themeKey: "mechanics",
    accentColor: "#ca8a04",
    sortOrder: 5,
    tree: [
      { title: "Kinematics", slug: "kinematics", children: [
        { title: "1D motion", slug: "1d-motion" },
        { title: "Projectile motion", slug: "projectile" },
      ]},
      { title: "Newton's laws", slug: "newton", children: [
        { title: "Free-body diagrams", slug: "fbd" },
        { title: "Friction", slug: "friction" },
      ]},
      { title: "Work & energy", slug: "energy", children: [
        { title: "Conservation", slug: "conservation" },
      ]},
    ],
  },
  {
    code: "PHYS112",
    title: "PHYS 112 — Introductory E&M",
    themeKey: "em",
    accentColor: "#ea580c",
    sortOrder: 6,
    tree: [
      { title: "Electrostatics", slug: "electrostatics", children: [
        { title: "Coulomb & fields", slug: "coulomb" },
        { title: "Gauss's law", slug: "gauss" },
      ]},
      { title: "Potential & capacitance", slug: "potential-cap", children: [
        { title: "Conductors", slug: "conductors" },
      ]},
      { title: "Magnetostatics", slug: "magnetostatics", children: [
        { title: "Ampère's law", slug: "ampere" },
        { title: "Induction", slug: "induction" },
      ]},
    ],
  },
  {
    code: "PHYS201",
    title: "PHYS 201 — Waves & Optics",
    themeKey: "wave",
    accentColor: "#0d9488",
    sortOrder: 7,
    tree: [
      { title: "Oscillations", slug: "oscillations", children: [
        { title: "SHM & damped motion", slug: "shm" },
      ]},
      { title: "Waves", slug: "waves", children: [
        { title: "Superposition", slug: "superposition" },
        { title: "Standing waves", slug: "standing" },
      ]},
      { title: "Optics", slug: "optics", children: [
        { title: "Interference", slug: "interference" },
        { title: "Diffraction", slug: "diffraction" },
      ]},
    ],
  },
  {
    code: "PHYS202",
    title: "PHYS 202 — Modern Physics",
    themeKey: "quantum",
    accentColor: "#9333ea",
    sortOrder: 8,
    tree: [
      { title: "Special relativity", slug: "relativity", children: [
        { title: "Lorentz transforms", slug: "lorentz" },
      ]},
      { title: "Quantum intro", slug: "quantum-intro", children: [
        { title: "Photoelectric effect", slug: "photoelectric" },
        { title: "Bohr model", slug: "bohr" },
      ]},
      { title: "Matter waves", slug: "matter-waves", children: [
        { title: "Schrödinger basics", slug: "schrodinger" },
      ]},
    ],
  },
  {
    code: "PHYS302",
    title: "PHYS 302 — Intermediate Electrodynamics",
    themeKey: "maxwell",
    accentColor: "#dc2626",
    sortOrder: 9,
    tree: [
      { title: "Boundary value problems", slug: "bvp", children: [
        { title: "Method of images", slug: "images" },
        { title: "Separation in Cartesian", slug: "sep-cart" },
      ]},
      { title: "Multipole expansion", slug: "multipole", children: [
        { title: "Dipole fields", slug: "dipole" },
      ]},
      { title: "Maxwell equations", slug: "maxwell-eq", children: [
        { title: "Potentials & gauges", slug: "gauges" },
        { title: "Radiation intro", slug: "radiation" },
      ]},
    ],
  },
];

async function seedChapters(
  courseId: string,
  nodes: ChapterSeed[],
  parentId: string | null,
  orderBase: number
) {
  let o = orderBase;
  for (const node of nodes) {
    const ch = await prisma.chapter.create({
      data: {
        courseId,
        parentId,
        title: node.title,
        slug: node.slug,
        order: o++,
      },
    });
    if (node.children?.length) {
      await seedChapters(courseId, node.children, ch.id, 0);
    }
  }
}

async function main() {
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.progressSnapshot.deleteMany();
  await prisma.chapterProgress.deleteMany();
  await prisma.studyLog.deleteMany();
  await prisma.mindMapNode.deleteMany();
  await prisma.note.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.course.deleteMany();

  for (const c of COURSES) {
    const course = await prisma.course.create({
      data: {
        code: c.code,
        title: c.title,
        themeKey: c.themeKey,
        accentColor: c.accentColor,
        sortOrder: c.sortOrder,
      },
    });
    await seedChapters(course.id, c.tree, null, 0);
  }

  const achievements = [
    { key: "first_note", title: "First leaf", description: "Upload your first note." },
    { key: "streak_7", title: "Steady growth", description: "Study on 7 distinct days." },
    { key: "chapters_10", title: "Branching out", description: "Mark 10 chapters complete." },
    { key: "course_canopy", title: "Course canopy", description: "Complete every chapter in one course." },
    { key: "forest_friend", title: "Forest friend", description: "Log 500 total study minutes." },
  ];

  for (const a of achievements) {
    await prisma.achievement.create({ data: a });
  }

  console.log("Seed complete:", COURSES.length, "courses");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
