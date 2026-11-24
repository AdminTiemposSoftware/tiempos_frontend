<script lang="ts">
    let {
        sold,
        isSubmitting,
        handlePrint,
        showQrModal = $bindable(),
        showJalarModal = $bindable(),
        viewTickets
    } = $props();

    import { PrinterSolid, ReceiptSolid, CameraPhotoSolid } from "flowbite-svelte-icons";
</script>

<div class="buttons-group">
    <button
        disabled={Object.keys(sold).length === 0 || isSubmitting}
        onclick={handlePrint}
    >
        <PrinterSolid class="shrink-0 h-4 w-4" />
        <div class="button-name">Imp<p>r</p>imir</div>
    </button>

    <div class="row">
        <button onclick={() => showJalarModal = true}>
            <CameraPhotoSolid class="shrink-0 h-4 w-4" />
            <div class="button-name"><p>J</p>alar tiquete</div>
        </button>
        <button onclick={viewTickets}>
            <ReceiptSolid class="shrink-0 h-4 w-4" />
            <div class="button-name"><p>T</p>iquetes</div>
        </button>
    </div>
</div>

<style>
    .buttons-group {
        display: flex;
        flex-direction: column;
    }

    .buttons-group button {
        width: 100%;
    }

    .row {
        width: 100%;

    }
</style>
