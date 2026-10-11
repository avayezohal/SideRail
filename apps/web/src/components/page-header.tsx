import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared page heading: colored icon tile + title/description + action slot.
 * Keeps every panel page visually consistent on desktop and mobile.
 */
export function PageHeader({
  icon: Icon,
  accent = "#a3e635",
  title,
  description,
  actions,
  className,
}: {
  icon: React.ElementType;
  accent?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex animate-rise flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-base border-2 border-border neo-shadow sm:h-12 sm:w-12"
          style={{ background: accent }}
        >
          <Icon className="h-5 w-5 text-black sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl leading-tight sm:text-3xl">{title}</h1>
          {description && (
            <p className="mt-0.5 truncate text-sm font-base text-text/60">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
