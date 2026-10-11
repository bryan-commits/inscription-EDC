import "./globals.css";
export const metadata = { title: "Inscriptions", description: "Gestion des inscriptions" };
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#7a1f3d" };
export default function Layout({ children }) {
  return <html lang="fr"><body className="min-h-screen antialiased">{children}</body></html>;
}
