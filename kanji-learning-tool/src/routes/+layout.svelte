<script lang="ts">
    import "./layout.css";
    import favicon from "$lib/assets/favicon.svg";
    import { initKanji } from "$lib/srs/init";
    import { onMount } from "svelte";
    import { writable } from "svelte/store";
    import { kanjiData, loadingKanji } from "$lib/stores/kanjiStore";

    // Menu state
    const menuOpen = writable(false);
    function toggleMenu() {
        menuOpen.update((v) => !v);
    }

    const STORAGE_KEY = "kanjiDataCache";

    // Load kanji JSON once
    onMount(async () => {
        loadingKanji.set(true);

        // Try localStorage cache first
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            try {
                kanjiData.set(JSON.parse(cached));
                loadingKanji.set(false);
                return;
            } catch (e) {
                console.warn("Failed to parse cached kanji data", e);
            }
        }

        // Dynamic import JSON
        const module = await import("$lib/data/kanji.json");
        const data = module.default;
        kanjiData.set(data);

        // Cache in localStorage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn("Failed to cache kanji data", e);
        }

        loadingKanji.set(false);
    });

    // Initialize Dexie / SRS after kanji data is loaded
    onMount(() => {
        const unsubscribe = kanjiData.subscribe(async (data) => {
            if (data) {
                const kanjiList = Object.keys(data);
                await initKanji(kanjiList);
                unsubscribe(); // only run once
            }
        });
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<!-- Navigation Bar -->
<header class="bg-surface-900 text-surface-50 shadow-md">
    <div class="max-w-6xl mx-auto flex items-center justify-between p-4">
        <div class="text-2xl font-bold">
            <a href="/">Kanji SRS</a>
        </div>

        <nav class="hidden sm:flex space-x-4">
            <a href="/" class="btn variant-text text-surface-50">Home</a>
            <a href="/review" class="btn variant-text text-surface-50">Review</a
            >
            <a href="/status" class="btn variant-text text-surface-50">Status</a
            >
            <a href="/library" class="btn variant-text text-surface-50"
                >Library</a
            >
        </nav>

        <button
            class="sm:hidden btn variant-text text-surface-50"
            on:click={toggleMenu}>☰</button
        >
    </div>

    {#if $menuOpen}
        <div class="sm:hidden bg-surface-800">
            <a href="/" class="block p-3 border-b border-surface-700">Home</a>
            <a href="/review" class="block p-3 border-b border-surface-700"
                >Review</a
            >
            <a href="/status" class="block p-3 border-b border-surface-700"
                >Status</a
            >
            <a href="/library" class="block p-3 border-b border-surface-700"
                >Library</a
            >
        </div>
    {/if}
</header>

{#if $loadingKanji}
    <div class="card p-6 text-center max-w-md mx-auto">
        Loading kanji data...
    </div>
{:else}
    <slot />
{/if}
