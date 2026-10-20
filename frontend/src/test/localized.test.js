import { describe, expect, it } from "vitest";

import { localized } from "../i18n/LanguageProvider.jsx";

const project = { title: "Movie diary", description: "English text", title_de: "Filmtagebuch", description_de: null };

describe("localized", () => {
  it("uses the German fields when they are filled", () => {
    expect(localized(project, "de").title).toBe("Filmtagebuch");
  });

  it("falls back to English when a German field is empty", () => {
    expect(localized(project, "de").description).toBe("English text");
  });

  it("ignores the German fields in English", () => {
    expect(localized(project, "en")).toEqual({ title: "Movie diary", description: "English text" });
  });
});
