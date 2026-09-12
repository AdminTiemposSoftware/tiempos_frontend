<script lang="ts">
    type MatrixModificationState = {
        number_total_id: number;
        originalValue: number;
        operation: '+' | '-';
        modification: number;
    };

    let {
        mode = '10x10',
        animateKey = $bindable<string | number | null>(null),
        isLoading = $bindable<boolean>(false),
        valueMap = $bindable<Record<number, number>>({}),
        modificationMap = $bindable<Record<number, MatrixModificationState>>({})
    } = $props();

    let rows = $state(10);
    let columns = $state(10);
    const modificationInputs = $state<Record<number, HTMLInputElement | null>>({});

    $effect(() => {
        if (mode === '10x10') {
            rows = 10;
            columns = 10;
        } else if (mode === '5x20') {
            rows = 5;
            columns = 20;
        } else if (mode === '20x5') {
            rows = 20;
            columns = 5;
        }
    });

    function getModificationState(index: number): MatrixModificationState {
        const existingEntry = modificationMap[index];

        if (existingEntry) {
            return existingEntry;
        }

        return {
            number_total_id: 0,
            originalValue: valueMap[index] ?? 0,
            operation: '+',
            modification: 0,
        };
    }

    function updateModification(index: number, rawValue: string) {
        const nextModification = rawValue === '' ? 0 : Number(rawValue);
        const nextMap = { ...modificationMap };
        const existingEntry = getModificationState(index);

        nextMap[index] = {
            ...existingEntry,
            modification: Number.isFinite(nextModification) ? nextModification : 0,
        };

        modificationMap = nextMap;
    }

    function toggleModification(index: number) {
        const nextMap = { ...modificationMap };
        const existingEntry = getModificationState(index);

        nextMap[index] = {
            ...existingEntry,
            operation: existingEntry.operation === '+' ? '-' : '+',
        };

        modificationMap = nextMap;
    }

</script>

<div class="matrix-container">
    {#key animateKey}
        <div class="matrix-wrapper">
            {#if isLoading}
                <div class="matrix-spinner" aria-label="Loading" role="status">
                    <div class="spinner"></div>
                </div>
            {/if}

            <div class="matrix" style="--cols: {columns}">
                {#each Array.from({ length: rows }) as _, rowIndex}
                    {#each Array.from({ length: columns }) as _, colIndex}
                        {@const index = colIndex * rows + rowIndex}
                        <div class="matrix-cell">
                            <input type="number" value={index} disabled={true} />
                            <div class="modification-wrapper">
                                <input
                                    type="number"
                                    value={valueMap[index] ?? 0}
                                    class="price matrix-price-input"
                                    readonly={true}
                                    disabled={true}
                                />
                                <button
                                    type="button"
                                    class="matrix-modification-toggle"
                                    onclick={() => toggleModification(index)}
                                >
                                    {getModificationState(index).operation}
                                </button>
                                <input
                                    type="number"
                                    value={getModificationState(index).modification === 0 ? '' : getModificationState(index).modification}
                                    class="price matrix-modification-input"
                                    bind:this={modificationInputs[index]}
                                    oninput={(event) => updateModification(index, event.currentTarget.value)}
                                />
                            </div>
                        </div>
                    {/each}
                {/each}

            </div>
        </div>
    {/key}
</div>

<style>
    .matrix-container {
        flex: 5;
    }

    .modification-wrapper {
        display: flex;
        align-items: center;
    }

    .matrix-modification-toggle {
        width: 2rem;
        min-width: 2rem;
        height: 2.2rem;
        border: 1px solid var(--color-border, #d1d5db);
        background: var(--color-box-background, #f9fafb);
        color: var(--color-text, #111827);
        font-weight: 700;
        cursor: pointer;
    }

    .matrix-price-input {
        background: var(--color-box-background) !important;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
