<script lang="ts">
    let {getTickets, getSoldNumbersForTicket, selectedBet, selectedDate} = $props();

    let sold= $state<Record<string, number>>({});
    let priceInput: HTMLInputElement;
    let randomCountInput: HTMLInputElement;
    let priceValue = $state('');
    let showQrModal = $state(false);
    let showTicketsModal = $state(false);
    let tickets = $state([]);
    let numberInput: HTMLInputElement;
    let numberValue = $state('');
    let randomCount = $state(1);
    let isSubmitting = $state(false);
    let selectedRowIndex = $state(0);
    let showTicketPreviewModal = $state(false);
    let details = $state('');
    let detailsSnapshot = $state('');
    let soldSnapshot: Record<string, number> = $state({});
    let createdTicket: { ticket_serial: string; ticket_amount: number; printed_at: string; ticket_number: string } | null = $state(null);
    let showConfirmModal = $state(false);
    let formElement: HTMLFormElement;
    let soldAmount = $derived.by(() => {
        return Object.values(sold).reduce((sum, item) => sum + item, 0);
    });
    let showJalarModal = $state(false);
    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
	const today = utcMinus6Date.toISOString().split('T')[0];
	let reventadoNumber = $state<boolean>(false);

    import { onMount } from 'svelte';
    import { sellingMatrix } from '../../stores/UpdateSellMatrix';
    import { total } from '../../stores/UpdateSellMatrix';
    import QrModal from './QrModal.svelte';
    import TicketsModal from './TicketsModal.svelte';
    import { prohibitedNumbers } from "../../stores/UpdateSellMatrix";
    import { Notifications, acts } from '@tadashi/svelte-notification';
    import { auth } from '../../stores/auth';
    import TicketPreviewModal from './TicketPreviewModal.svelte';
    import ConfirmModalWithInput from '../ConfirmModalWithInput.svelte';
    import JalarTicketModal from './JalarTicketModal.svelte';
    import Reventado from './Reventado.svelte';
    import SaleForm from './SaleForm.svelte';
    import SaleActions from './SaleActions.svelte';
    import TicketTable from './TicketTable.svelte';
    import TicketActions from './TicketActions.svelte';

    onMount(() => {
        priceInput?.focus();
    });

    function updateSalesData(numbers: string[], price: number) {
        const newSelled = { ...sold };
        numbers.forEach((num) => {
            if (newSelled[num]) {
                newSelled[num] += price;
            } else {
                newSelled[num] = price;
            }
        });
        sold = newSelled;
        formElement.reset();
        priceInput?.focus();
        priceValue = '';
    }

    function buildNumbersPayload(values: Record<string, number>) {
        return Object.entries(values).map(([number, price]) => ({
            number: parseInt(number, 10),
            amount: price,
            is_reventado: 0,
            is_megareventado: 0
        }));
    }

    function hasProhibitedNumbers(soldSnapshot: Record<string, number>) {
        const prohibitedInSold = $prohibitedNumbers.filter( (p) =>
            soldSnapshot[p.number] !== undefined && p.can_sell_after_amount === false
        );
        if (prohibitedInSold.length === 0) return false;

        const matching = Object.fromEntries(Object.entries($sellingMatrix).filter(([key]) => prohibitedInSold.some((p) => p.number === Number(key))));

        // Equivalent to first IF EXISTS
        const exceededNumbersByAmount = prohibitedInSold.filter((p) => {
            if (!p.by_amount) return false;

            const currentAmount = matching[p.number];
            return currentAmount >= p.amount;
        });

        let message = '';

        if (exceededNumbersByAmount.length > 0) {
            if (exceededNumbersByAmount.length === 1)
                message = `El número ${exceededNumbersByAmount[0].number} excede el monto permitido.`;
            else
                message = `Los números ${exceededNumbersByAmount.map((x) => x.number).join(', ')} exceden el monto permitido.`;

            acts.add({
                message: message,
                mode: 'error',
                lifetime: 3
            });
            return true;
        }

        // Equivalent to second IF EXISTS
        const percentageLimit = $total * ($auth.user?.prohibitedPercentage? $auth.user.prohibitedPercentage / 100 : 100);
        const exceedsNumbersByPercentage = prohibitedInSold.filter((p) => {
            if (!p.by_percentage) return false;

            const currentAmount = matching[p.number];
            return currentAmount >= percentageLimit && currentAmount >= p.starter;
        });

        if (exceedsNumbersByPercentage.length > 0) {
            if (exceedsNumbersByPercentage.length === 1)
                message = `El número ${exceedsNumbersByPercentage[0].number} excede lo que tienes permitido vender.`;
            else
                message = `Los números ${exceedsNumbersByPercentage.map((x) => x.number).join(', ')} exceden lo que tienes permitido vender.`;

            acts.add({
                message: message,
                mode: 'error',
                lifetime: 3
            });
            return true;
        }
        return false;
    }

    function canSellSelectedNumbers(drawScheduleId : number ) {
        if (!drawScheduleId){
            acts.add({
                message: 'No se ha seleccionado un sorteo.',
                mode: 'error',
                lifetime: 3
            });
            return false;
        }
        if (Object.keys(sold).length === 0){
            acts.add({
                message: 'No hay números seleccionados.',
                mode: 'error',
                lifetime: 3
            });
            return false;
        }
        return true;
    }

    async function processTicket() {
        const drawScheduleId = selectedBet?.schedule_id ?? selectedBet?.draw_schedule_id;
        if (!canSellSelectedNumbers(drawScheduleId)) return;
        if (hasProhibitedNumbers(soldSnapshot)) return;

        soldSnapshot = { ...sold };
        isSubmitting = true;
        try {
            const response = await fetch('/puesto/venta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: selectedDate,
                    draw_schedule_id: drawScheduleId,
                    details: details,
                    numbers: buildNumbersPayload(soldSnapshot)
                })
            });

            isSubmitting = false;

            if (!response.ok) {
                acts.add({
                    message: 'Hubo un error al crear el tiquete.',
                    mode: 'error',
                    lifetime: 3
                });
                return;
            }

            const responseBody = await response.json().catch(() => null);
            createdTicket = Array.isArray(responseBody?.items) ? responseBody.items[0] : null;
            if (selectedDate === today) {
                sellingMatrix.update((matrix) => {
                    for (const [number, price] of Object.entries(soldSnapshot)) {
                        matrix[number] = (matrix[number] || 0) + price;
                    }
                    return matrix;
                });
                total.update((n) => n + Object.values(soldSnapshot).reduce((sum, item) => sum + item, 0));
            }
            showTicketPreviewModal = true;
            sold = {};
            detailsSnapshot = details;
            details = '';
        } catch (error) {
            isSubmitting = false;
            acts.add({
                message: 'Hubo un error al crear el tiquete.',
                mode: 'error',
                lifetime: 3
            });
        }
    }

    function deleteNumber(number: string) {
        const { [number]: _, ...rest } = sold;
        sold = rest;
    }

    async function viewTickets() {
        tickets = await getTickets();
        showTicketsModal = true;
    }

    async function handlekeyinput(event: KeyboardEvent) {
        const target = event.target;
        const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);

        if (event.repeat) {
            return;
        }

        if (showConfirmModal){
            if (event.key === "Enter") {
                event.preventDefault();
                await handleConfirmDetails();
            }
            return;
        }

        if (showTicketPreviewModal || showTicketsModal || showQrModal || showJalarModal) {
            return;
        }

        switch (event.key) {
            case "r":
            case "R":
                await handlePrint();
                break;
            case "t":
            case "T":
                // Ver Tiquetes button
                viewTickets();
                break;
            case "J":
            case "j":
                showJalarModal = true;
                break;
            case "v":
            case "V":
                //TODO : Ver QR button
                showQrModal = true;
                break;
            case "ArrowDown":
                if (showTicketPreviewModal || showTicketsModal || showQrModal || showJalarModal) {
                    return;
                }
                event.preventDefault();
                selectedRowIndex = Math.min(selectedRowIndex + 1, Object.keys(sold).length - 1);
                break;
            case "ArrowUp":
                if (showTicketPreviewModal || showTicketsModal || showQrModal || showJalarModal) {
                    return;
                }
                event.preventDefault();
                selectedRowIndex = Math.max(selectedRowIndex - 1, 0);
                break;
            case "x":
            case "X":
                if (selectedRowIndex >= 0) {
                    const numberToDelete = Object.keys(sold)[selectedRowIndex];
                    if (numberToDelete) {
                        deleteNumber(numberToDelete);
                        selectedRowIndex = Math.min(selectedRowIndex, Object.keys(sold).length - 1);
                    }
                }
                break;
            case "q":
            case "Q":
                hasProhibitedNumbers(sold);
                break;
        }
    }

    async function handlePrint() {
        const drawScheduleId = selectedBet?.schedule_id ?? selectedBet?.draw_schedule_id;
        if(!showTicketPreviewModal && canSellSelectedNumbers(drawScheduleId) && !hasProhibitedNumbers(sold)) {
            showConfirmModal = true;
        }
    }

    async function handleConfirmDetails() {
        showConfirmModal = false;
        await processTicket();
    }
</script>

<TicketPreviewModal
    bind:showTicketPreviewModal={showTicketPreviewModal}
    createdTicket={createdTicket}
    bind:sold={soldSnapshot}
    details={detailsSnapshot}
    selectedBet={selectedBet}
    selectedDate={selectedDate}
/>

<QrModal
    bind:showQRModal={showQrModal}
    data={$sellingMatrix}
    total={$total}
    date={selectedDate}
    onClose={() => showQrModal = false}
/>

<ConfirmModalWithInput
    bind:showModal={showConfirmModal}
    message="¿Desea agregar algún detalle?"
    bind:input={details}
    confirm={handleConfirmDetails}
/>

<TicketsModal
    bind:showTicketModal={showTicketsModal}
    bind:tickets={tickets}
    bind:numbersSold={sold}
    getSoldNumbersForTicket={getSoldNumbersForTicket}
/>

<JalarTicketModal
    bind:showModal={showJalarModal}
    bind:numbersSold={sold}
/>

<svelte:window onkeydown={handlekeyinput} />
<section class="sell">
    <div class="row">
        <span class="sold-amount">Tiquete: ₡{soldAmount}</span>
        {#if selectedBet.draw_is_reventado}
            <Reventado
                bind:number={numberValue}
                bind:price={priceValue}
                bind:reventado={reventadoNumber}
                />
        {/if}
    </div>
    <SaleForm
        bind:priceValue
        bind:numberValue
        bind:reventadoNumber
        bind:priceInput
        bind:numberInput
        bind:formElement
        {updateSalesData}
    />
    <SaleActions
        {sold}
        bind:randomCount
        bind:randomCountInput
        bind:priceValue
        bind:priceInput
        {updateSalesData}
    />
    <div class="sold">
        <TicketTable
            {sold}
            bind:selectedRowIndex
            {deleteNumber}
        />
        <TicketActions
            {sold}
            {isSubmitting}
            {handlePrint}
            bind:showQrModal
            bind:showJalarModal
            {viewTickets}
        />
    </div>
</section>

<Notifications />
<style>
    .sell {
        flex-direction: column;
        width: 100%;
        height: 100%;
        position: relative;
        padding: 1rem;
        box-sizing: border-box;
        background: #fff;
        border: 1px dashed var(--color-border);
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
        flex: 1;
    }
    .sell::before {
        top: -4px;
    }

    .sell::after {
        bottom: -4px;
    }

    span{
        font-size: 1.25rem;
    }

    .sold-amount {
        margin-bottom: 1rem;
        margin-right: auto;
    }

    .row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }

    .sold {
        width: 100%;
        flex:1;
    }

    :global(.sold button) {
        width: 100%;
    }

    :global(.buttons-group) {
        display: flex;
        gap: 0.5rem;
        margin: 1rem 0;
        width: 100%;
        font-size: medium;
    }

    :global(.buttons-group button) {
        flex: 1;
        padding: 0.5rem 0.5rem;
    }
</style>
