import { useTheme } from "../context/ThemeContext";

export default function DarkModeToggle({ style = {} }) {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={dark ? "Yorug' rejim" : "Qorong'u rejim"}
      aria-label="Dark mode toggle"
      style={{
        width: 40, height: 40, borderRadius: "12px",
        background: dark ? "#334155" : "#f1f5f9",
        border: `1px solid ${dark ? "#475569" : "#e2e8f0"}`,
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "18px",
        transition: "all 0.2s",
        flexShrink: 0,
        ...style,
      }}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
