<script lang="ts">
    import { onMount } from "svelte";

    let {
        showModal = $bindable(),
        selectedWinner,
        winnerMultiplier = $bindable(),
        reventadoMultiplier = $bindable(),
        megareventadoMultiplier = $bindable(),
        winnerReventadoMultiplier = $bindable(),
        onClose,
        onSubmit
    } = $props();

    function closeModal() {
        if (onClose) {
            onClose();
        }
    }

    function handleSubmit() {
        if (onSubmit) {
            onSubmit();
        }
    }
</script>

{#if showModal}
<div
    class="modal-backdrop"
    role="button"
    onclick={closeModal}
    onkeydown={(e) => e.key === 'Escape' && closeModal()}
    tabindex="0"
>
    <div class="modal" onclick={(e) => e.stopPropagation()} role="presentation">
        <h2 class="modal-title">Modificar multiplicador</h2>
        <form
            class="modal-form"
            onsubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}
        >
            <div class="row">
                <label for="schedule-name">El primero paga al</label>
                <input
                    class="modal-input"
                    type="text"
                    bind:value={winnerMultiplier}
                    required
                />
            </div>
            {#if selectedWinner.draw_is_reventado}
                <div class="row">
                    <label for="schedule-time">Si cae reventado paga al</label>
                    <input
                        class="modal-input"
                        type="text"
                        bind:value={reventadoMultiplier}
                        required
                    />
                </div>
                <div class="row">
                    <label for="schedule-time">Si no cae reventado el primero paga al</label>
                    <input
                        class="modal-input"
                        type="text"
                        bind:value={winnerReventadoMultiplier}
                        required
                    />
                </div>
            {/if}
            {#if selectedWinner.draw_is_megareventado}
                <div class="row">
                    <label for="schedule-time">Si cae megareventado paga al</label>
                    <input
                        class="modal-input"
                        type="text"
                        bind:value={megareventadoMultiplier}
                        required
                    />
                </div>
            {/if}
            <div class="modal-actions">
                <button type="button" class="negative" onclick={closeModal}>Cancelar</button>
                <button type="submit">Confirmar</button>
            </div>
        </form>
    </div>
</div>
{/if}

<style>
    .modal {
        width: 25%;
        gap:1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: start;
    }

    .modal-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .modal-title {
        margin: 0;
    }

    .modal-input {
        width: 60px;
        padding: 0.3rem;
    }
</style>
