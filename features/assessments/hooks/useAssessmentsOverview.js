"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAssessmentsOverview } from "../api";

export function useAssessmentsOverview() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchAssessmentsOverview(controller.signal)
      .then((overview) => {
        setData(overview);
        setStatus("success");
      })
      .catch((error) => {
        if (error?.name === "AbortError") {
          return;
        }
        setStatus("error");
      });

    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);

  return { data, status, retry };
}
