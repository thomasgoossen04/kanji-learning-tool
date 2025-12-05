<script lang="ts">
    import { onMount } from "svelte";
    import { getDueKanji, markReview } from "$lib/srs/srsLogic";
    import { kanjiData, loadingKanji } from "$lib/stores/kanjiStore";
    import { get } from "svelte/store";

    let queue: string[] = [];
    let current: string | null = null;
    let showAnswer = false;

    // Load the due kanji once the JSON is ready
    async function loadQueue() {
        queue = await getDueKanji();
        current = queue[0] ?? null;
        showAnswer = false;
    }

    onMount(() => {
        // Wait for kanji data to load
        const unsubscribe = kanjiData.subscribe(async (data) => {
            if (data) {
                await loadQueue();
                unsubscribe();
            }
        });
    });

    async function answer(result: "correct" | "incorrect") {
        if (!current) return;

        await markReview(current, result);
        await loadQueue();
    }
</script>

<div class="flex flex-col items-center justify-center min-h-screen p-4">
    {#if $loadingKanji}
        <div
            class="card w-full max-w-md preset-filled-surface-100-900 p-6 text-center"
        >
            <p class="text-lg">Loading kanji data...</p>
        </div>
    {:else if !current}
        <div
            class="card w-full max-w-md preset-filled-surface-100-900 p-6 text-center"
        >
            <h2 class="text-xl font-bold mb-2">No Reviews Due</h2>
            <p>You're all caught up! 🎉</p>
        </div>
    {:else}
        <div class="card w-full max-w-md preset-filled-surface-100-900 p-6">
            <!-- Kanji Display -->
            <div class="text-center mb-6">
                <div class="text-8xl font-bold">{current}</div>
            </div>

            {#if !showAnswer}
                <button
                    type="button"
                    class="btn variant-filled-primary w-full mt-2"
                    on:click={() => (showAnswer = true)}
                >
                    Show Answer
                </button>
            {:else}
                <div class="space-y-2 mb-4">
                    <p>
                        <strong>Meanings:</strong>
                        {$kanjiData[current]?.meanings?.join(", ") ?? "—"}
                    </p>
                    <p>
                        <strong>Onyomi:</strong>
                        {$kanjiData[current]?.readings_on?.join(", ") ?? "—"}
                    </p>
                    <p>
                        <strong>Kunyomi:</strong>
                        {$kanjiData[current]?.readings_kun?.join(", ") ?? "—"}
                    </p>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        class="btn variant-filled-success w-full"
                        on:click={() => answer("correct")}
                    >
                        Correct
                    </button>
                    <button
                        type="button"
                        class="btn variant-filled-error w-full"
                        on:click={() => answer("incorrect")}
                    >
                        Incorrect
                    </button>
                </div>
            {/if}
        </div>
    {/if}
</div>
