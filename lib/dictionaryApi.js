import { API_BASE_URL } from "./config";
import { authHeaders } from "@/lib/session";

const SEARCH_PATH = process.env.NEXT_PUBLIC_DICTIONARY_SEARCH_PATH;

export async function searchWord(query) {
  const res = await fetch(new URL(SEARCH_PATH, API_BASE_URL).toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify({ query }),
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Dictionary request failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  const entry = data.entry ?? data.result ?? data;
  const definition =
    entry.definition ??
    entry.meaning ??
    entry.simple_definition ??
    entry.content_text ??
    "";

  if (!definition) {
    return null;
  }

  return {
    word: entry.word ?? query,
    phonetic: entry.phonetic ?? "",
    partOfSpeech: entry.partOfSpeech ?? entry.part_of_speech ?? "",
    definition,
    example: entry.example ?? "",
    synonyms: entry.synonyms ?? [],
  };
}
