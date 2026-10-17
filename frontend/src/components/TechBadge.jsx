// Pick black or white text depending on the badge color.
function textColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? "#10161f" : "#ffffff";
}

export default function TechBadge({ name, color = "#2d8b8b" }) {
  return (
    <span className="badge" style={{ background: color, color: textColor(color) }}>
      {name}
    </span>
  );
}
