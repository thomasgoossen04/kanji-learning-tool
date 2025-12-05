import { writable } from "svelte/store";
import type { KanjiData } from "$lib/types/kanji";

export const kanjiData = writable<KanjiData | null>(null);
export const loadingKanji = writable(true);