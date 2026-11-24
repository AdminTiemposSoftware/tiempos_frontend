<script lang="ts">
    type Matrix = Record<number, number>;

    type MatrixModificationState = {
        number_total_id: number;
        originalValue: number;
        operation: '+' | '-';
        modification: number;
    };

    type OperationItem = {
        id?: unknown;
        operation?: unknown;
        number?: unknown;
        number_total_id?: unknown;
        amount?: unknown;
        date?: unknown;
    };

    import OperationsMatrixModal from './OperationsMatrixModal.svelte';

    let {
        mode = '10x10',
        animateKey = $bindable<string | number | null>(null),
        isLoading = $bindable<boolean>(false),
        valueMap = $bindable<Record<number, number>>({}),
        modificationMap = $bindable<Record<number, MatrixModificationState>>({}),
        operations = [] as OperationItem[],
        showOperationsMatrix = $bindable<boolean>(false),
        allowNegative = false,
        selectedCells = $bindable<Record<number, boolean>>({}),
        selectedBranch = $bindable<string>(''),
        selectedSchedule = $bindable<string>(''),
        drawScheduleNames = $bindable(),
        branchNames = $bindable([]),
        scheduleBranch
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

    function toggleCellSelection(index: number, checked: boolean) {
        selectedCells = { ...selectedCells, [index]: checked };
    }

    function sanitizeNumericInput(input: HTMLInputElement) {
        const sanitizedValue = input.value
            .replace(/[^\d.-]/g, '')
            .replace(/(?!^)-/g, '')
            .replace(/(\..*)\./g, '$1');

        if (input.value !== sanitizedValue) {
            input.value = sanitizedValue;
        }

        return sanitizedValue;
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

    function getColumnTotal(columnIndex: number) {
        return Array.from({ length: rows }, (_, rowIndex) => {
            const index = columnIndex * rows + rowIndex;
            const modification = getModificationState(index);
            const baseValue = valueMap[index] ?? 0;
            const subtraction = allowNegative
                ? modification.modification
                : Math.min(modification.modification, Math.max(0, baseValue));
            const signedModification = modification.operation === '+' ? modification.modification : -subtraction;

            return baseValue + signedModification;
        }).reduce((sum, amount) => sum + amount, 0);
    }

    function focusInput(index: number) {
        const target = modificationInputs[index];

        if (!target) {
            return;
        }

        target.focus();
        target.select();
    }

    function handlePriceKeydown(event: KeyboardEvent, index: number) {
        if (
            !/^\d$/.test(event.key) &&
            !['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'Home', 'End', '.', '-', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) &&
            !(event.ctrlKey || event.metaKey)
        ) {
            event.preventDefault();
            return;
        }

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

    const sortedOperations = $derived(
        [...operations].sort((first, second) => Number(first.number) - Number(second.number))
    );
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
                            <div class="matrix-cell-number">
                                <input
                                    type="checkbox"
                                    checked={selectedCells[index] ?? false}
                                    aria-label={`Seleccionar número ${index}`}
                                    onchange={(event) => toggleCellSelection(index, event.currentTarget.checked)}
                                />
                                 {index}
                            </div>
                            <div class="modification-wrapper">
                                <input
                                    type="number"
                                    value={Math.round(valueMap[index] ?? 0)}
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
                                    inputmode="decimal"
                                    oninput={(event) => updateModification(index, sanitizeNumericInput(event.currentTarget))}
                                    onkeydown={(event) => handlePriceKeydown(event, index)}
                                />
                            </div>
                        </div>
                    {/each}
                {/each}

                {#each Array.from({ length: columns }) as _, colIndex}
                    <div class="matrix-cell">
                        <input
                            type="number"
                            value={Math.round(getColumnTotal(colIndex))}
                            disabled
                            class="price"
                        />
                    </div>
                {/each}
            </div>
        </div>
    {/key}
    <OperationsMatrixModal
        bind:showModal={showOperationsMatrix}
        originalMatrix={valueMap}
        operations={sortedOperations}
        selectedBranch={selectedBranch}
        selectedSchedule={selectedSchedule}
        drawScheduleNames={drawScheduleNames}
        branchNames={branchNames}
        scheduleBranch={scheduleBranch}
    />
</div>

<style>
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
