import Link from 'next/link';

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5 text-text">
      <span className="flex h-7 w-7 items-center justify-center rounded-[3px] border border-rule bg-bg-2 transition group-hover:border-rule-strong">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <ellipse cx="12" cy="12" rx="9.5" ry="4.2" stroke="currentColor" strokeWidth="1.1" opacity="0.75" />
          <ellipse
            cx="12"
            cy="12"
            rx="9.5"
            ry="4.2"
            stroke="currentColor"
            strokeWidth="1.1"
            opacity="0.75"
            transform="rotate(60 12 12)"
          />
          <ellipse
            cx="12"
            cy="12"
            rx="9.5"
            ry="4.2"
            stroke="currentColor"
            strokeWidth="1.1"
            opacity="0.75"
            transform="rotate(120 12 12)"
          />
          <circle cx="12" cy="12" r="1.9" fill="var(--accent)" />
        </svg>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-[15px] font-semibold tracking-[-0.02em]">Atoms</span>
        <span className="num text-[10px] text-faint">demo</span>
      </span>
    </Link>
  );
}
