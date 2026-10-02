<script lang="ts">
    type Matrix = Record<number, number>;

    type OperationItem = {
        operation?: unknown;
        number?: unknown;
        amount?: unknown;
    };

    let {
        originalMatrix = {},
        operations = [],
        showModal = $bindable(false)
    } = $props<{
        originalMatrix?: Matrix;
        operations?: OperationItem[];
        showModal?: boolean;
    }>();

    function getOperationSign(operation: unknown) {
        const normalized = String(operation ?? '').trim().toLowerCase();
        return normalized === '-' || normalized === 'sub' || normalized === 'subtract' ? -1 : 1;
    }

    function amount(matrix: Matrix, number: number) {
        return Number.isFinite(matrix[number]) ? matrix[number] : 0;
    }

    const summedOperations = $derived.by(() => {
        const totals: Matrix = {};

        for (const item of operations) {
            const number = Number(item.number);
            const operationAmount = Number(item.amount);

            if (!Number.isInteger(number) || number < 0 || number >= 100 || !Number.isFinite(operationAmount)) {
                continue;
            }

            totals[number] = (totals[number] ?? 0) + getOperationSign(item.operation) * operationAmount;
        }

        return totals;
    });

    function columnTotal(matrix: Matrix, columnIndex: number) {
        return Array.from({ length: 20 }, (_, rowIndex) => amount(matrix, columnIndex * 20 + rowIndex))
            .reduce((total, value) => total + value, 0);
    }

    function close() {
        showModal = false;
    }
</script>

{#if showModal}
    <div
        class="modal-backdrop"
        role="button"
        tabindex="0"
        onclick={close}
        onkeydown={(event) => event.key === 'Escape' && close()}
    >
        <div
            class="modal"
            onclick={(event) => event.stopPropagation()}
            role="presentation"
            aria-labelledby="operations-matrix-title"
        >
            <h2 id="operations-matrix-title">Operaciones realizadas</h2>

            <div class="operations-comparison">
                <div class="matrix-wrapper">
                    <h3>Lista original</h3>
                    <div class="matrix" aria-label="Lista original" style="--cols: {5}">
                        {#each Array.from({ length: 20 }) as _, rowIndex}
                            {#each Array.from({ length: 5 }) as _, columnIndex}
                                {@const number = columnIndex * 20 + rowIndex}
                                <div class="matrix-cell">
                                    <input type="number" value={number} disabled />
                                    <input type="number" class="price" value={amount(originalMatrix, number)} disabled />
                                </div>
                            {/each}
                        {/each}
                        {#each Array.from({ length: 5 }) as _, columnIndex}
                            <div class="matrix-cell operations-total-cell">
                                <span aria-hidden="true"></span>
                                <input type="number" class="price" value={columnTotal(originalMatrix, columnIndex)} disabled />
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="matrix-wrapper">
                    <h3>Operaciones</h3>
                    <div class="matrix" aria-label="Operaciones sumadas" style="--cols: {5}">
                        {#each Array.from({ length: 20 }) as _, rowIndex}
                            {#each Array.from({ length: 5 }) as _, columnIndex}
                                {@const number = columnIndex * 20 + rowIndex}
                                <div class="matrix-cell">
                                    <input type="number" value={number} disabled />
                                    <input type="number" class="price" value={amount(summedOperations, number)} disabled />
                                </div>
                            {/each}
                        {/each}
                        {#each Array.from({ length: 5 }) as _, columnIndex}
                            <div class="matrix-cell">
                                <span aria-hidden="true"></span>
                                <input type="number" class="price" value={columnTotal(summedOperations, columnIndex)} disabled />
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal {
        width: 70vw;
        max-height: 93vh;
        overflow: auto;
        box-sizing: border-box;
    }

    .operations-comparison {
        display: flex;
        flex-direction: row;
        gap: 1rem;
    }

    .matrix-wrapper, .matrix {
        width: 100%;
    }
</style>
