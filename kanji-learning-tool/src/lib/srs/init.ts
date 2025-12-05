import { db } from '$lib/srs/srsDb';

export async function initKanji(kanjiList: string[]) {
    const existing = await db.reviews.toArray();
    const existingSet = new Set(existing.map(x => x.kanji));
    const now = Date.now();

    const newEntries = kanjiList
        .filter(k => !existingSet.has(k))
        .map(k => ({
            kanji: k,
            interval: 1,
            nextReview: now,
            lastResult: null
        }));

    if (newEntries.length > 0) {
        await db.reviews.bulkAdd(newEntries);
    }
}