<script lang="ts">
    type SelectionMode = 'single' | 'multiple';
    type SelectionValue = number | number[] | undefined;

    let {
        selectedDate = $bindable(),
        from = $bindable(),
        to = $bindable(),
        selectedBranch = $bindable(),
        branchNames,
        drawScheduleNames,
        scheduleBranch = [],
        selectedDrawSchedule = $bindable(),
        selectionMode: selectionModeProp = 'single',
        includeReventado = false,
        selectedReventado = $bindable(false),
        selectedMegareventado = $bindable(false),
        onConfirm,
        showModal = $bindable()
    } = $props();

    function isMultipleSelection() {
        return (selectionModeProp as SelectionMode) === 'multiple';
    }

    function selectedValues(value: SelectionValue): number[] {
        if (Array.isArray(value)) {
            return value;
        }

        return value === undefined ? [] : [value];
    }

    function hasAssociation(branchId: number, drawScheduleId: number) {
        return scheduleBranch.some((item) =>
            Number(item.branch_id) === branchId &&
            Number(item.draw_schedule_id) === drawScheduleId &&
            item.enabled !== false &&
            item.enabled !== 0 &&
            item.enabled !== '0' &&
            item.enabled !== 'false'
        );
    }

    function isBranchDisabled(branchId: number) {
        const schedules = selectedValues(selectedDrawSchedule);
        return schedules.length > 0 &&
            !schedules.some((scheduleId) => hasAssociation(branchId, scheduleId));
    }

    function isDrawScheduleDisabled(drawScheduleId: number) {
        const branches = selectedValues(selectedBranch);
        return branches.length > 0 &&
            !branches.some((branchId) => hasAssociation(branchId, drawScheduleId));
    }

    function isSelected(value: number, selection: SelectionValue) {
        return selectedValues(selection).includes(value);
    }

    function toggleSelection(value: number, selection: SelectionValue, update: (value: SelectionValue) => void) {
        if (!isMultipleSelection()) {
            update(isSelected(value, selection) ? undefined : value);
            return;
        }

        const values = selectedValues(selection);
        update(values.includes(value)
            ? values.filter((selectedValue) => selectedValue !== value)
            : [...values, value]);
    }

    function toggleBranch(value: number) {
        if (isBranchDisabled(value)) {
            return;
        }

        toggleSelection(value, selectedBranch, (selection) => selectedBranch = selection);
    }

    function toggleDrawSchedule(value: number) {
        if (isDrawScheduleDisabled(value)) {
            return;
        }

        toggleSelection(value, selectedDrawSchedule, (selection) => selectedDrawSchedule = selection);
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
        <div class="total">
            {#if selectionModeProp === 'multiple'}
                <label for="from">Desde</label>
                <input id="from" type="date" bind:value={from}/>
                <label for="to">Hasta</label>
                <input id="to" type="date" bind:value={to}/>
            {/if}
            {#if selectionModeProp === 'single'}
                <label for="from">Fecha</label>
                <input id="from" type="date" bind:value={selectedDate}/>
            {/if}
        </div>
        <div class="field">
            <label for="puesto">Puesto</label>
            <div class="selection-grid" id="puesto">
                {#each branchNames as option}
                    <button
                        type="button"
                        class="selection-option"
                        class:selected={isSelected(option.value, selectedBranch)}
                        disabled={isBranchDisabled(option.value)}
                        onclick={() => toggleBranch(option.value)}
                    >
                        <input
                            type={isMultipleSelection() ? 'checkbox' : 'radio'}
                            name="puesto"
                            checked={isSelected(option.value, selectedBranch)}
                            disabled={isBranchDisabled(option.value)}
                            readonly
                        />
                        <span>{option.label}</span>
                    </button>
                {:else}
                    <span class="empty-options">No hay puestos disponibles</span>
                {/each}
            </div>
        </div>
        <div class="field">
            <label for="sorteo">Sorteo</label>
            <div class="selection-grid" id="sorteo">
                {#each drawScheduleNames as option}
                    <button
                        type="button"
                        class="selection-option"
                        class:selected={isSelected(option.value, selectedDrawSchedule)}
                        disabled={isDrawScheduleDisabled(option.value)}
                        onclick={() => toggleDrawSchedule(option.value)}
                    >
                        <input
                            type={isMultipleSelection() ? 'checkbox' : 'radio'}
                            name="sorteo"
                            checked={isSelected(option.value, selectedDrawSchedule)}
                            disabled={isDrawScheduleDisabled(option.value)}
                            readonly
                        />
                        <span>{option.label}</span>
                    </button>
                {:else}
                    <span class="empty-options">No hay sorteos disponibles</span>
                {/each}
            </div>
        </div>
        {#if includeReventado}
            <div class="field flags">
                <label>
                    <input type="checkbox" bind:checked={selectedReventado} />
                    Reventado
                </label>
                <label>
                    <input type="checkbox" bind:checked={selectedMegareventado} />
                    Mega reventado
                </label>
            </div>
        {/if}
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
        width: 45vw;
        box-sizing: border-box;
    }

    .row {
        height: 100%;
        align-items: start;
    }

    .selection-grid {
        display: flex;
        flex-direction: column;
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
        gap: 0.5rem;
        justify-content: left;
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

    .selection-option:disabled {
        cursor: not-allowed;
        opacity: 0.45;
    }

    .selection-option:disabled:hover {
        background: transparent;
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
