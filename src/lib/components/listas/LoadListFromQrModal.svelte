<script lang="ts">
    let {
        qrInput = $bindable(''),
        onConfirm,
        showModal = $bindable(false)
    } = $props();
</script>

{#if showModal}
    <div
        class="modal-backdrop"
        role="button"
        tabindex="0"
        onclick={() => showModal = false}
        onkeydown={(event) => event.key === 'Escape' && (showModal = false)}
    >
        <div
            class="modal"
            role="presentation"
            onclick={(event) => event.stopPropagation()}
        >
            <label for="list-qr-input">Código QR de la lista</label>
            <textarea
                id="list-qr-input"
                bind:value={qrInput}
                placeholder="Pegue aquí el texto del código QR"
                rows="5"
            ></textarea>
            <button
                type="button"
                onclick={onConfirm}
                disabled={!qrInput.trim()}
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
        gap: 1rem;
        width: min(40rem, 90vw);
        box-sizing: border-box;
    }

    textarea {
        box-sizing: border-box;
        min-height: 8rem;
        width: 100%;
        resize: vertical;
        border: 1px solid var(--color-border);
    }
</style>
