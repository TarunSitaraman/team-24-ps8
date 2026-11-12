"use client";

import { useEffect, useState } from "react";

/** Loads JSON from one of our API routes. Reloads when `url` or `refreshKey` changes. */
export function useApi<T>(url: string, refreshKey = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(url, { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Could not load data");
        if (active) {
          setData(body as T);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [url, refreshKey]);

  return { data, error, loading };
}
