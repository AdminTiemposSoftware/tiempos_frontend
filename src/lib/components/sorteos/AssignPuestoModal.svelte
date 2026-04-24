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
            <h2>{title}</h2>
            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    handleConfirm();
                }}
            >
                <div class="field">
                    <label class="group-title" for="puesto-select">Puesto</label>
                    {#if puestos.length === 0}
                        <p class="group-empty">No hay puestos disponibles.</p>
                    {:else}
                        <select id="puesto-select" bind:value={selectedPuesto}>
                            {#each puestos as puesto}
                                <option value={puesto}>{puesto}</option>
                            {/each}
                        </select>
                    {/if}
                </div>
                <div class="field">
                    <p class="group-title">Sorteos</p>
                    {#if sorteos.length === 0}
                        <p class="group-empty">No hay sorteos disponibles.</p>
                    {:else}
                        {#each sorteos as sorteo}
                            <label class="radio-option">
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

<style>
    form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .group-title {
        margin: 0;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.8);
    }

    .group-empty {
        margin: 0;
        color: rgba(0, 0, 0, 0.6);
        font-size: 0.9rem;
    }

    .radio-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
</style>
