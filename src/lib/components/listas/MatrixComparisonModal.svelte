<script lang="ts">
    type Matrix = Record<number, number>;

    let {
        existingMatrix = {},
        createdMatrix = {},
        existingListExists = false,
        selectedBranchName = 'Puesto no seleccionado',
        selectedScheduleName = 'Sorteo no seleccionado',
        selectedDate = '',
        isReventado = false,
        isMegareventado = false,
        showModal = $bindable(false),
        confirm,
        cancel
    } = $props<{
        existingMatrix?: Matrix;
        createdMatrix?: Matrix;
        existingListExists?: boolean;
        selectedBranchName?: string;
        selectedScheduleName?: string;
        selectedDate?: string;
        isReventado?: boolean;
        isMegareventado?: boolean;
        showModal?: boolean;
        confirm: () => void | Promise<void>;
        cancel?: () => void;
    }>();

    let isConfirming = $state(false);

    function close() {
        showModal = false;
        cancel?.();
    }

    async function handleConfirm() {
        if (isConfirming) {
            return;
        }

        isConfirming = true;
        try {
            await confirm();
            showModal = false;
        } finally {
            isConfirming = false;
        }
    }

    function amount(matrix: Matrix, number: number) {
        return Number.isFinite(matrix[number]) ? matrix[number] : 0;
    }

    function columnTotal(matrix: Matrix, columnIndex: number) {
        return Array.from({ length: 20 }, (_, rowIndex) => {
            return amount(matrix, columnIndex * 20 + rowIndex);
        }).reduce((total, value) => total + value, 0);
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
    onclick={(e) => e.stopPropagation()}
    role="presentation"
    aria-labelledby="comparison-title"
>
    <p id="comparison-title">
        Lista: {selectedBranchName} • {selectedScheduleName} • {selectedDate} • Reventado: {isReventado ? 'Sí' : 'No'} • Mega reventado: {isMegareventado ? 'Sí' : 'No'}
    </p>
    {#if existingListExists}
        <div class="row">
            <p class="description">
                Revise la lista existente y los valores que está a punto de guardar.
            </p>
            <div class="actions">
                <button type="button" class="negative" onclick={close} disabled={isConfirming}>Cancelar</button>
                <button type="button" onclick={handleConfirm} disabled={isConfirming}>
                    {isConfirming ? 'Guardando...' : existingListExists ? 'Guardar' : 'Crear lista'}
                </button>
            </div>
        </div>
    {:else}
        <p class="description">
            Esta lista todavía no existe. Revise los valores nuevos y confirme para crearla.
        </p>
    {/if}

    <div class="comparison">
        <div class="list-panel">
            <p>Lista existente</p>
            {#if existingListExists}
                <div class="matrix" aria-label="Lista existente">
                    {#each Array.from({ length: 20 }, (_, rowIndex) => rowIndex) as rowIndex}
                        {#each Array.from({ length: 5 }, (_, columnIndex) => columnIndex) as columnIndex}
                            {@const number = columnIndex * 20 + rowIndex}
                            <div class="matrix-cell">
                                <input type="number" value={number} disabled />
                                <input type="number" value={amount(existingMatrix, number)} class="price" disabled />
                            </div>
                        {/each}
                    {/each}
                    {#each Array.from({ length: 5 }, (_, columnIndex) => columnIndex) as columnIndex}
                        <div class="matrix-cell total-cell">
                            <input type="number" value="" aria-label="Total" disabled />
                            <input type="number" value={columnTotal(existingMatrix, columnIndex)} class="price" disabled />
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="missing-list">La lista no existe todavía.</div>
            {/if}
        </div>

        <div class="list-panel">
            <p>Lista nueva</p>
            <div class="matrix" aria-label="Lista nueva">
                {#each Array.from({ length: 20 }, (_, rowIndex) => rowIndex) as rowIndex}
                    {#each Array.from({ length: 5 }, (_, columnIndex) => columnIndex) as columnIndex}
                        {@const number = columnIndex * 20 + rowIndex}
                        <div class="matrix-cell">
                            <input type="number" value={number} disabled />
                            <input type="number" value={amount(createdMatrix, number)} class="price" disabled />
                        </div>
                    {/each}
                {/each}
                {#each Array.from({ length: 5 }, (_, columnIndex) => columnIndex) as columnIndex}
                    <div class="matrix-cell total-cell">
                        <input type="number" value="" aria-label="Total" disabled />
                        <input type="number" value={columnTotal(createdMatrix, columnIndex)} class="price" disabled />
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
        margin-left: 15vw;
        width: 80vw;
        height: 93vh;
        overflow: auto;
        box-sizing: border-box;
    }

    h2 {
        margin: 0 0 0.35rem;
    }

    .configuration {
        margin: 0 0 1rem;
    }

    .comparison {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
    }

    .list-panel {
        min-width: 0;
    }

    .matrix {
        display: grid;
        grid-template-columns: repeat(5, minmax(5rem, 1fr));
        overflow-y: auto;
        padding: 0.25rem;
        box-sizing: border-box;
    }

    .matrix-cell input:first-child {
        opacity: 0.75;
    }

    .matrix-cell .price {
        min-height: 2rem;
    }

    .total-cell {
        margin-top: 0.25rem;
    }

    .missing-list {
        display: grid;
        min-height: 12rem;
        place-items: center;
        padding: 1rem;
        border: 1px solid var(--color-border);
        color: var(--color-text);
        text-align: center;
    }

    .actions {
        display: flex;
        gap: 0.75rem;
    }

    .row {
        justify-content: space-between;
        align-items: center;
    }
</style>
