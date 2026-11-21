<script lang="ts">
    let {
        sold,
        isSubmitting,
        handlePrint,
        showQrModal = $bindable(),
        showJalarModal = $bindable(),
        viewTickets
    } = $props();

    import { PrinterSolid, EyeSolid, ReceiptSolid, CameraPhotoSolid } from "flowbite-svelte-icons";
</script>

<form onsubmit={handlePrint}>
    <button
        type="submit"
        disabled={Object.keys(sold).length === 0 || isSubmitting}
    >
        <PrinterSolid class="shrink-0 h-4 w-4" />
        <div class="button-name">Imp<p>r</p>imir</div>
    </button>
</form>
<div class="buttons-group">
    <button
        onclick={() => showQrModal = true} disabled={Object.keys(sold).length === 0}
    >
        <EyeSolid class="shrink-0 h-4 w-4" />
        <div class="button-name"><p>V</p>er QR</div>
    </button>
    <button onclick={() => showJalarModal = true}>
        <CameraPhotoSolid class="shrink-0 h-4 w-4" />
        <div class="button-name"><p>J</p>alar tiquete</div>
    </button>
    <button onclick={viewTickets}>
        <ReceiptSolid class="shrink-0 h-4 w-4" />
        <div class="button-name"><p>T</p>iquetes</div>
    </button>
</div>
