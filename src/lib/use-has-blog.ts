"use client";

import { useEffect, useState } from "react";

/**
 * True once at least one blog post has been released. The navigation reads it
 * so the Blog link shows up on a post's release date and goes away if none
 * are out, with no deploy. The answer comes from /api/blog/status, which
 * checks the posts on every call. One request is shared by every nav on the
 * page, and a new page load asks again.
 */
let pending: Promise<boolean> | null = null;

function loadStatus(): Promise<boolean> {
  if (!pending) {
    pending = fetch("/api/blog/status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { hasBlog: false }))
      .then((data) => data?.hasBlog === true)
      .catch(() => false);
  }
  return pending;
}

export function useHasBlog(): boolean {
  const [hasBlog, setHasBlog] = useState(false);

  useEffect(() => {
    let alive = true;
    loadStatus().then((value) => {
      if (alive) setHasBlog(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  return hasBlog;
}
