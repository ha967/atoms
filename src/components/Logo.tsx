import Link from 'next/link';

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 text-text">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <ellipse cx="12" cy="12" rx="9" ry="4" stroke="var(--accent-strong)" strokeWidth="1.4" />
          <ellipse
            cx="12"
            cy="12"
            rx="9"
            ry="4"
            stroke="var(--accent-strong)"
            strokeWidth="1.4"
            transform="rotate(60 12 12)"
          />
          <ellipse
            cx="12"
            cy="12"
            rx="9"
            ry="4"
            stroke="var(--accent-strong)"
            strokeWidth="1.4"
            transform="rotate(120 12 12)"
          />
          <circle cx="12" cy="12" r="1.7" fill="var(--accent-strong)" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        Atoms <span className="text-muted">Demo</span>
      </span>
    </Link>
  );
}
