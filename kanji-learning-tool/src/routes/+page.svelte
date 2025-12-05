<script lang="ts">
    import { onMount } from "svelte";
    import { getDueKanji } from "$lib/srs/srsLogic";

    let dueCount = 0;

    onMount(async () => {
        const due = await getDueKanji();
        dueCount = due.length;
    });
</script>

<div
    class="flex flex-col items-center justify-center min-h-screen p-4 space-y-6"
>
    <!-- Welcome Card -->
    <div class="card preset-filled-surface-100-900 p-6 text-center">
        <h1 class="text-3xl font-bold mb-2">Kanji SRS</h1>
        <p class="text-lg text-surface-500 mb-4">
            Practice kanji with a spaced repetition system right in your
            browser!
        </p>

        {#if dueCount > 0}
            <p class="text-md mb-4">
                You have <strong>{dueCount}</strong> kanji due for review.
            </p>
        {:else}
            <p class="text-md mb-4">No kanji due. Keep up the good work! 🎉</p>
        {/if}

        <div class="flex flex-col gap-3 sm:flex-row justify-center">
            <button type="button" class="btn preset-filled">
                <a
                    href="/review"
                    class="btn variant-filled-primary w-full sm:w-auto"
                >
                    {dueCount > 0 ? "Start Reviews" : "Review Kanji"}
                </a>
            </button>

            <button type="button" class="btn preset-filled">
                <a
                    href="/status"
                    class="btn variant-filled-secondary w-full sm:w-auto"
                >
                    View Progress
                </a>
            </button>

            <button type="button" class="btn preset-filled">
                <a
                    href="/library"
                    class="btn variant-filled-secondary w-full sm:w-auto"
                >
                    Kanji Library
                </a>
            </button>
        </div>
    </div>
</div>
