<script lang="ts">
    import { auth } from '../../stores/auth';
    import ReceiptPreview from '../../printing/ReceiptPreview.svelte';
    import { serializeData } from '../../printing/printing';
    import type { Receipt } from '../../printing/types';

    let {
        sold = $bindable<Record<string, number>>(),
        showTicketPreviewModal = $bindable(false),
        selectedBet = null,
        selectedDate = '',
        details = $bindable(''),
        createdTicket,
        winnerTicket = null,
        showPrintButton = true
    } = $props();

    const previewSold = $derived(winnerTicket?.numbersSold ?? sold);
    const previewSerial = $derived(winnerTicket?.serial ?? createdTicket?.ticket_serial ?? '');
    const previewDetails = $derived(winnerTicket?.details ?? details);

    const receipt = $derived.by<Receipt>(() => {
        const soldEntries = Object.entries(previewSold) as Array<[string, number]>;

        const numbers = soldEntries
            .sort(([leftNumber], [rightNumber]) => Number(leftNumber) - Number(rightNumber))
            .map(([number, item]) => ({
                number: String(number).padStart(2, '0'),
                amount: Number(item) || 0
            }));

        const total = numbers.reduce((sum, item) => sum + item.amount, 0);
        const branchName = winnerTicket?.branch_name
            ? String(winnerTicket.branch_name)
            : ($auth.user?.branchName ? String($auth.user.branchName) : 'Sucursal');
        const username = winnerTicket?.username
            ? String(winnerTicket.username)
            : ($auth.user?.username ? String($auth.user.username) : '');

        const firstPosition = selectedBet?.positions?.filter((position: {position_number: number, multiplier: number}) => position.position_number === 1);
        const multiplier = winnerTicket?.multiplier ?? firstPosition?.[0]?.multiplier;
        const multiplierInfo = multiplier ? `El primero paga al: ${multiplier}` : '';

        const upperLines = [
            winnerTicket
                ? `${winnerTicket.draw_name} ${winnerTicket.draw_schedule_name}`
                : `${selectedBet?.draw_name ?? ''} ${selectedBet?.schedule_name ?? ''}`,
            branchName,
            username,
            winnerTicket?.date ? `Fecha: ${winnerTicket.date}` : (selectedDate ? `Fecha: ${selectedDate}` : ''),
            winnerTicket?.time
                ? `Hora: ${winnerTicket.time.slice(0, 8)}`
                : (createdTicket?.printed_at ? `Hora: ${createdTicket.printed_at.slice(0, 8)}` : '')
        ].filter(Boolean) as string[];

        return {
            serial: `${previewSerial}`,
            ticket_number: winnerTicket
                ? winnerTicket.relative_id.toString().padStart(3, '0')
                : createdTicket?.ticket_number?.toString().padStart(3, '0') || '',
            upperLines,
            numbers,
            total,
            footerLines: ["------- ATENCION -------", multiplierInfo, "------------------------", 'Gracias por su compra', '¡Buena suerte!'].filter(Boolean) as string[]
        };
    });


    function printReceipt() {
        const receiptData = {
            receipt,
            qrData: serializeData(previewSold, previewSerial),
            details: previewDetails,
            printMode: 'normal' as const
        };
        const encoded = encodeURIComponent(
            JSON.stringify(receiptData)
        );

        const printWindow = window.open(
            '/puesto/print?data=' + encoded,
            '_blank',
            'width=500,height=700'
        );

        printWindow?.addEventListener('afterprint', () => {
            printWindow.close();
        });

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

        if (event.key === 'Enter' && showPrintButton) {
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
        <div class="receipt-container scroll-thin">
            <ReceiptPreview
                groupedItems={true}
                details={previewDetails}
                qrData={serializeData(previewSold, previewSerial)}
                receipt={receipt}
                />
        </div>

        {#if showPrintButton}
        <div class="actions">
            <!-- <button type="button" onclick={handleConfirmPDF}>
                <div class="button-name">Guardar P<p>D</p>F</div>
            </button> -->
            <button onclick={printReceipt}>
                <div class="button-name">Imp<p>r</p>imir (Enter)</div>
            </button>
        </div>
        {/if}
    </div>
</div>
{/if}

<style>
.modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 400px;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;
}

</style>
