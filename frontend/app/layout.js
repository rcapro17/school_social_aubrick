"use client";
import "./globals.css";
import useTheme from "../lib/useTheme";

export default function RootLayout({ children }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <html lang="en">
      <body className={theme} style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
        <button
          onClick={toggleTheme}
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 1000,
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #333",
            background: theme === "dark" ? "#23232a" : "#fff",
            color: theme === "dark" ? "#f4f4f5" : "#18181b",
            cursor: "pointer"
          }}
        >
          {theme === "dark" ? "🌞 Light mode" : "🌙 Dark mode"}
        </button>
        {children}
      </body>
    </html>
  );
}