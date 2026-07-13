<script lang="ts">
    import { auth } from '../../stores/auth';
    import ReceiptPreview from '../../printing/ReceiptPreview.svelte';
    import type { Receipt } from '../../printing/types';

    type SoldItem = {
        price: number;
    };

    let {
        sold = $bindable<Record<string, SoldItem>>(),
        showTicketPreviewModal = $bindable(false),
        selectedBet = null,
        selectedDate = '',
        details = $bindable(''),
        createdTicket,
        handleConfirmPDF
    } = $props();

    const receipt = $derived.by<Receipt>(() => {
        const soldEntries = Object.entries(sold) as Array<[string, SoldItem]>;

        const items = soldEntries
            .sort(([leftNumber], [rightNumber]) => Number(leftNumber) - Number(rightNumber))
            .map(([number, item]) => ({
                number: String(number).padStart(2, '0'),
                amount: Number(item.price) || 0
            }));

        const total = items.reduce((sum, item) => sum + item.amount, 0);
        const branchName = $auth.user?.branchName ? String($auth.user.branchName) : 'Sucursal';
        const branchLocation = $auth.user?.branchLocation ? String($auth.user.branchLocation) : '';

        const title = selectedBet?.draw_name
            ? `${selectedBet.draw_name}${selectedBet.schedule_name ? ` ${selectedBet.schedule_name}` : ''}`
            : 'Tiquete de venta';

        const subtitleParts = [
            `${branchName} - ${branchLocation}`,
            selectedBet?.schedule_time ? `Cierre: ${selectedBet.schedule_time}` : '',
            selectedDate ? `Fecha: ${selectedDate}` : ''
        ].filter(Boolean);


        return {
            title,
            subtitles: subtitleParts,
            items,
            total,
            footer: ['* * Gracias por su compra * *', '¡Buena suerte!'],
            serial: createdTicket?.ticket_serial || ''
        };
    });

    function serializeData(data: Record<string, SoldItem>): string {
        const serialHex = createdTicket?.ticket_serial
            ? BigInt(createdTicket.ticket_serial).toString(16).toUpperCase()
            : '';

        return Object.entries(data)
            .sort(([leftNumber], [rightNumber]) => Number(leftNumber) - Number(rightNumber))
            .map(([number, item]) => {
                const numberHex = Number(number).toString(16).toUpperCase().padStart(2, '0');
                const priceHex = Number(item.price).toString(16).toUpperCase().padStart(6, '0');

                return `${numberHex}${priceHex}`;
            })
            .join('') + serialHex;
    }

    function printReceipt() {
        const receiptData = {
            receipt,
            qrData: serializeData(sold),
            details
        };
        const encoded = encodeURIComponent(
            JSON.stringify(receiptData)
        );

        window.open(
            '/puesto/print?data=' + encoded,
            '_blank',
            'width=500,height=700'
        );

        onClose();
	}

    function onClose() {
        showTicketPreviewModal = false;
    }

    function handlekeyinput(event: KeyboardEvent) {
        if(!showTicketPreviewModal) return;
        if (event.key === 'Escape') {
            onClose();
        }

        if (event.key === 'Enter') {
            printReceipt();
        }
    }
</script>

<svelte:window onkeydown={handlekeyinput} />
{#if showTicketPreviewModal}
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
        <ReceiptPreview 
            groupedItems={true} 
            details={details}
            qrData={serializeData(sold)} 
            receipt={receipt}
            />
        <div class="actions">  
            <button type="button" onclick={handleConfirmPDF}>
                <div class="button-name">Guardar P<p>D</p>F</div>
            </button>
            <button onclick={printReceipt}>
                <div class="button-name">Imp<p>r</p>imir</div>
            </button>
        </div>
    </div>
</div>
{/if}

<style>
.modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 350px;    
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;
}

</style>