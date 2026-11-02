"use client";

import { useCallback, useState } from "react";
import { askTutor } from "../api";

export function useAskTutor() {
  const [state, setState] = useState("idle");
  const [answer, setAnswer] = useState(null);

  const ask = useCallback(async (question) => {
    const trimmed = question.trim();
    if (!trimmed) {
      return false;
    }

    setState("sending");
    try {
      const reply = await askTutor(trimmed);
      setAnswer(reply.answer);
      setState("idle");
      return true;
    } catch {
      setState("error");
      return false;
    }
  }, []);

  return { ask, answer, state };
}
