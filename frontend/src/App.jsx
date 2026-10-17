import { Route, Routes } from "react-router-dom";

function Placeholder({ name }) {
  return <main style={{ padding: 24, color: "var(--text)" }}>{name}</main>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder name="Home" />} />
      <Route path="*" element={<Placeholder name="Not found" />} />
    </Routes>
  );
}
