<script>
    let {
        selectedDate = $bindable(),
        selectedBranch = $bindable(),
        branchNames,
        drawScheduleNames,
        selectedDrawSchedule = $bindable(),
        totalAmount,
        onConfirm,
        showModal = $bindable() } = $props();
    import SelectModal from '../../../lib/components/SelectModal.svelte';

    $effect(() => {
        if (selectedBranch.length > 1) {
            selectedBranch = [selectedBranch[selectedBranch.length - 1]];
        }

        if (selectedDrawSchedule.length > 1) {
            selectedDrawSchedule = [selectedDrawSchedule[selectedDrawSchedule.length - 1]];
        }
    });
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
    <div class="filters">
        <div class="total">
            <label for="from">Fecha</label>
            <input id="from" type="date" bind:value={selectedDate}/>
        </div>
        <div class="field">
            <label for="puesto">Puesto</label>
			<SelectModal
				options={branchNames}
				bind:selected={selectedBranch}
				placeholder="Seleccione un puesto"
			/>
        </div>
        <div class="field">
            <label for="sorteo">Sorteo</label>
			<SelectModal
				options={drawScheduleNames}
				bind:selected={selectedDrawSchedule}
				placeholder="Seleccione un sorteo"
			/>
        </div>
        <button onclick={onConfirm}>
            Confirmar
        </button>
    </div>
    </div>
</div>
{/if}
