<script lang="ts">
    type SorteoOption = {
        id: number;
        name: string;
    };

    let {
        showModal = $bindable(),
        sorteos = [] as SorteoOption[],
        puestos = [] as string[],
        selectedSorteoId = $bindable(null as number | null),
        selectedPuesto = $bindable(''),
        title = 'Agregar puesto a sorteos',
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
                    <label class="modal-label" for="puesto-select">Puesto</label>
                    {#if puestos.length === 0}
                        <p class="modal-empty">No hay puestos disponibles.</p>
                    {:else}
                        <select class="modal-input" id="puesto-select" bind:value={selectedPuesto}>
                            {#each puestos as puesto}
                                <option value={puesto}>{puesto}</option>
                            {/each}
                        </select>
                    {/if}
                </div>
                <div class="modal-field">
                    <p class="modal-field-title">Sorteos</p>
                    {#if sorteos.length === 0}
                        <p class="modal-empty">No hay sorteos disponibles.</p>
                    {:else}
                        {#each sorteos as sorteo}
                            <label class="modal-radio-option">
                                <input
                                    type="radio"
                                    name="sorteo-radio"
                                    value={sorteo.id}
                                    bind:group={selectedSorteoId}
                                />
                                <span>{sorteo.name}</span>
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

