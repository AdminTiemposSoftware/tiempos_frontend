<script lang="ts">
    import QrCode from 'svelte-qrcode';

    let {data, showQRModal=$bindable(), date, total, onClose} = $props();

    function formatDate(date: Date): string {
        return (
            date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0')
        );
    }
    function serializeData(data: Record<number, number>): string {
        let result = Object.values(data).map((amount) =>amount.toString(16).toUpperCase().padStart(6, '0')).join('');
        result += total.toString(16).toUpperCase().padStart(8, '0');
        result += formatDate(new Date(date));
        return result;
    }
</script>

{#if showQRModal}
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
            <QrCode value={serializeData(data)} size={350} errorCorrection="L" />
        </div>
        <div class="modal-actions">
            <button onclick={onClose}>Cerrar</button>
        </div>
    </div>
</div>

{/if}

<style>
    .qr-container {
        margin: 1rem 0;
    }
</style>
