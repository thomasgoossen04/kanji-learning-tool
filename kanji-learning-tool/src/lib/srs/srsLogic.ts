import { db, type KanjiReview } from '$lib/srs/srsDb';
import kanjiData from '$lib/data/kanji.json';
import type { KanjiData } from '$lib/types/kanji';

const KD = kanjiData as unknown as KanjiData;

export async function getReview(kanji: string): Promise<KanjiReview | undefined> {
    return db.reviews.get(kanji);
}

export async function getDueKanji(): Promise<string[]> {
    const now = Date.now();

    const dueReviews = await db.reviews
        .where('nextReview')
        .belowOrEqual(now)
        .toArray();

    const due = dueReviews
        .map(r => ({
            kanji: r.kanji,
            jlpt: KD[r.kanji]?.jlpt_new ?? null
        }))
        // Exclude kanji with no JLPT level (optional)
        .filter(k => k.jlpt !== null)
        // Sort smallest JLPT numbers last (because N5 = 5)
        .sort((a, b) => b.jlpt! - a.jlpt!);

    return due.map(k => k.kanji);
}

export async function markReview(kanji: string, result: 'correct' | 'incorrect') {
    const now = Date.now();

    const existing = await db.reviews.get(kanji);

    let interval = existing?.interval ?? 1;

    if (result === 'correct') {
        interval = interval * 2;
    } else {
        interval = 1;
    }

    //days → ms
    const nextReview = now + interval * 86400_000;

    const update: KanjiReview = {
        kanji,
        interval,
        nextReview,
        lastResult: result
    };

    await db.reviews.put(update);
}