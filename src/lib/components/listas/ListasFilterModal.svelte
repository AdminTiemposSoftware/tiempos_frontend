<script>
    let {
        selectedDate = $bindable(),
        selectedBranch = $bindable(),
        branchNames,
        drawScheduleNames,
        selectedDrawSchedule = $bindable(),
        onConfirm,
        showModal = $bindable() } = $props();

    function toggleBranch(value) {
        selectedBranch = selectedBranch === value ? undefined : value;
    }

    function toggleDrawSchedule(value) {
        selectedDrawSchedule = selectedDrawSchedule === value ? undefined : value;
    }
</script>

{#if showModal}
<div
    class="modal-backdrop"
    role="button"
    onclick={() => showModal = false}
    onkeydown={(e) => e.key === "Escape" && (showModal = false)}
    tabindex="0"
>
    <div
        class="modal"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
    >
    <div class="row">
        <div class="column">
        <div class="total">
            <label for="from">Fecha</label>
            <input id="from" type="date" bind:value={selectedDate}/>
        </div>
        <div class="field">
            <label for="puesto">Puesto</label>
            <div class="selection-grid" id="puesto">
                {#each branchNames as option}
                    <button
                        type="button"
                        class="selection-option"
                        class:selected={selectedBranch === option.value}
                        onclick={() => toggleBranch(option.value)}
                    >
                        <input type="radio" name="puesto" checked={selectedBranch === option.value} readonly />
                        <span>{option.label}</span>
                    </button>
                {:else}
                    <span class="empty-options">No hay puestos disponibles</span>
                {/each}
            </div>
        </div>
        </div>
        <div class="field">
            <label for="sorteo">Sorteo</label>
            <div class="selection-grid" id="sorteo">
                {#each drawScheduleNames as option}
                    <button
                        type="button"
                        class="selection-option"
                        class:selected={selectedDrawSchedule === option.value}
                        onclick={() => toggleDrawSchedule(option.value)}
                    >
                        <input type="radio" name="sorteo" checked={selectedDrawSchedule === option.value} readonly />
                        <span>{option.label}</span>
                    </button>
                {:else}
                    <span class="empty-options">No hay sorteos disponibles</span>
                {/each}
            </div>
        </div>
    </div>
    <button
        onclick={onConfirm}
    >
        Confirmar
    </button>
    </div>
</div>
{/if}

<style>
    .modal {
        display: flex;
        flex-direction: column;
        height: 80vh;
        width: 30vw;
        box-sizing: border-box;
    }

    .row {
        height: 100%;
        align-items: start;
    }

    .selection-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
        gap: 0.5rem;
        max-height: 65vh;
        box-sizing: border-box;
        overflow-y: auto;
        padding: 0.25rem;
        border: 1px solid var(--color-border);
        background-color: var(--color-box-background);
    }

    .selection-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
        padding: 0.5rem;
        border: 1px solid var(--color-border);
        background: transparent;
        color: var(--color-text);
        text-align: left;
    }

    .selection-option span {
        overflow-wrap: anywhere;
    }

    .selection-option.selected{
        background: color-mix(in srgb, var(--color-theme-2) 10%, transparent);
    }

    .selection-option:hover{
        background: color-mix(in srgb, var(--color-theme-2) 5%, transparent);
    }

    .column {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 1rem;
    }

    .field {
        width: 100%;

    }

    .empty-options {
        display: block;
        margin-top: 0.35rem;
        color: var(--color-text);
        font-weight: 600;
    }
</style>
