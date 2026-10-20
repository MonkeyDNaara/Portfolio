import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import App from "../App.jsx";
import { AuthProvider } from "../auth.jsx";
import { LanguageProvider } from "../i18n/LanguageProvider.jsx";
import { ProjectsProvider } from "../projects.jsx";
import { ThemeProvider } from "../theme/ThemeProvider.jsx";

export const LONG_TEXT = "A to-do app with a calendar view. ".repeat(12).trim();

export function makeProjects() {
  return [
    {
      id: 1,
      title: "Portfolio",
      description: "This site.",
      title_de: null,
      description_de: null,
      repo_url: "https://github.com/MonkeyDNaara/Portfolio",
      live_url: null,
      techs: [{ name: "Python", color: "#3776AB" }],
      featured: true,
      is_published: true,
      image_version: null,
    },
    {
      id: 2,
      title: "MorgenMachIch",
      description: LONG_TEXT,
      title_de: null,
      description_de: null,
      repo_url: "https://github.com/MonkeyDNaara/MorgenMachIch",
      live_url: "https://example.com",
      techs: [{ name: "React", color: "#61DAFB" }],
      featured: false,
      is_published: true,
      image_version: null,
    },
  ];
}

/**
 * Fake API: GET /projects returns the list, DELETE removes one.
 * Returns the vi.fn so tests can check the calls.
 */
export function mockApi(projects = makeProjects()) {
  let list = projects;
  const fetchMock = vi.fn(async (url, { method = "GET" } = {}) => {
    const path = new URL(url).pathname;
    const json = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
    if (method === "GET" && path === "/projects") return json(list);
    const match = path.match(/^\/projects\/(\d+)$/);
    if (method === "DELETE" && match) {
      list = list.filter((p) => p.id !== Number(match[1]));
      return { ok: true, status: 204, json: async () => null };
    }
    return json({ detail: "Not found" }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Renders the whole app at `path`, optionally logged in as the owner. */
export function renderApp(path, { owner = false } = {}) {
  localStorage.setItem("portfolio_lang", "en");
  if (owner) localStorage.setItem("portfolio_token", "test-token");
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ProjectsProvider>
              <App />
            </ProjectsProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}
