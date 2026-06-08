import "./globals.css";

export const metadata = {
  title: "Ascendance - The Trilogy",
  description: "A premium PWA reading experience for Ascendance - The Trilogy.",
  manifest: "/manifest.webmanifest"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#48006E"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div id="app-root" suppressHydrationWarning>
          {children}
        </div>
      </body>
    </html>
  );
}
