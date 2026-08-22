<script lang="ts">
    import { TrashBinSolid, CubeSolid, QuestionCircleSolid } from "flowbite-svelte-icons";

    let {
        sold,
        randomCount = $bindable(),
        randomCountInput = $bindable(),
        priceValue = $bindable(),
        priceInput = $bindable(),
        updateSalesData,
    } = $props();

    function generateRandomNumbers() {
        if (!priceValue.trim()) {
            randomCountInput?.focus();
            randomCountInput?.select();
            return;
        }

        const price = parseInt(priceValue.replace(/\./g, ''), 10);
        if (!price || Number.isNaN(price)) {
            priceInput?.focus();
            return;
        }

        const rawCount = Number(randomCount);
        const requestedCount = Math.min(100, Math.max(1, Number.isFinite(rawCount) ? Math.floor(rawCount) : 1));
        const existingNumbers = new Set(Object.keys(sold).map((num) => parseInt(num, 10)));
        const pool = Array.from({ length: 100 }, (_, i) => i).filter(
            (num) => !existingNumbers.has(num)
        );
        if (pool.length === 0) {
            return;
        }

        const count = Math.min(requestedCount, pool.length);
        const numbers: string[] = [];

        for (let i = 0; i < count; i++) {
            const index = Math.floor(Math.random() * pool.length);
            const picked = pool.splice(index, 1)[0];
            numbers.push(String(picked).padStart(2, "0"));
        }

        updateSalesData(numbers, price);
        priceInput?.focus();
        priceValue = '';
        randomCount = 1;
    }

    function generatePairs() {
        if (!priceValue.trim()) {
            priceInput?.focus();
            return;
        }

        const price = parseInt(priceValue.replace(/\./g, ''), 10);
        if (!price || Number.isNaN(price)) {
            return;
        }

        const pairNumbers = Array.from({ length: 10 }, (_, i) => String(i * 11));
        if (pairNumbers.length === 0) {
            return;
        }

        updateSalesData(pairNumbers, price);
    }

    function cleanSell() {
        if (Object.keys(sold).length === 0) {
            return;
        }
        sold = {};
    }

    function handleKeyDown(event: KeyboardEvent) {
        switch (event.key) {
            case "p":
            case "P":
                //TODO : Pares button
                generatePairs();
                break;
            case "l":
            case "L":
                // Limpiar button
                cleanSell();
                break;
            case "i":
            case "I":
                generateRandomNumbers();
                // Limpiar inputs
                //
                break;
        }
    }
</script>

<svelte:window onkeydown={handleKeyDown} />
<div class="buttons-group">
    <button
        onclick={cleanSell}
        disabled={Object.keys(sold).length === 0}
    >
        <TrashBinSolid class="shrink-0 h-4 w-4" />
        <div class="button-name"><p>L</p>impiar</div>
    </button>
    <button onclick={generatePairs}>
        <CubeSolid class="shrink-0 h-4 w-4" />
        <div class="button-name"><p>P</p>ares</div>
    </button>
    <div class="random-controls">
        <button onclick={generateRandomNumbers}>
            <QuestionCircleSolid class="shrink-0 h-4 w-4" />
            <div class="button-name">Aleator<p>i</p>o</div>
        </button>
        <input
            class="random-count"
            id="random-count"
            type="number"
            min="1"
            max="100"
            step="1"
            bind:value={randomCount}
            bind:this={randomCountInput}
            aria-label="Cantidad de aleatorios"
        />
    </div>
</div>

<style>
    .random-controls {
        display: flex;
        gap: 0.5rem;
        border-radius: 0.25rem;
        background-color: var(--color-theme-1);
        padding: 0.5rem 1rem;
        flex:1;
    }

    .random-controls button {
        flex: 1;
        background: none;
        padding: 0;
    }

    .random-controls input {
        width: 2rem;
        padding: 0rem;
        text-align: center;
    }
</style>
