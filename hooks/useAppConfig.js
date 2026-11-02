"use client";

import { useEffect, useState } from "react";
import { fetchAppConfig } from "@/lib/appConfig";

export function useAppConfig() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchAppConfig()
      .then((appConfig) => {
        if (active) setConfig(appConfig);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError?.message || "Could not load application settings.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { config, error, loading };
}
