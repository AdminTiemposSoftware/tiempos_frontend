<script lang="ts">
    import { goto } from '$app/navigation';
    import QrCode from 'svelte-qrcode';
    import { serializeListQrData } from '../../printing/printing';

    let {data, puestos, sorteos, showModal=$bindable(), dateFrom, dateTo, total} = $props();

    function formatDate(date: Date): string {
        return (
            date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0')
        );
    }

    function parseDate(date: string): Date {
        const [year, month, day] = date.split('-').map(Number);

        return new Date(year, month - 1, day);
    }

    function serializeData(data: Record<number, number>): string {
        return serializeListQrData(data);
    }

    async function handleImportAsNewList() {
        const qrValue = serializeData(data);

        if (!qrValue) {
            return;
        }

        showModal = false;
        await goto(`/banca/listas?import=${encodeURIComponent(qrValue)}`);
    }

    function onClose() {
        showModal = false;
    }
</script>

{#if showModal}
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
    <h2 class="modal-title">
    {#if dateFrom === dateTo}
        {dateFrom}
    {:else}
        {dateFrom} - {dateTo}
    {/if}</h2>
    <div class="chip-row">
        {#each puestos as puesto}
        <p>{puesto}</p>
        {#if puestos.indexOf(puesto) < puestos.length - 1}
            •
        {/if}
        {/each}
    </div>
    <div class="chip-row">
        {#each sorteos as sorteo}
            <p>{sorteo}</p>
            {#if sorteos.indexOf(sorteo) < sorteos.length - 1}
                •
            {/if}
        {/each}
    </div>
    <div class="qr-container">
        <QrCode value={serializeData(data)} size={350} errorCorrection="L" />
    </div>
    <div class="row">
		<button type="button" class="option-button" onclick={handleImportAsNewList}>
            Traer como lista nueva
		</button>
<button type="button" class="option-button" onclick={() => {}} disabled>
			Descargar excel
</button>
	</div>
</div>
</div>

{/if}

<style>
    .modal {
        width: 50rem;
        margin-left: 15rem
    }

    .qr-container {
        margin: 1rem 0;
    }

    .modal {
        align-items: center;
        display: flex;
        flex-direction: column;
    }

    .chip-row, .modal-title{
        margin-bottom: 0.5rem;
        font-size: 1rem;
        justify-content: center;
    }
</style>
