// Static data that is the same in both languages. Texts live in src/i18n/en.js and de.js.
export const profile = {
  name: "Niko Klam",
  initials: "NK",
  email: "niko.klam@yahoo.com",
  github: "https://github.com/MonkeyDNaara",
  linkedin: "https://www.linkedin.com/in/niko-klam/",
  // Path or URL of the CV PDF. Empty = the link is hidden.
  resume: "/Lebenslauf_Niko_Klam.pdf",
  repo: "https://github.com/MonkeyDNaara/Portfolio",
};

/*
 * Skills. status: "used" = used in a real project or at work, "learning" = in the WBS course right now.
 * color = brand color of the dot. techs = tech names (as in the API) that count as this skill,
 * the Skills page lists every published project with one of them ("used in").
 * where = fixed text for skills without public projects (work experience).
 */
const skill = (name, color, status = "used", extra = {}) => ({ name, color, status, techs: [name], ...extra });

export const coreSkills = ["Python", "PostgreSQL", "React", "TypeScript", "Git & GitHub"];

export const skillGroups = [
  {
    key: "backend",
    items: [
      skill("Python", "#3776AB"),
      skill("FastAPI", "#009688"),
      skill("SQLAlchemy & Alembic", "#D71F00", "used", { techs: ["SQLAlchemy", "Alembic"] }),
      skill("PostgreSQL", "#4169E1", "used", { techs: ["PostgreSQL", "Neon"] }),
      skill("REST APIs", "#94a3b8", "used", { techs: ["FastAPI", "Express", "REST API"] }),
      skill("JWT auth", "#d63aff", "used", { techs: ["JWT"] }),
      skill("pytest", "#0a9edc"),
      skill("Drizzle ORM", "#9bc23a", "used", { techs: ["Drizzle"] }),
      skill("Flask", "#94a3b8", "learning"),
      skill("C# / .NET", "#512BD4", "learning", { techs: ["C#", ".NET"] }),
      skill("MongoDB", "#47A248", "learning"),
    ],
  },
  {
    key: "frontend",
    items: [
      skill("React", "#22b8de"),
      skill("Next.js", "#8a8a8a"),
      skill("TypeScript", "#3178C6"),
      skill("JavaScript", "#e5c400", "used", { techs: ["JavaScript", "React"] }),
      skill("HTML & CSS", "#e34f26", "used", { techs: ["HTML5", "CSS3", "HTML", "CSS"] }),
      skill("Tailwind CSS", "#38bdf8", "used", { techs: ["Tailwind", "Tailwind CSS"] }),
      skill("Vite", "#9466ff"),
      skill("PWA", "#7c3aed"),
      skill("Vitest", "#6E9F18"),
    ],
  },
  {
    key: "devops",
    items: [
      skill("Git & GitHub", "#f05032", "used", { techs: [], where: { en: "Every project, with issues, branches and PRs", de: "Jedes Projekt, mit Issues, Branches und PRs" } }),
      skill("GitHub Actions", "#2088FF"),
      skill("Render", "#46e3b7"),
      skill("Neon", "#00c98d"),
      skill("Docker", "#2496ed", "learning"),
      skill("Azure (AZ-900)", "#0078d4", "learning", { techs: ["Azure"] }),
    ],
  },
  {
    key: "ai",
    items: [
      skill("Claude API", "#d97757", "used", { techs: ["Claude API", "Claude"] }),
      skill("AI-assisted development", "#34d399", "used", { techs: [], where: { en: "Planning and building with AI agents, issue by issue", de: "Planen und Bauen mit AI-Agents, Issue für Issue" } }),
      skill("Prompt engineering", "#a78bfa", "used", { techs: [], where: { en: "My Second Brain and job-application agent", de: "Mein Second Brain und mein Bewerbungs-Agent" } }),
    ],
  },
  {
    key: "industry",
    items: [
      skill("Siemens TIA Portal (SCL)", "#009999", "used", { techs: [], where: { en: "OLKO Maschinentechnik, PLC software for mining machines", de: "OLKO Maschinentechnik, PLC-Software für Bergbaumaschinen" } }),
      skill("Functional safety (EN 62061)", "#f59e0b", "used", { techs: [], where: { en: "OLKO Maschinentechnik", de: "OLKO Maschinentechnik" } }),
      skill("SAP", "#0FAAFF", "used", { techs: [], where: { en: "BMW and Weber Food Technology", de: "BMW und Weber Food Technology" } }),
      skill("Scrum", "#94a3b8", "used", { techs: [], where: { en: "Team projects at WBS Coding School", de: "Teamprojekte bei der WBS Coding School" } }),
      skill("Leading a team of 10+", "#34d399", "used", { techs: [], where: { en: "BMW, shift supervisor", de: "BMW, Schichtführer" } }),
    ],
  },
];
