import { execSync } from "node:child_process";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Short git commit of the build, shown in the footer. Render sets RENDER_GIT_COMMIT.
function buildCommit() {
  if (process.env.RENDER_GIT_COMMIT) return process.env.RENDER_GIT_COMMIT.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "dev";
  }
}

export default defineConfig({
  plugins: [react()],
  define: { __BUILD_COMMIT__: JSON.stringify(buildCommit()) },
});
