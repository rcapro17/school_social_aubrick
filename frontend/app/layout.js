import "./globals.css";

export const metadata = {
  title: "School Social",
  description: "Internal school social network",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#f2f3f5",
          margin: 0,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
        }}>
        {children}
      </body>
    </html>
  );
}
