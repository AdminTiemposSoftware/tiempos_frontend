<script lang="ts">
    let {
        showModal = $bindable(),
        ticketNumber = $bindable(''),
        group = '',
        title = 'Pagar premio',
        confirmText = 'Pagar',
        cancelText = 'Cancelar',
        onPay,
        onClose
    } = $props();

    function closeModal() {
        showModal = false;
        ticketNumber = '';
        if (onClose) {
            onClose();
        }
    }

    function handleSubmit() {
        if (onPay) {
            onPay();
        }
        closeModal();
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
        <div class="modal pay-modal" onclick={(e) => e.stopPropagation()} role="presentation">
            <h2>{title}</h2>
            {#if group}
                <p class="pay-modal-subtitle">Grupo: {group}</p>
            {/if}
            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <label for="pay-ticket">Numero de tiquete ganador</label>
                <input
                    id="pay-ticket"
                    type="text"
                    inputmode="numeric"
                    placeholder="Ej: 12345"
                    bind:value={ticketNumber}
                />
                <div class="modal-actions">
                    <button type="button" onclick={closeModal}>{cancelText}</button>
                    <button type="submit" class="negative">{confirmText}</button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        z-index: 11;
    }

    .pay-modal form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .pay-modal-subtitle {
        margin: 0.25rem 0 0.75rem;
        color: rgba(0, 0, 0, 0.6);
    }
</style>
