<script lang="ts">
    let {
        showModal = $bindable(),
        ticketNumber = $bindable(''),
        name = '',
        time = '',
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
            <h2 class="modal-title">{title}</h2>
            {#if name && time}
                <p class="modal-text">Pagando el sorteo {name} que jugo a las {time}</p>
            {/if}
            <form
                class="modal-form"
                onsubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <div class="pay-ticket">
                    <label class="modal-label" for="pay-ticket">Numero de tiquete ganador</label>
                    <input
                        class="modal-input"
                        id="pay-ticket"
                        type="text"
                        inputmode="numeric"
                        placeholder="Ej: 12345"
                        bind:value={ticketNumber}
                    />
                </div>
                <div class="modal-actions">
                    <button type="button" class="negative" onclick={closeModal}>{cancelText}</button>
                    <button type="submit">{confirmText}</button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    .pay-modal {
        width: 35%;
        gap:1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: start;
    }
    .pay-ticket {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        margin-bottom: 1rem;
    }
</style>
