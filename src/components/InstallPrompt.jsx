import { useEffect, useState } from "react";

const DISMISS_KEY = "larder:install-prompt-dismissed";
const IOS_LAST_SEEN_KEY = "larder:install-prompt-ios-last-seen";
const IOS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isIOS() {
  if (typeof navigator === "undefined") return false;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) return true;
  // iPad on iOS 13+ reports as Mac. Heuristic: Mac UA + touch points.
  if (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) return true;
  return false;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed
    if (localStorage.getItem(DISMISS_KEY)) return; // permanently dismissed

    // Android / Chrome: catch the install prompt event
    function handler(e) {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    }
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show a manual hint, but rate-limited to once every 7 days.
    if (isIOS()) {
      const lastSeenStr = localStorage.getItem(IOS_LAST_SEEN_KEY);
      const lastSeen = lastSeenStr ? parseInt(lastSeenStr, 10) : 0;
      if (Date.now() - lastSeen > IOS_COOLDOWN_MS) {
        setIosHint(true);
        localStorage.setItem(IOS_LAST_SEEN_KEY, String(Date.now()));
      }
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") localStorage.setItem(DISMISS_KEY, "installed");
    setShow(false);
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "dismissed");
    setShow(false);
    setIosHint(false);
  }

  if (!show && !iosHint) return null;

  return (
    <div className="install-prompt" role="dialog" aria-label="Install Larder">
      <div className="install-prompt-body">
        <span className="install-prompt-emoji" aria-hidden="true">🫙</span>
        {show ? (
          <>
            <p className="install-prompt-text">Install Larder for quick access from your home screen.</p>
            <div className="install-prompt-actions">
              <button onClick={install} className="btn btn-primary">Install</button>
              <button onClick={dismiss} className="btn btn-secondary">Not now</button>
            </div>
          </>
        ) : (
          <>
            <p className="install-prompt-text">
              Add Larder to your home screen: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
            </p>
            <div className="install-prompt-actions">
              <button onClick={dismiss} className="btn btn-secondary">Got it</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
