"use client";

import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Props = {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = "Etwas ist schiefgelaufen",
  description = "Bitte versuche es erneut oder gehe zurück.",
  backHref = "/dashboard",
  backLabel = "Zurück zum Dashboard",
  onRetry,
}: Props) {
  return (
    <div className="card flex flex-col items-center px-4 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-modal bg-danger/10 text-danger">
        <AlertTriangle className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-dark-50">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-dark-400">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={backHref} className="btn-secondary min-h-[48px]">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-primary min-h-[48px]">
            Erneut versuchen
          </button>
        )}
      </div>
    </div>
  );
}
