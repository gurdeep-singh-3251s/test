"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";

export function useAdminList<T>(storeId: string, resource: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setError("");
      setData(await adminApi.list<T>(storeId, resource));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [storeId, resource]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function create(body: unknown) {
    setBusy(true);
    try {
      await adminApi.create(storeId, resource, body);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: unknown) {
    setBusy(true);
    try {
      await adminApi.patch(storeId, resource, id, body);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return { data, error, busy, reload, create, patch };
}
