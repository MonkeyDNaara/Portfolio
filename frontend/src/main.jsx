import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./auth.jsx";
import { LanguageProvider } from "./i18n/LanguageProvider.jsx";
import { ProjectsProvider } from "./projects.jsx";
import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import "./styles/tokens.css";
import "./styles/app.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ProjectsProvider>
              <App />
            </ProjectsProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
