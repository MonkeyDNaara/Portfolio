import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isRetryable, retryDelay, wakeProgress } from "../wakeUp.js";
import { makeProjects, renderApp } from "./helpers.jsx";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// Runs the fake clock forward and lets the promises in between settle.
const advance = (ms) => act(() => vi.advanceTimersByTimeAsync(ms));

const pill = () => screen.queryByText("Waking up the API");

describe("wake-up helpers", () => {
  it("waits 2, 4, 8 s and then every 10 s between retries", () => {
    expect([0, 1, 2, 3, 9].map(retryDelay)).toEqual([2000, 4000, 8000, 10000, 10000]);
  });

  it("retries only when the server is not reachable yet", () => {
    expect([0, 502, 503, 504].every((status) => isRetryable({ status }))).toBe(true);
    expect([400, 401, 404, 500].some((status) => isRetryable({ status }))).toBe(false);
  });

  it("fills the bar towards 90 % but never past it", () => {
    expect(wakeProgress(0)).toBe(0);
    expect(wakeProgress(15)).toBeGreaterThan(50);
    expect(wakeProgress(600)).toBe(90);
  });
});

describe("loading while the API wakes up", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows skeletons at once, the pill only after 1.5 s, then Ready and nothing", async () => {
    let answer;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise((resolve) => (answer = resolve))),
    );
    renderApp("/projects");

    expect(screen.getByText("Loading projects…")).toBeInTheDocument(); // skeleton grid, for screen readers
    await advance(1000);
    expect(pill()).not.toBeInTheDocument();

    await advance(600);
    expect(pill()).toBeInTheDocument();

    await act(async () => answer(json(makeProjects())));
    expect(screen.getByRole("link", { name: "MorgenMachIch" })).toBeInTheDocument();
    expect(screen.getByText("Ready ✓")).toBeInTheDocument();

    await advance(1100);
    expect(screen.queryByText("Ready ✓")).not.toBeInTheDocument();
  });

  it("shows no pill when the API answers fast", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json(makeProjects())),
    );
    renderApp("/projects");
    await advance(0);
    expect(screen.getByRole("link", { name: "MorgenMachIch" })).toBeInTheDocument();

    await advance(3000);
    expect(pill()).not.toBeInTheDocument();
    expect(screen.queryByText("Ready ✓")).not.toBeInTheDocument();
  });

  it("retries a dropped request instead of showing an error", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(json({ detail: "Bad gateway" }, 502))
      .mockImplementation(async () => json(makeProjects()));
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/projects");

    await advance(2000); // first retry: 502
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(pill()).toBeInTheDocument();

    await advance(4000); // second retry: the list
    expect(screen.getByRole("link", { name: "MorgenMachIch" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("shows the error right away when retrying can't help", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ detail: "Server error" }, 500)),
    );
    renderApp("/projects");
    await advance(0);

    expect(screen.getByRole("alert")).toHaveTextContent("Server error");
    await advance(2000);
    expect(pill()).not.toBeInTheDocument();
  });
});
