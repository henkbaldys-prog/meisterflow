import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MeisterFlow - KI-Automation für Handwerker",
  description: "Automatisiere die Büroarbeit deines Handwerksbetriebs mit KI",
  icons: {
    icon: "/meisterflow-logo.png",
    apple: "/meisterflow-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="font-sans bg-dark-950 text-dark-50 antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            className: "animate-toast-in !bg-dark-900 !text-dark-50 !border !border-white/[0.08] !shadow-soft !rounded-card !text-sm",
            success: {
              iconTheme: { primary: "#10B981", secondary: "#111827" },
            },
            error: {
              iconTheme: { primary: "#EF4444", secondary: "#111827" },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
