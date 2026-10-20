import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { LONG_TEXT, mockApi, renderApp } from "./helpers.jsx";

// The modal is a <dialog>, Testing Library finds it by role "dialog".
const openModal = () => screen.queryByRole("dialog", { name: "MorgenMachIch" });

async function openFromCard(user) {
  await user.click(await screen.findByRole("link", { name: "MorgenMachIch" }));
  return screen.findByRole("dialog", { name: "MorgenMachIch" });
}

describe("project modal", () => {
  let fetchMock;
  beforeEach(() => {
    fetchMock = mockApi();
  });

  it("opens from a card with the full description and keeps the list underneath", async () => {
    const user = userEvent.setup();
    renderApp("/projects");

    const dialog = await openFromCard(user);

    expect(within(dialog).getByText(LONG_TEXT)).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /view on github/i })).toHaveAttribute(
      "href",
      "https://github.com/MonkeyDNaara/MorgenMachIch",
    );
    expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeInTheDocument();
  });

  it("closes with the close button", async () => {
    const user = userEvent.setup();
    renderApp("/projects");
    const dialog = await openFromCard(user);

    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(openModal()).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "MorgenMachIch" })).toBeInTheDocument();
  });

  it("shows a normal page, not a modal, when the link is opened directly", async () => {
    renderApp("/projects/2");

    expect(await screen.findByRole("heading", { level: 1, name: "MorgenMachIch" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows no owner actions to visitors", async () => {
    const user = userEvent.setup();
    renderApp("/projects");
    const dialog = await openFromCard(user);

    expect(within(dialog).queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("lets the owner delete a project after confirming it", async () => {
    fetchMock = mockApi();
    const user = userEvent.setup();
    renderApp("/projects", { owner: true });
    const dialog = await openFromCard(user);

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(within(dialog).getByText('Delete "MorgenMachIch"? This can\'t be undone.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ method: "DELETE" }));

    const confirm = within(dialog).getByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Delete" }));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/projects/2"),
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(openModal()).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "MorgenMachIch" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent('Deleted "MorgenMachIch".');
  });

  it("cancelling the delete keeps the project", async () => {
    const user = userEvent.setup();
    renderApp("/projects", { owner: true });
    const dialog = await openFromCard(user);

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(within(dialog).queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ method: "DELETE" }));
  });
});
