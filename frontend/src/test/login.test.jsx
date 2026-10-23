import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mockApi, renderApp } from "./helpers.jsx";

// GET /projects works as usual, POST /auth/login answers with `response`.
function mockLogin(response) {
  const projectsApi = mockApi();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, options = {}) =>
      new URL(url).pathname === "/auth/login" ? response() : projectsApi(url, options),
    ),
  );
}

async function submit(user) {
  await user.type(await screen.findByLabelText("Username"), "admin");
  await user.type(screen.getByLabelText("Password"), "wrong");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("login form", () => {
  it("shows its own text for a wrong password", async () => {
    mockLogin(() => new Response(JSON.stringify({ detail: "Invalid username or password" }), { status: 401 }));
    const user = userEvent.setup();
    renderApp("/login");

    await submit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Wrong username or password.");
  });

  it("shows how long to wait when the login is rate limited", async () => {
    mockLogin(
      () =>
        new Response(JSON.stringify({ detail: "Too many failed logins. Try again later." }), {
          status: 429,
          headers: { "Retry-After": "530" },
        }),
    );
    const user = userEvent.setup();
    renderApp("/login");

    await submit(user);

    // 530 s, rounded up to whole minutes
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many failed attempts. Try again in 9 min.");
  });
});
