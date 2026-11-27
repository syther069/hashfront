// Which wallet connectors to offer, and what to call them. Pure, so it can be tested without a browser.

interface Named {
  id: string;
  type: string;
  name: string;
}

/**
 * wagmi always has a generic "injected" connector (whatever sits at window.ethereum) next to the wallets EIP-6963 announces by
 * name. Once a named wallet exists the generic one is a duplicate, and it may be a different wallet than its label says.
 */
export function visibleConnectors<T extends Named>(all: readonly T[]): T[] {
  const named = all.some((c) => c.type === "injected" && c.id !== "injected");
  return named ? all.filter((c) => c.id !== "injected") : [...all];
}

/** The generic connector is called "Injected"; say what it is. */
export const connectorLabel = (c: Named): string => (c.id === "injected" ? "Browser wallet" : c.name);
