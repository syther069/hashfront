import type { Status } from "./compare.ts";
import type { Level } from "./signals/index.ts";

const EXIT: Record<Status, number> = {
  MATCH: 0,
  HOST_BEHIND: 1,
  DEPLOYED_BEFORE_ACTIVATION: 1,
  CDN_MODIFIED: 1,
  MISMATCH: 2,
  UNVERIFIABLE: 3,
  UNREACHABLE: 3,
};

/** Exit code for --once: the content verdict, raised by the signals. An alert-level signal wins even over MATCH,
 * because a cloaked hijack serves the approved bytes to the watcher. */
export function exitCode(status: Status | undefined, level: Level): number {
  const c = status === undefined ? 0 : EXIT[status];
  if (level === "alert" || c === 2) return 2;
  if (c === 3 || level === "unknown") return 3;
  if (c === 1 || level === "warn") return 1;
  return 0;
}
