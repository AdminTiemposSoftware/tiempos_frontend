<script lang="ts">
    import ExportModal from './ExportModal.svelte';

    type Matrix = Record<number, number>;

    type OperationItem = {
        operation?: unknown;
        number?: unknown;
        amount?: unknown;
    };

    let {
        originalMatrix = {},
        operations = [],
        showModal = $bindable(false),
        selectedBranch,
        selectedSchedule,
        drawScheduleNames,
        branchNames,
        scheduleBranch,
    } = $props<{
        originalMatrix?: Matrix;
        operations?: OperationItem[];
        showModal?: boolean;
    }>();

    const exportDate = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().split('T')[0];
    let showCurrentExport = $state(false);
    let showOperationsExport = $state(false);
    let showOriginalExport = $state(false);
    let showRecorteExport = $state(false);

    function getOperationSign(operation: unknown) {
        const normalized = String(operation ?? '').trim().toLowerCase();
        return normalized === '-' || normalized === 'sub' || normalized === 'subtract' ? -1 : 1;
    }

    function amount(matrix: Matrix, number: number) {
        return Number.isFinite(matrix[number]) ? matrix[number] : 0;
    }

    function displayAmount(matrix: Matrix, number: number) {
        return Math.round(amount(matrix, number));
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

    const revertedMatrix = $derived.by(() => {
        const matrix: Matrix = {};

        for (let number = 0; number < 100; number += 1) {
            const currentValue = amount(originalMatrix, number);
            const operationTotal = amount(summedOperations, number);

            matrix[number] = currentValue - operationTotal;
        }

        return matrix;
    });

    const recorteMatrix = $derived.by(() => {
        const matrix: Matrix = {};

        for (let number = 0; number < 100; number += 1) {
            matrix[number] = amount(revertedMatrix, number) - amount(originalMatrix, number);
        }

        return matrix;
    });

    function columnTotal(matrix: Matrix, columnIndex: number) {
        return Array.from({ length: 20 }, (_, rowIndex) => amount(matrix, columnIndex * 20 + rowIndex))
            .reduce((total, value) => total + value, 0);
    }

    function displayColumnTotal(matrix: Matrix, columnIndex: number) {
        return Math.round(columnTotal(matrix, columnIndex));
    }

    function matrixTotal(matrix: Matrix) {
        return Array.from({ length: 100 }, (_, number) => amount(matrix, number))
            .reduce((total, value) => total + value, 0);
    }

    function openExport(exportType: 'current' | 'operations' | 'original' | 'recorte') {
        showModal = false;
        showCurrentExport = exportType === 'current';
        showOperationsExport = exportType === 'operations';
        showOriginalExport = exportType === 'original';
        showRecorteExport = exportType === 'recorte';
    }

    function close() {
        showModal = false;
    }
</script>

<ExportModal
    bind:showModal={showCurrentExport}
    data={originalMatrix}
    dateFrom={exportDate}
    dateTo={exportDate}
    total={matrixTotal(originalMatrix)}
    puestos={[selectedBranch]}
    sorteos={[selectedSchedule]}
    drawScheduleNames={drawScheduleNames}
    branchNames={branchNames}
    scheduleBranch={scheduleBranch}
/>
<ExportModal
    bind:showModal={showOperationsExport}
    data={summedOperations}
    dateFrom={exportDate}
    dateTo={exportDate}
    total={matrixTotal(summedOperations)}
    puestos={[selectedBranch]}
    sorteos={[selectedSchedule]}
    drawScheduleNames={drawScheduleNames}
    branchNames={branchNames}
    scheduleBranch={scheduleBranch}
/>
<ExportModal
    bind:showModal={showOriginalExport}
    data={revertedMatrix}
    dateFrom={exportDate}
    dateTo={exportDate}
    total={matrixTotal(revertedMatrix)}
    puestos={[selectedBranch]}
    sorteos={[selectedSchedule]}
    drawScheduleNames={drawScheduleNames}
    branchNames={branchNames}
    scheduleBranch={scheduleBranch}
/>
<ExportModal
    bind:showModal={showRecorteExport}
    data={recorteMatrix}
    dateFrom={exportDate}
    dateTo={exportDate}
    total={matrixTotal(recorteMatrix)}
    puestos={[selectedBranch]}
    sorteos={[selectedSchedule]}
    drawScheduleNames={drawScheduleNames}
    branchNames={branchNames}
    scheduleBranch={scheduleBranch}
/>

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
                    <div class="matrix-heading">
                        <h3>Recorte</h3>
                        <button type="button" onclick={() => openExport('recorte')}>Exportar</button>
                    </div>
                    <div class="matrix" aria-label="Recorte: Original menos Lista actual" style="--cols: {5}">
                        {#each Array.from({ length: 20 }) as _, rowIndex}
                            {#each Array.from({ length: 5 }) as _, columnIndex}
                                {@const number = columnIndex * 20 + rowIndex}
                                <div class="matrix-cell">
                                    <input type="number" value={number} disabled />
                                    <input type="number" class="price" value={displayAmount(recorteMatrix, number)} disabled />
                                </div>
                            {/each}
                        {/each}
                        {#each Array.from({ length: 5 }) as _, columnIndex}
                            <div class="matrix-cell operations-total-cell">
                                <span aria-hidden="true"></span>
                                <input type="number" class="price" value={displayColumnTotal(recorteMatrix, columnIndex)} disabled />
                            </div>
                        {/each}
                    </div>
                </div>
                <div class="matrix-wrapper">
                    <div class="matrix-heading">
                        <h3>Lista actual</h3>
                        <button type="button" onclick={() => openExport('current')}>Exportar</button>
                    </div>
                    <div class="matrix" aria-label="Lista actual" style="--cols: {5}">
                        {#each Array.from({ length: 20 }) as _, rowIndex}
                            {#each Array.from({ length: 5 }) as _, columnIndex}
                                {@const number = columnIndex * 20 + rowIndex}
                                <div class="matrix-cell">
                                    <input type="number" value={number} disabled />
                                    <input type="number" class="price" value={displayAmount(originalMatrix, number)} disabled />
                                </div>
                            {/each}
                        {/each}
                        {#each Array.from({ length: 5 }) as _, columnIndex}
                            <div class="matrix-cell operations-total-cell">
                                <span aria-hidden="true"></span>
                                <input type="number" class="price" value={displayColumnTotal(originalMatrix, columnIndex)} disabled />
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="matrix-wrapper">
                    <div class="matrix-heading">
                        <h3>Operaciones</h3>
                        <button type="button" onclick={() => openExport('operations')}>Exportar</button>
                    </div>
                    <div class="matrix" aria-label="Operaciones sumadas" style="--cols: {5}">
                        {#each Array.from({ length: 20 }) as _, rowIndex}
                            {#each Array.from({ length: 5 }) as _, columnIndex}
                                {@const number = columnIndex * 20 + rowIndex}
                                <div class="matrix-cell">
                                    <input type="number" value={number} disabled />
                                    <input type="number" class="price" value={displayAmount(summedOperations, number)} disabled />
                                </div>
                            {/each}
                        {/each}
                        {#each Array.from({ length: 5 }) as _, columnIndex}
                            <div class="matrix-cell">
                                <span aria-hidden="true"></span>
                                <input type="number" class="price" value={displayColumnTotal(summedOperations, columnIndex)} disabled />
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="matrix-wrapper">
                    <div class="matrix-heading">
                        <h3>Original</h3>
                        <button type="button" onclick={() => openExport('original')}>Exportar</button>
                    </div>
                    <div class="matrix" aria-label="Original" style="--cols: {5}">
                        {#each Array.from({ length: 20 }) as _, rowIndex}
                            {#each Array.from({ length: 5 }) as _, columnIndex}
                                {@const number = columnIndex * 20 + rowIndex}
                                <div class="matrix-cell">
                                    <input type="number" value={number} disabled />
                                    <input type="number" class="price" value={displayAmount(revertedMatrix, number)} disabled />
                                </div>
                            {/each}
                        {/each}
                        {#each Array.from({ length: 5 }) as _, columnIndex}
                            <div class="matrix-cell operations-total-cell">
                                <span aria-hidden="true"></span>
                                <input type="number" class="price" value={displayColumnTotal(revertedMatrix, columnIndex)} disabled />
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
        width: 60vw;
        max-height: 93vh;
        overflow: auto;
        box-sizing: border-box;
    }

    .operations-comparison {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .matrix-wrapper, .matrix {
        width: 100%;
    }

    .matrix-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
</style>
