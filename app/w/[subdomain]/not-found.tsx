import Link from "next/link";

export default function WebsiteNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Website nicht gefunden</h1>
      <p className="mt-2 max-w-md text-slate-500">
        Diese Seite ist nicht veröffentlicht oder die Adresse ist falsch.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[48px] items-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
