<script lang="ts">
    let {
        mode = '10x10',
        animateKey = $bindable<string | number | null>(null),
        isLoading = $bindable<boolean>(false),
        valueMap = $bindable<Record<number, number>>({})
    } = $props();

    let rows = $state(10);
    let columns = $state(10);
    const interactiveInputs = $state<Record<number, HTMLInputElement | null>>({});

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

            event.preventDefault();

            if (nextIndex !== index) {
                focusInput(nextIndex);
            }

            return;
        }

        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        focusInput((index + 1) % (rows * columns));
    }

    function getColumnTotal(columnIndex: number) {
        return Array.from({ length: rows }, (_, rowIndex) => {
            const index = columnIndex * rows + rowIndex;
            return valueMap[index] ?? 0;
        }).reduce((sum, amount) => sum + amount, 0);
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
                            <input
                                type="number"
                                value={valueMap[index] ?? ''}
                                class="price"
                                bind:this={interactiveInputs[index]}
                                oninput={(event) => updateValue(index, event.currentTarget.value)}
                                onkeydown={(event) => handlePriceKeydown(event, index)}
                            />
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

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
