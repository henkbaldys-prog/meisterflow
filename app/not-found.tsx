import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="app-shell flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-modal bg-brand-500/10 text-brand-400">
        <AlertTriangle className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl font-bold text-dark-50">Seite nicht gefunden</h1>
      <p className="mt-2 max-w-md text-sm text-dark-400">
        Diese Seite gibt es nicht – oder der Link ist veraltet.
      </p>
      <Link href="/" className="btn-primary mt-8 min-h-[48px]">
        Zur Startseite
      </Link>
    </div>
  );
}
