import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "MeisterFlow - KI-Automation für Handwerker",
  description: "Automatisiere die Büroarbeit deines Handwerksbetriebs mit KI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="bg-dark-950 text-dark-100 antialiased">
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
