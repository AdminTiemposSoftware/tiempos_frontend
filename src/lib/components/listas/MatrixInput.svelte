<script lang="ts">
    type MatrixModificationState = {
        originalValue: number;
        operation: '+' | '-';
        modification: number;
    };

    let {
        mode = '10x10',
        animateKey = $bindable<string | number | null>(null),
        isLoading = $bindable<boolean>(false),
        report = $bindable<{number: number, price: number;}[]>([]),
        interactive = false,
        valueMap = $bindable<Record<number, number>>({}),
        allowModifications = false,
        modificationMap = $bindable<Record<number, MatrixModificationState>>({})
    } = $props();

    let rows = $state(10);
    let columns = $state(10);
    const interactiveInputs = $state<Record<number, HTMLInputElement | null>>({});

    const reportByNumber = $derived(
        report.reduce<Record<number, number>>((acc, item) => {
            acc[item.number] = item.price;
            return acc;
        }, {})
    );

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

    function updateValue(number: number, rawValue: string) {
        const nextValue = rawValue === '' ? undefined : Number(rawValue);
        const nextMap = { ...valueMap };

        if (nextValue === undefined || Number.isNaN(nextValue)) {
            delete nextMap[number];
        } else {
            nextMap[number] = nextValue;
        }

        valueMap = nextMap;
    }

    function getModificationState(index: number): MatrixModificationState {
        const existingEntry = modificationMap[index];

        if (existingEntry) {
            return existingEntry;
        }

        return {
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

    function focusInput(index: number) {
        const target = interactiveInputs[index];

        if (!target) {
            return;
        }

        target.focus();
        target.select();
    }

    function handlePriceKeydown(event: KeyboardEvent, index: number) {
        const row = index % rows;
        const column = Math.floor(index / rows);

        if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            let nextIndex = index;

            if (event.key === 'ArrowUp' && row > 0) {
                nextIndex = index - 1;
            } else if (event.key === 'ArrowDown' && row < rows - 1) {
                nextIndex = index + 1;
            } else if (event.key === 'ArrowLeft' && column > 0) {
                nextIndex = (column - 1) * rows + row;
            } else if (event.key === 'ArrowRight' && column < columns - 1) {
                nextIndex = (column + 1) * rows + row;
            }

            if (nextIndex !== index) {
                event.preventDefault();
                focusInput(nextIndex);
            }

            return;
        }

        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();

        const totalInputs = rows * columns;
        const activeElement = document.activeElement;

        if (!(activeElement instanceof HTMLInputElement) || !activeElement.classList.contains('matrix-price-input')) {
            focusInput(0);
            return;
        }

        const nextIndex = (index + 1) % totalInputs;
        focusInput(nextIndex);
    }

    function getCellValue(index: number) {
        if (interactive) {
            return valueMap[index] ?? 0;
        }

        return reportByNumber[index] ?? 0;
    }

    function getColumnTotal(columnIndex: number) {
        return Array.from({ length: rows }, (_, rowIndex) => getCellValue(columnIndex * rows + rowIndex))
            .reduce((sum, amount) => sum + amount, 0);
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

                            {#if interactive}
                                {#if allowModifications && valueMap[index] !== undefined}
                                    <div class="modification-wrapper">
                                        <input
                                            type="number"
                                            value={valueMap[index] ?? ''}
                                            min="0"
                                            class="price matrix-price-input"
                                            readonly={true}
                                            bind:this={interactiveInputs[index]}
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
                                            value={getModificationState(index).modification ?? ''}
                                            min="0"
                                            class="price matrix-modification-input"
                                            oninput={(event) => updateModification(index, event.currentTarget.value)}
                                        />
                                    </div>
                                {:else}
                                    <input
                                        type="number"
                                        value={valueMap[index] ?? ''}
                                        min="0"
                                        class="price"
                                        bind:this={interactiveInputs[index]}
                                        oninput={(event) => updateValue(index, event.currentTarget.value)}
                                        onkeydown={(event) => handlePriceKeydown(event, index)}
                                    />
                                {/if}
                            {:else}
                                <input
                                    type="number"
                                    class="price"
                                    class:price-loading={isLoading}
                                    value={getCellValue(index)}
                                />
                            {/if}
                        </div>
                    {/each}
                {/each}

                {#each Array.from({ length: columns }) as _, colIndex}
                    <div class="matrix-cell">
                        <input
                            type="number"
                            value={getColumnTotal(colIndex)}
                            disabled
                            class="price"
                            />
                    </div>
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
        gap: 0.35rem;
    }

    .matrix-modification-toggle {
        width: 2rem;
        min-width: 2rem;
        height: 2.2rem;
        border: 1px solid var(--color-border, #d1d5db);
        border-radius: 0.4rem;
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
