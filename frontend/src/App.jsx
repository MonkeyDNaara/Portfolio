import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import ProjectModal from "./components/ProjectModal.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import Projects from "./pages/Projects.jsx";
import Skills from "./pages/Skills.jsx";

export default function App() {
  const location = useLocation();
  // Set when a project was opened from a card: keep that page rendered and show the project as a modal on top.
  // Without it (shared link, new tab) /projects/:id is a normal page.
  const background = location.state?.background;

  return (
    <>
      <Routes location={background || location}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Navigate to="/projects" replace />} />
          {/* if the host ever redirects to /index.html instead of rewriting, still show the home page */}
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      {background && (
        <Routes>
          <Route path="/projects/:id" element={<ProjectModal />} />
        </Routes>
      )}
    </>
  );
}
