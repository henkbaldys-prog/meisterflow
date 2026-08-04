"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  href,
}: Props) {
  return (
    <div className="flex flex-col items-center px-4 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-modal bg-brand-500/10 text-brand-400">
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-dark-50">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-dark-400">{description}</p>
      {actionLabel && href ? (
        <Link href={href} className="btn-primary mt-6 min-h-[48px]">
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction && !href ? (
        <button type="button" onClick={onAction} className="btn-primary mt-6 min-h-[48px]">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
