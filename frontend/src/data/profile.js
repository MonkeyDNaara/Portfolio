// Static data that is the same in both languages. Texts live in src/i18n/en.js and de.js.
export const profile = {
  name: "Niko Klam",
  initials: "NK",
  email: "niko.klam@yahoo.com",
  github: "https://github.com/MonkeyDNaara",
  linkedin: "https://www.linkedin.com/in/niko-klam/",
  // Path or URL of the CV PDF. Empty = the link is hidden.
  resume: "",
  repo: "https://github.com/MonkeyDNaara/Portfolio",
};

// used = used in a real project or at work, learning = in the WBS course right now
export const skillGroups = [
  {
    key: "backend",
    items: [
      ["Python", "used"],
      ["FastAPI", "used"],
      ["SQLAlchemy & Alembic", "used"],
      ["PostgreSQL", "used"],
      ["REST APIs", "used"],
      ["JWT auth", "used"],
      ["pytest", "used"],
      ["Drizzle ORM", "used"],
      ["Flask", "learning"],
      ["C# / .NET", "learning"],
      ["MongoDB", "learning"],
    ],
  },
  {
    key: "frontend",
    items: [
      ["React", "used"],
      ["Next.js", "used"],
      ["TypeScript", "used"],
      ["JavaScript", "used"],
      ["HTML & CSS", "used"],
      ["Tailwind CSS", "used"],
      ["Vite", "used"],
      ["PWA", "used"],
      ["Vitest", "used"],
    ],
  },
  {
    key: "devops",
    items: [
      ["Git & GitHub", "used"],
      ["GitHub Actions", "used"],
      ["Render", "used"],
      ["Neon", "used"],
      ["Docker", "learning"],
      ["Azure (AZ-900)", "learning"],
    ],
  },
  {
    key: "ai",
    items: [
      ["Claude API", "used"],
      ["AI-assisted development", "used"],
      ["Prompt engineering", "used"],
    ],
  },
  {
    key: "industry",
    items: [
      ["Siemens TIA Portal (SCL)", "used"],
      ["Functional safety (EN 62061)", "used"],
      ["SAP", "used"],
      ["Scrum", "used"],
      ["Leading a team of 10+", "used"],
    ],
  },
];
