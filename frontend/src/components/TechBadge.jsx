// Tech chip: neutral pill with a dot in the technology's brand color (color comes from the API).
export default function TechBadge({ name, color = "#888888" }) {
  return (
    <li className="chip" style={{ "--c": color }}>
      {name}
    </li>
  );
}

export function TechList({ techs }) {
  if (!techs?.length) return null;
  return (
    <ul className="chips" aria-label="Technologies">
      {techs.map((t) => (
        <TechBadge key={t.id ?? t.name} name={t.name} color={t.color} />
      ))}
    </ul>
  );
}
