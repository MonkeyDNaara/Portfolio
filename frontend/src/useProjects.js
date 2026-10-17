import { useCallback, useEffect, useState } from "react";

import { api } from "./api.js";

export default function useProjects() {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setProjects(await api("/projects"));
    } catch (e) {
      setError(e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { projects, error, reload: load };
}
