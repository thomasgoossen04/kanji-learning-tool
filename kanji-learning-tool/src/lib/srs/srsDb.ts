import Dexie, { type Table } from 'dexie';

export interface KanjiReview {
    kanji: string; //primary key
    nextReview: number; //in ms
    interval: number; //in days
    lastResult: 'correct' | 'incorrect' | null;
}

export class SrsDb extends Dexie {
    reviews!: Table<KanjiReview, string>;

    constructor() {
        super('kanji-srs-db');

        this.version(1).stores({
            reviews: '&kanji, nextReview, interval'
        });
    }
}

export const db = new SrsDb();