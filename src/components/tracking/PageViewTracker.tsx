"use client";

import { useEffect } from "react";
import { logPageView } from "@/app/actions/tracking";

export default function PageViewTracker() {
  useEffect(() => {
    const path = window.location.pathname;
    const referrer = document.referrer || undefined;

    // Debounce: don't log if same path was logged in last 5 seconds
    const storageKey = `pv_last_${path}`;
    const lastLogged = sessionStorage.getItem(storageKey);
    const now = Date.now();

    if (lastLogged && now - parseInt(lastLogged, 10) < 5000) {
      return;
    }

    sessionStorage.setItem(storageKey, now.toString());
    logPageView(path, referrer);
  }, []);

  return null;
}
