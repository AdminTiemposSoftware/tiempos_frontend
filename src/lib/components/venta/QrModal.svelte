<script lang="ts">
    import QrCode from 'svelte-qrcode';

    export let data: string;
    export let onClose: () => void;
</script>

<div 
    class="modal-backdrop" 
    role="button" 
    onclick={onClose} 
    onkeydown={(e) => e.key === "Escape" && onClose()} 
    tabindex="0"
>
    <div
        class="modal"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
    >
        <h2 class="modal-title">Código QR de la Venta</h2>
        <div class="qr-container">
            <QrCode value={data} />
        </div>
        <div class="modal-actions">
            <button onclick={onClose}>Cerrar</button>
        </div>
    </div>
</div>

<style>
    .qr-container {
        margin: 1rem 0;
    }
</style>
