// OKX Connect as a wagmi connector: the visitor scans a QR code (or opens the OKX App by deep link on a phone) and signs in
// the OKX App. It complements the injected connector, which covers the OKX Wallet browser extension and any other
// EIP-6963 wallet. The SDK (@okxconnect/ui, Apache-2.0) is loaded only when someone clicks it, so the status page
// itself stays small and makes no request to OKX's connection relay until a visitor asks for a wallet.
import { createConnector } from "wagmi";
import { getAddress, SwitchChainError, UserRejectedRequestError, type EIP1193Provider } from "viem";

type Ui = import("@okxconnect/ui").OKXUniversalConnectUI;

/** Methods the OKX App answers over OKX Connect. Anything else is not forwarded: reads go to the page's own RPC. */
const WALLET_METHODS = new Set(["eth_sendTransaction", "personal_sign", "eth_signTypedData_v4", "wallet_switchEthereumChain", "wallet_addEthereumChain"]);

/** wagmi asks every connector "are you still signed in?" on page load; this flag keeps the SDK unloaded unless this one was. */
const FLAG = "hashfront.okxConnect";
const flag = (v?: boolean): boolean => {
  try {
    if (v === true) localStorage.setItem(FLAG, "1");
    else if (v === false) localStorage.removeItem(FLAG);
    return localStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
};

const caip = (id: number) => `eip155:${id}`;
const accountsOf = (ui: Ui): `0x${string}`[] =>
  ui.requestAccountsWithNamespace("eip155").map((a) => getAddress(a.includes(":") ? a.split(":").pop()! : a));

const loadSdk = async (): Promise<Ui> => {
  const { OKXUniversalConnectUI, THEME } = await import("@okxconnect/ui");
  return OKXUniversalConnectUI.init({
    dappMetaData: { name: "Hashfront", icon: new URL("./hashfront-mark-256.png", location.href).href },
    actionsConfiguration: { modals: "all", returnStrategy: "none" },
    uiPreferences: { theme: THEME.DARK },
    language: "en_US",
  } as never);
};

/** `loadUi` is a parameter only so a test can hand in a fake SDK. */
export function okxConnect(loadUi: () => Promise<Ui> = loadSdk) {
  let rpcUrl: string | undefined;
  let announceDisconnect: () => void = () => undefined;
  let loading: Promise<Ui> | undefined;

  // One SDK object and one disconnect listener for the page's life, however often connect() runs.
  // shortcut: the event name comes from the SDK's own types and has not been seen with the real OKX App; check it there.
  const load = (): Promise<Ui> =>
    (loading ??= loadUi().then(
      (u) => {
        u.on("okx-connect-ui-disconnection", () => announceDisconnect());
        return u;
      },
      (e: unknown) => {
        loading = undefined;
        throw e;
      },
    ));

  return createConnector<EIP1193Provider>((config) => {
    announceDisconnect = () => config.emitter.emit("disconnect");
    const provider = (): EIP1193Provider => ({
      request: (async ({ method, params }: { method: string; params?: unknown }) => {
        const u = await load();
        const chain = config.chains[0]!;
        if (method === "eth_accounts" || method === "eth_requestAccounts") return accountsOf(u);
        if (method === "eth_chainId") return `0x${chain.id.toString(16)}`;
        if (!WALLET_METHODS.has(method)) throw Object.assign(new Error(`OKX Connect does not handle ${method} here`), { code: 4200 });
        return u.request({ method, params: params as never }, caip(chain.id));
      }) as EIP1193Provider["request"],
      on: () => undefined,
      removeListener: () => undefined,
    } as unknown as EIP1193Provider);

    return {
      id: "okxConnect",
      name: "OKX Wallet app (QR code)",
      type: "okxConnect",
      async setup() {
        rpcUrl = config.chains[0]?.rpcUrls.default.http[0];
      },
      async connect(parameters?: { chainId?: number; isReconnecting?: boolean }) {
        const chain = config.chains.find((c) => c.id === parameters?.chainId) ?? config.chains[0]!;
        const u = await load();
        if (!u.connected()) {
          try {
            await u.openModal({
              namespaces: { eip155: { chains: [caip(chain.id)], defaultChain: String(chain.id), ...(rpcUrl ? { rpcMap: { [String(chain.id)]: rpcUrl } } : {}) } },
            });
          } catch (e) {
            throw new UserRejectedRequestError(e as Error);
          }
        }
        const accounts = accountsOf(u);
        if (!accounts.length) throw new UserRejectedRequestError(new Error("OKX Connect returned no account"));
        flag(true);
        return { accounts, chainId: chain.id } as never;
      },
      async disconnect() {
        flag(false);
        if (loading) {
          const u = await loading;
          if (u.connected()) await u.disconnect();
        }
      },
      async getAccounts() {
        const u = await load();
        return u.connected() ? accountsOf(u) : [];
      },
      async getChainId() {
        return config.chains[0]!.id;
      },
      async getProvider() {
        return provider();
      },
      async isAuthorized() {
        if (!flag()) return false;
        try {
          const u = await load();
          return u.connected() && accountsOf(u).length > 0;
        } catch {
          return false;
        }
      },
      async switchChain({ chainId }: { chainId: number }) {
        const chain = config.chains.find((c) => c.id === chainId);
        if (!chain) throw new SwitchChainError(new Error("This page only knows its own chain"));
        return chain;
      },
      onAccountsChanged() {},
      onChainChanged() {},
      onDisconnect() {
        config.emitter.emit("disconnect");
      },
    } as never;
  });
}
