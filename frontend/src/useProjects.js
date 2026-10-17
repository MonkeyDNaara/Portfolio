import { useCallback, useEffect, useState } from "react";

import { api } from "./api.js";

// With a token the API also returns hidden projects (admin view).
export default function useProjects(token) {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setProjects(await api("/projects", { token }));
    } catch (e) {
      setError(e);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { projects, setProjects, error, reload: load };
}
