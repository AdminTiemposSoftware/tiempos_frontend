<script lang="ts">
    type SorteoOption = {
        id: number;
        name: string;
    };

    let {
        showModal = $bindable(),
        sorteos = [] as SorteoOption[],
        puestos = [] as string[],
        selectedSorteoId = $bindable(sorteos.length > 0 ? sorteos[0].id : null),
        selectedPuesto = $bindable(''),
        title = 'Agregar sorteo a puestos',
        confirmText = 'Aplicar',
        cancelText = 'Cancelar',
        confirm
    } = $props();

    let wasOpen = false;

    $effect(() => {
        if (showModal && !wasOpen) {
            if (selectedSorteoId === null && sorteos.length > 0) {
                selectedSorteoId = sorteos[0].id;
            }
            if (!selectedPuesto && puestos.length > 0) {
                selectedPuesto = puestos[0];
            }
        }
        wasOpen = showModal;
    });

    function onClose() {
        showModal = false;
    }

    function handleConfirm() {
        if (confirm) {
            confirm();
        }
        onClose();
    }
</script>

{#if showModal}
    <div
        class="modal-backdrop"
        role="button"
        onclick={onClose}
        onkeydown={(e) => e.key === 'Escape' && onClose()}
        tabindex="0"
    >
        <div class="modal" onclick={(e) => e.stopPropagation()} role="presentation">
            <h2 class="modal-title">{title}</h2>
            <form class="modal-form"
                onsubmit={(e) => {
                    e.preventDefault();
                    handleConfirm();
                }}
            >
                <div class="modal-field">
                    <label class="modal-label" for="sorteo-select">Sorteos</label>
                    {#if sorteos.length === 0}
                        <p class="modal-empty">No hay sorteos disponibles.</p>
                    {:else}
                        <select class="modal-input" id="sorteo-select" bind:value={selectedSorteoId}>
                            {#each sorteos as sorteo}
                                <option value={sorteo.id}>{sorteo.name}</option>
                            {/each}
                        </select>
                    {/if}
                </div>
                <div class="modal-field">
                    <p class="modal-field-title">Puestos</p>
                    {#if puestos.length === 0}
                        <p class="modal-empty">No hay puestos disponibles.</p>
                    {:else}
                        {#each puestos as puesto}
                            <label class="modal-radio-option">
                                <input
                                    type="radio"
                                    name="puesto-radio"
                                    value={puesto}
                                    bind:group={selectedPuesto}
                                />
                                <span>{puesto}</span>
                            </label>
                        {/each}
                    {/if}
                </div>
                <div class="modal-actions">
                    <button type="button" onclick={onClose}>{cancelText}</button>
                    <button type="submit">{confirmText}</button>
                </div>
            </form>
        </div>
    </div>
{/if}

