<script lang="ts">
    import { onMount } from "svelte";
    import { db } from "$lib/srs/srsDb";
    import { getDueKanji } from "$lib/srs/srsLogic";
    import { kanjiData, loadingKanji } from "$lib/stores/kanjiStore";
    import { get } from "svelte/store";

    let totalDue = 0;
    let nextKanji: string[] = [];
    let progressPct = 0;

    let jlptStats: Record<string, { total: number; learned: number }> = {
        N5: { total: 0, learned: 0 },
        N4: { total: 0, learned: 0 },
        N3: { total: 0, learned: 0 },
        N2: { total: 0, learned: 0 },
        N1: { total: 0, learned: 0 },
    };

    const LEARNED_INTERVAL_THRESHOLD = 8; // days

    async function loadStatus() {
        const data = get(kanjiData);
        if (!data) return;

        const allReviews = await db.reviews.toArray();
        const due = await getDueKanji();

        totalDue = due.length;
        nextKanji = due.slice(0, 15); // next kanji to review

        // Count total per JLPT level
        for (const k in data) {
            const jlpt = data[k].jlpt_new;
            if (!jlpt || jlpt < 1 || jlpt > 5) continue;
            jlptStats[`N${jlpt}`].total++;
        }

        // Count learned per JLPT
        for (const r of allReviews) {
            const jlpt = data[r.kanji]?.jlpt_new;
            if (!jlpt || jlpt < 1 || jlpt > 5) continue;
            if (r.interval >= LEARNED_INTERVAL_THRESHOLD) {
                jlptStats[`N${jlpt}`].learned++;
            }
        }

        // Overall progress
        const totalLearnedKanji = Object.values(jlptStats).reduce(
            (acc, stat) => acc + stat.learned,
            0,
        );
        const totalKanji = Object.values(jlptStats).reduce(
            (acc, stat) => acc + stat.total,
            0,
        );
        progressPct =
            totalKanji > 0
                ? Math.round((totalLearnedKanji / totalKanji) * 100)
                : 0;
    }

    onMount(() => {
        const unsubscribe = kanjiData.subscribe(async (data) => {
            if (data) {
                await loadStatus();
                unsubscribe(); // run only once
            }
        });
    });
</script>

<div class="flex flex-col items-center p-4 max-w-xl mx-auto space-y-6">
    {#if $loadingKanji}
        <div class="card w-full preset-filled-surface-100-900 p-6 text-center">
            <p class="text-lg">Loading kanji data...</p>
        </div>
    {:else}
        <!-- Overall Progress -->
        <div class="card w-full preset-filled-surface-100-900 p-6 text-center">
            <h2 class="text-2xl font-bold mb-2">Your Kanji Progress</h2>
            <p class="text-lg mb-4">
                {Object.values(jlptStats).reduce(
                    (acc, s) => acc + s.learned,
                    0,
                )} learned /
                {Object.values(jlptStats).reduce((acc, s) => acc + s.total, 0)} total
            </p>
            <div class="w-full bg-surface-300 h-3 rounded-full overflow-hidden">
                <div
                    class="bg-primary h-full"
                    style="width: {progressPct}%"
                ></div>
            </div>
            <p class="mt-2 text-sm text-surface-500">
                {progressPct}% completed
            </p>
        </div>

        <!-- Reviews Due -->
        <div class="card w-full preset-filled-surface-100-900 p-6 text-center">
            <h3 class="text-xl font-bold mb-4">Reviews Due</h3>
            <p class="text-4xl font-bold">{totalDue}</p>
            {#if totalDue > 0}
                <a
                    href="/review"
                    class="btn variant-filled-primary w-full mt-4"
                >
                    Start Reviews
                </a>
            {/if}
        </div>

        <!-- JLPT Progress Bars -->
        <div class="card w-full preset-filled-surface-100-900 p-6">
            <h3 class="text-xl font-bold mb-4 text-center">
                JLPT Level Breakdown
            </h3>
            <div class="space-y-4">
                {#each Object.entries(jlptStats) as [level, stats]}
                    <div>
                        <div class="flex justify-between mb-1">
                            <strong>{level}</strong>
                            <span>{stats.learned} / {stats.total}</span>
                        </div>
                        <div
                            class="w-full bg-surface-300 h-2 rounded-full overflow-hidden"
                        >
                            <div
                                class="bg-secondary h-full"
                                style="width: {stats.total > 0
                                    ? (stats.learned / stats.total) * 100
                                    : 0}%"
                            ></div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Next Kanji To Review -->
        {#if nextKanji.length > 0}
            <div class="card w-full preset-filled-surface-100-900 p-6">
                <h3 class="text-xl font-bold mb-4 text-center">
                    Next Kanji to Review
                </h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                    {#each nextKanji as k}
                        <div
                            class="card preset-filled-surface-50-800 p-2 text-center"
                        >
                            <div class="text-3xl font-bold mb-1">{k}</div>
                            <div class="text-sm">
                                {$kanjiData[k]?.meanings
                                    ?.slice(0, 2)
                                    .join(", ") ?? "—"}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {/if}
</div>
