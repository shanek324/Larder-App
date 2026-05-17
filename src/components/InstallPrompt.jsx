import { useEffect, useState } from "react";

const DISMISS_KEY = "larder:install-prompt-dismissed";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
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
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Android / Chrome: catch the install prompt event
    function handler(e) {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    }
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show a manual hint once
    if (isIOS()) setIosHint(true);

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
