import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import de from "./de.js";
import en from "./en.js";

const DICTS = { en, de };
const KEY = "portfolio_lang";
const LanguageContext = createContext(null);

function initialLang() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "de") return saved;
  } catch {
    /* storage blocked, use the browser language */
  }
  return navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
}

// "home.lead" -> dict.home.lead (strings, arrays or objects)
function lookup(dict, key) {
  return key.split(".").reduce((node, part) => (node == null ? undefined : node[part]), dict);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  // t("projects.deleted", { title: "X" }) replaces {title}. Falls back to English, then to the key.
  const t = useCallback(
    (key, vars) => {
      let value = lookup(DICTS[lang], key) ?? lookup(en, key) ?? key;
      if (vars && typeof value === "string") {
        value = value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
      }
      return value;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

// Project texts from the API: German fields are optional, so fall back to English.
export function localized(project, lang) {
  if (lang === "de") {
    return {
      title: project.title_de || project.title,
      description: project.description_de || project.description,
    };
  }
  return { title: project.title, description: project.description };
}
