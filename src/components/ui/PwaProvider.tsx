"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const Context = createContext({
  online: true,
  installed: false,
  install: async () => {},
  update: async () => {},
  updateAvailable: false,
  help: "",
  dismissed: false,
  dismiss: () => {},
});
export const usePwa = () => useContext(Context);
export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [worker, setWorker] = useState<ServiceWorker | null>(null);
  const [help, setHelp] = useState("");
  const [dismissed, setDismissed] = useState(true);
  const router = useRouter();
  useEffect(() => {
    setOnline(navigator.onLine);
    const display = matchMedia("(display-mode: standalone)");
    const check = () =>
      setInstalled(
        display.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
      );
    check();
    try {
      setDismissed(sessionStorage.getItem("kinsous-install-dismissed") === "1");
    } catch {}
    const connectivity = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) {
        router.refresh();
        window.dispatchEvent(new Event("kinsous:refresh"));
      }
    };
    const before = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("online", connectivity);
    window.addEventListener("offline", connectivity);
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", done);
    display.addEventListener("change", check);
    let disposed = false;
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (disposed) return;
          if (reg.waiting) setWorker(reg.waiting);
          reg.addEventListener("updatefound", () => {
            const next = reg.installing;
            next?.addEventListener("statechange", () => {
              if (
                next.state === "installed" &&
                navigator.serviceWorker.controller
              )
                setWorker(next);
            });
          });
        })
        .catch(() =>
          setHelp("Offline support could not start. Refresh to try again."),
        );
    return () => {
      disposed = true;
      window.removeEventListener("online", connectivity);
      window.removeEventListener("offline", connectivity);
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", done);
      display.removeEventListener("change", check);
    };
  }, [router]);
  const install = async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    } else
      setHelp(
        /iPad|iPhone|iPod/.test(navigator.userAgent)
          ? "Open your browser?s Share menu, choose Add to Home Screen, then tap Add."
          : "Open your browser menu and choose Install app or Add to Home Screen, if available.",
      );
  };
  const update = async () => {
    if (
      !worker ||
      location.pathname.startsWith("/payment") ||
      document.querySelector('[aria-busy="true"]')
    ) {
      setHelp("Finish your current action before updating.");
      return;
    }
    const pending: Promise<unknown>[] = [];
    window.dispatchEvent(
      new CustomEvent("kinsous:flush-drafts", { detail: { pending } }),
    );
    await Promise.all(pending);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => location.reload(),
      { once: true },
    );
    worker.postMessage({ type: "SKIP_WAITING" });
  };
  return (
    <Context.Provider
      value={{
        online,
        installed,
        install,
        update,
        updateAvailable: Boolean(worker),
        help,
        dismissed,
        dismiss: () => {
          setDismissed(true);
          setHelp("");
          try {
            sessionStorage.setItem("kinsous-install-dismissed", "1");
          } catch {}
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function PwaBanner() {
  const pwa = usePwa();
  const pathname = usePathname();
  return (
    <div className="pwa-banners" aria-live="polite">
      {!pwa.online && (
        <div className="notice">
          You are offline. Drafts stay on this device. Reconnect to send or pay.{" "}
          <button onClick={() => location.reload()}>Retry</button>
        </div>
      )}
      {pwa.updateAvailable && (
        <div className="notice">
          A new version is ready.{" "}
          <button
            disabled={!pwa.online || pathname.startsWith("/payment")}
            onClick={pwa.update}
          >
            Update app
          </button>
        </div>
      )}
      {!pwa.installed && !pwa.dismissed && !pathname.startsWith("/login") && (
        <div className="notice">
          Keep KinSous close. <button onClick={pwa.install}>Install app</button>
          <button
            aria-label="Dismiss installation prompt"
            onClick={pwa.dismiss}
          >
            Dismiss
          </button>
        </div>
      )}
      {pwa.help && (
        <div className="notice">
          {pwa.help}
          <button onClick={pwa.dismiss}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
