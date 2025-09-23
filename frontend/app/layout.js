import "./globals.css";
export const metadata = {
  title: "SociAubrick",
  description: "Internal school social network",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#e7e7e7ff",
          margin: 0,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
        }}>
        {children}
      </body>
    </html>
  );
}