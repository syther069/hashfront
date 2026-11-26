// Small shared pieces: the brand mark, the loader and the error panel, so every page loads and fails the same way.
import type { ReactNode } from "react";
import { Refresh, WarningTriangle } from "./icons.tsx";

/** The Hashfront mark (docs/brand/hashfront-mark.svg): a hash made of four bars, one node lit. Brand colours, not theme colours. */
export function Logo() {
  return (
    <svg className="mark" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <rect width="120" height="120" rx="28" fill="#111114" />
      <rect x="38" y="22" width="13" height="76" rx="6.5" fill="#5A5A63" />
      <rect x="69" y="22" width="13" height="76" rx="6.5" fill="#5A5A63" />
      <rect x="22" y="40" width="76" height="13" rx="6.5" fill="#F4F4F6" />
      <rect x="22" y="67" width="76" height="13" rx="6.5" fill="#9A9AA3" />
      <rect x="69" y="67" width="13" height="13" rx="3" fill="#F4F4F6" />
      <rect x="1" y="1" width="118" height="118" rx="27" fill="none" stroke="#2E2E33" strokeWidth="2" />
    </svg>
  );
}

/** Bouncing dots (loading.dev). The words say what is loading; the dots only show that it is. */
export function Dots({ small }: { small?: boolean }) {
  return (
    <div className={`ld-bouncing-dots${small ? " small" : ""}`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="ld-bouncing-dots-dot" style={{ ["--ld-step" as string]: i }} />
      ))}
    </div>
  );
}

export function Loading({ what }: { what: string }) {
  return (
    <div className="loading" role="status">
      <Dots />
      <span>{what}</span>
    </div>
  );
}

/** A failure that says what failed and offers the next action. The detail is what the system actually reported. */
export function ErrorPanel({ title, detail, onRetry, children }: { title: string; detail: string; onRetry?: () => void; children?: ReactNode }) {
  return (
    <section className="card panel-error" role="alert">
      <h2>
        <WarningTriangle className="icon" size={20} style={{ verticalAlign: "-3px", marginRight: 8 }} />
        {title}
      </h2>
      <p className="error">{detail}</p>
      {children}
      {onRetry && (
        <div className="row">
          <button type="button" onClick={onRetry}>
            <Refresh /> Try again
          </button>
        </div>
      )}
    </section>
  );
}
