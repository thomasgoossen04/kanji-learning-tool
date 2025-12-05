<script lang="ts">
    import { onMount } from "svelte";
    import { db } from "$lib/srs/srsDb";
    import { kanjiData, loadingKanji } from "$lib/stores/kanjiStore";
    import type { KanjiData, KanjiEntry } from "$lib/types/kanji";
    import { get } from "svelte/store";

    type KanjiStatus = {
        kanji: string;
        data: KanjiEntry;
        review?: {
            interval: number;
            nextReview: number;
            lastResult: "correct" | "incorrect";
        };
    };

    let allKanji: KanjiStatus[] = [];
    let filteredKanji: KanjiStatus[] = [];

    // Search & filter state
    let search = "";
    let filterJLPT: string | null = null;
    let filterStatus: "all" | "learned" | "due" | "not-reviewed" = "all";

    const LEARNED_INTERVAL_THRESHOLD = 8; // days

    // Pagination state
    let currentPage = 1;
    const PAGE_SIZE = 100; // render 100 rows per page

    async function loadKanji() {
        const data = get(kanjiData) as KanjiData | null;
        if (!data) return;

        const reviews = await db.reviews.toArray();

        //@ts-ignore
        allKanji = Object.entries(data).map(([k, d]) => {
            const review = reviews.find((r) => r.kanji === k);
            return { kanji: k, data: d, review };
        });

        allKanji.sort((a, b) => {
            const jlptA = a.data.jlpt_new ?? 6;
            const jlptB = b.data.jlpt_new ?? 6;
            if (jlptA !== jlptB) return jlptA - jlptB;
            return (a.data.wk_level ?? 100) - (b.data.wk_level ?? 100);
        });

        filteredKanji = allKanji;
    }

    onMount(() => {
        const unsubscribe = kanjiData.subscribe(async (data) => {
            if (data) {
                await loadKanji();
                unsubscribe();
            }
        });
    });

    function formatNextReview(timestamp?: number) {
        if (!timestamp) return "-";
        const diff = timestamp - Date.now();
        if (diff <= 0) return "Due now";
        const hours = Math.ceil(diff / (1000 * 60 * 60));
        return `In ${hours}h`;
    }

    $: filteredKanji = allKanji.filter((k) => {
        // Search by kanji or meanings
        const matchesSearch =
            search === "" ||
            k.kanji.includes(search) ||
            k.data.meanings?.some((m) =>
                m.toLowerCase().includes(search.toLowerCase()),
            );

        const matchesJLPT = !filterJLPT || `N${k.data.jlpt_new}` === filterJLPT;

        let matchesStatus = true;
        if (filterStatus === "learned") {
            //@ts-ignore
            matchesStatus = k.review?.interval >= LEARNED_INTERVAL_THRESHOLD;
        } else if (filterStatus === "due") {
            matchesStatus =
                k.review?.nextReview !== undefined &&
                k.review?.nextReview <= Date.now();
        } else if (filterStatus === "not-reviewed") {
            matchesStatus = !k.review;
        }

        return matchesSearch && matchesJLPT && matchesStatus;
    });

    // Pagination helpers
    $: totalPages = Math.ceil(filteredKanji.length / PAGE_SIZE);
    $: paginatedKanji = filteredKanji.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    function goPrev() {
        if (currentPage > 1) currentPage--;
    }
    function goNext() {
        if (currentPage < totalPages) currentPage++;
    }
</script>

<div class="p-4 max-w-6xl mx-auto space-y-6">
    <h1 class="text-3xl font-bold text-center mb-4">Kanji Library</h1>

    {#if $loadingKanji}
        <div class="card p-6 text-center max-w-md mx-auto">
            Loading kanji data...
        </div>
    {:else}
        <!-- Search & Filters -->
        <div class="flex flex-col sm:flex-row gap-2 mb-4 items-center">
            <input
                type="text"
                placeholder="Search by kanji or meaning"
                bind:value={search}
                class="input w-full sm:w-1/2"
            />
            <select bind:value={filterJLPT} class="select w-full sm:w-1/4">
                <option value="">All JLPT</option>
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
            </select>
            <select bind:value={filterStatus} class="select w-full sm:w-1/4">
                <option value="all">All</option>
                <option value="learned">Learned</option>
                <option value="due">Due</option>
                <option value="not-reviewed">Not Reviewed</option>
            </select>
        </div>

        <!-- Kanji Table -->
        <div class="overflow-x-auto">
            <table
                class="w-full border border-surface-300 rounded-md table-auto"
            >
                <thead class="bg-surface-200">
                    <tr class="text-left">
                        <th class="p-2 border-b">Kanji</th>
                        <th class="p-2 border-b">Meanings</th>
                        <th class="p-2 border-b">Onyomi</th>
                        <th class="p-2 border-b">Kunyomi</th>
                        <th class="p-2 border-b">JLPT</th>
                        <th class="p-2 border-b">WaniKani</th>
                        <th class="p-2 border-b">Review Status</th>
                    </tr>
                </thead>
                <tbody>
                    {#each paginatedKanji as { kanji, data, review }}
                        <tr class="hover:bg-surface-100">
                            <td class="p-2 text-2xl font-bold">{kanji}</td>
                            <td class="p-2"
                                >{data.meanings?.join(", ") ?? "-"}</td
                            >
                            <td class="p-2"
                                >{data.readings_on?.join(", ") ?? "-"}</td
                            >
                            <td class="p-2"
                                >{data.readings_kun?.join(", ") ?? "-"}</td
                            >
                            <td class="p-2">{data.jlpt_new ?? "-"}</td>
                            <td class="p-2">{data.wk_level ?? "-"}</td>
                            <td class="p-2">
                                {#if review}
                                    Last: {review.lastResult}<br />
                                    Interval: {review.interval ?? "-"}d<br />
                                    {formatNextReview(review.nextReview)}
                                {:else}
                                    Not reviewed
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <!-- Pagination Controls -->
        {#if totalPages > 1}
            <div class="flex justify-center items-center gap-4 mt-4">
                <button
                    class="btn variant-filled-primary"
                    on:click={goPrev}
                    disabled={currentPage === 1}>Prev</button
                >
                <span>Page {currentPage} / {totalPages}</span>
                <button
                    class="btn variant-filled-primary"
                    on:click={goNext}
                    disabled={currentPage === totalPages}>Next</button
                >
            </div>
        {/if}
    {/if}
</div>
