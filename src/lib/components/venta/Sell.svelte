<script lang="ts">
    import { onMount } from 'svelte';
    import { acts } from '@tadashi/svelte-notification';
    import TicketsModal from './TicketsModal.svelte';
    import TicketPreviewModal from './TicketPreviewModal.svelte';
    import JalarTicketModal from './JalarTicketModal.svelte';
    import QrModal from './QrModal.svelte';
    import ConfirmModalWithInput from '../ConfirmModalWithInput.svelte';
    import Reventado from './Reventado.svelte';
    import SaleForm from './SaleForm.svelte';
    import SaleActions from './SaleActions.svelte';
    import TicketTable from './TicketTable.svelte';
    import TicketActions from './TicketActions.svelte';
    import { sellingMatrix, total, prohibitedNumbers } from '../../stores/UpdateSellMatrix';
    import { auth } from '../../stores/auth';
    import { formatAmount } from '../../printing/printing';

    type SoldEntry = {
        number: string;
        amount: number;
        amount_name: string | null;
        id: number;
    };

    type UnnamedSoldEntry = {
        number: string;
        amount: number;
        id: number;
        is_reventado: number;
        is_megareventado: number;
    };

    type SoldOrderEntry =
        | { type: 'number'; id: number }
        | { type: 'named'; id: number };

    type DisplayedSoldEntry =
        | { type: 'number'; number: string; price: number; amount_name: null; id: number }
        | { type: 'named'; number: string; price: number; amount_name: string | null; id: number };

    let {
        getTickets,
        getSoldNumbersForTicket,
        getSoldAmountNamesForTicket,
        getSoldEntriesForTicket,
        selectedBet,
        selectedDate,
        isPrintConfirmationOpen = $bindable(false),
    } = $props();

    let sold = $state<Record<string, number>>({});
    let unnamedSoldEntries = $state<UnnamedSoldEntry[]>([]);
    let namedSoldEntries = $state<SoldEntry[]>([]);
    let soldOrder = $state<SoldOrderEntry[]>([]);
    let nextEntryId = 0;
    let soldAmountNames = $state<Record<string, string | null>>({});
    let priceValue = $state('');
    let numberValue = $state('');
    let selectedAmountName = $state<string | null>(null);
    let reventadoNumber = $state(false);
    let randomCount = $state(1);
    let priceInput = $state<HTMLInputElement>();
    let numberInput = $state<HTMLInputElement>();
    let randomCountInput = $state<HTMLInputElement>();
    let formElement = $state<HTMLFormElement>();
    let isSubmitting = $state(false);
    let selectedRowIndex = $state(0);
    let details = $state('');
    let showConfirmModal = $state(false);
    let showTicketsModal = $state(false);
    let showJalarModal = $state(false);
    let showQrModal = $state(false);
    let showTicketPreviewModal = $state(false);
    let tickets = $state<any[]>([]);
    let createdTicket = $state<any>(null);
    let ticketPreviewBet = $state<any>(null);
    let ticketPreviewDate = $state('');
    let soldSnapshot = $state<Record<string, number>>({});
    let namedSoldEntriesSnapshot = $state<SoldEntry[]>([]);
    let soldAmountNamesSnapshot = $state<Record<string, string | null>>({});
    let detailsSnapshot = $state('');

    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const today = utcMinus6Date.toISOString().split('T')[0];

    let soldAmount = $derived.by(() =>
        Object.values(sold).reduce((sum, amount) => sum + amount, 0)
        + namedSoldEntries.reduce((sum, entry) => sum + entry.amount, 0)
    );

    let displayedSoldEntries = $derived.by(() =>
        [...soldOrder].reverse().flatMap((order): DisplayedSoldEntry[] => {
            if (order.type === 'number') {
                const entry = unnamedSoldEntries.find((item) => item.id === order.id);
                return entry
                    ? [{ type: 'number', number: entry.number, price: entry.amount, amount_name: null, id: entry.id }]
                    : [];
            }

            const entry = namedSoldEntries.find((item) => item.id === order.id);
            return entry
                ? [{ type: 'named', number: entry.number, price: entry.amount, amount_name: entry.amount_name, id: entry.id }]
                : [];
        })
    );

    onMount(() => priceInput?.focus());

    function updateSalesData(numbers: string[], price: number, amountName: string | null = null) {
        if (!Number.isFinite(price) || price <= 0 || numbers.length === 0) return;

        if (amountName) {
            const entries = numbers.map((number): SoldEntry => ({
                number: number.padStart(2, '0'),
                amount: price,
                amount_name: amountName,
                id: nextEntryId++
            }));
            namedSoldEntries = [...namedSoldEntries, ...entries];
            soldOrder = [
                ...soldOrder,
                ...entries.map((entry) => ({ type: 'named' as const, id: entry.id }))
            ];
        } else {
            const nextSold = { ...sold };
            const entries: UnnamedSoldEntry[] = numbers.map((number) => ({
                number: number.padStart(2, '0'),
                amount: price,
                id: nextEntryId++,
                is_reventado: reventadoNumber ? 1 : 0,
                is_megareventado: 0
            }));
            unnamedSoldEntries = [...unnamedSoldEntries, ...entries];
            soldOrder = [
                ...soldOrder,
                ...entries.map((entry) => ({ type: 'number' as const, id: entry.id }))
            ];
            for (const entry of entries) {
                nextSold[entry.number] = (nextSold[entry.number] ?? 0) + entry.amount;
            }
            sold = nextSold;
        }

        formElement?.reset();
        priceValue = '';
        selectedAmountName = null;
        reventadoNumber = false;
        priceInput?.focus();
    }

    function buildNumbersPayload(entries: UnnamedSoldEntry[], namedEntries: SoldEntry[]) {
        const grouped = new Map<string, {
            number: number;
            amount: number;
            is_reventado: number;
            is_megareventado: number;
        }>();

        for (const entry of entries) {
            const number = parseInt(entry.number, 10);
            const key = `${number}:${entry.is_reventado}:${entry.is_megareventado}`;
            const current = grouped.get(key);
            if (current) {
                current.amount += entry.amount;
            } else {
                grouped.set(key, {
                    number,
                    amount: entry.amount,
                    is_reventado: entry.is_reventado,
                    is_megareventado: entry.is_megareventado
                });
            }
        }

        return [
            ...Array.from(grouped.values()).map((entry) => ({ ...entry, amount_name: null })),
            ...namedEntries.map((entry) => ({
                number: parseInt(entry.number, 10),
                amount: entry.amount,
                is_reventado: 0,
                is_megareventado: 0,
                amount_name: entry.amount_name
            }))
        ];
    }

    function currentAmountsByNumber() {
        const amounts = { ...sold };
        for (const entry of namedSoldEntries) {
            amounts[entry.number] = (amounts[entry.number] ?? 0) + entry.amount;
        }
        return amounts;
    }

    function hasProhibitedNumbers(amounts: Record<string, number>) {
        const prohibited = $prohibitedNumbers.filter((item) =>
            amounts[item.number] !== undefined && item.can_sell_after_amount === false
        );
        if (prohibited.length === 0) return false;

        const matching = Object.fromEntries(
            Object.entries($sellingMatrix).filter(([number]) =>
                prohibited.some((item) => item.number === Number(number))
            )
        );

        const exceededByAmount = prohibited.filter((item) =>
            item.by_amount && Number(matching[item.number] ?? 0) >= item.amount
        );
        if (exceededByAmount.length > 0) {
            acts.add({
                message: exceededByAmount.length === 1
                    ? `El número ${exceededByAmount[0].number} excede el monto permitido.`
                    : `Los números ${exceededByAmount.map((item) => item.number).join(', ')} exceden el monto permitido.`,
                mode: 'error',
                lifetime: 3
            });
            return true;
        }

        const percentageLimit = $total * ($auth.user?.prohibitedPercentage
            ? $auth.user.prohibitedPercentage / 100
            : 100);
        const exceededByPercentage = prohibited.filter((item) =>
            item.by_percentage
            && Number(matching[item.number] ?? 0) >= percentageLimit
            && Number(matching[item.number] ?? 0) >= item.starter
        );
        if (exceededByPercentage.length > 0) {
            acts.add({
                message: exceededByPercentage.length === 1
                    ? `El número ${exceededByPercentage[0].number} excede lo que tienes permitido vender.`
                    : `Los números ${exceededByPercentage.map((item) => item.number).join(', ')} exceden lo que tienes permitido vender.`,
                mode: 'error',
                lifetime: 3
            });
            return true;
        }
        return false;
    }

    function canSellSelectedNumbers(drawScheduleId: number) {
        if (!drawScheduleId) {
            acts.add({ message: 'No se ha seleccionado un sorteo.', mode: 'error', lifetime: 3 });
            return false;
        }
        if (Object.keys(sold).length === 0 && namedSoldEntries.length === 0) {
            acts.add({ message: 'No hay números seleccionados.', mode: 'error', lifetime: 3 });
            return false;
        }
        return true;
    }

    function snapshotBetForPreview(bet: any) {
        if (!bet) return null;
        return {
            ...bet,
            positions: Array.isArray(bet.positions)
                ? bet.positions.map((position: any) => ({ ...position }))
                : []
        };
    }

    async function processTicket() {
        const drawScheduleId = selectedBet?.schedule_id ?? selectedBet?.draw_schedule_id;
        if (!canSellSelectedNumbers(drawScheduleId)) return;
        if (hasProhibitedNumbers(currentAmountsByNumber())) return;

        soldSnapshot = { ...sold };
        namedSoldEntriesSnapshot = [...namedSoldEntries];
        soldAmountNamesSnapshot = { ...soldAmountNames };
        isSubmitting = true;

        try {
            const response = await fetch('/puesto/venta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate,
                    draw_schedule_id: drawScheduleId,
                    details,
                    numbers: buildNumbersPayload(unnamedSoldEntries, namedSoldEntries)
                })
            });

            if (!response.ok) {
                acts.add({ message: 'Hubo un error al crear el tiquete.', mode: 'error', lifetime: 3 });
                return;
            }

            const responseBody = await response.json().catch(() => null);
            createdTicket = Array.isArray(responseBody?.items) ? responseBody.items[0] : null;
            ticketPreviewBet = snapshotBetForPreview(selectedBet);
            ticketPreviewDate = selectedDate;

            if (selectedDate === today) {
                sellingMatrix.update((matrix) => {
                    for (const [number, amount] of Object.entries(soldSnapshot)) {
                        matrix[number] = (matrix[number] || 0) + amount;
                    }
                    for (const entry of namedSoldEntriesSnapshot) {
                        matrix[entry.number] = (matrix[entry.number] || 0) + entry.amount;
                    }
                    return matrix;
                });
                total.update((amount) =>
                    amount
                    + Object.values(soldSnapshot).reduce((sum, item) => sum + item, 0)
                    + namedSoldEntriesSnapshot.reduce((sum, item) => sum + item.amount, 0)
                );
            }

            showTicketPreviewModal = true;
            cleanSell();
            detailsSnapshot = details;
            details = '';
        } catch (error) {
            console.error(error);
            acts.add({ message: 'Hubo un error al crear el tiquete.', mode: 'error', lifetime: 3 });
        } finally {
            isSubmitting = false;
        }
    }

    function cleanSell() {
        sold = {};
        unnamedSoldEntries = [];
        namedSoldEntries = [];
        soldOrder = [];
        soldAmountNames = {};
        selectedAmountName = null;
        reventadoNumber = false;
        priceValue = '';
        numberValue = '';
        selectedRowIndex = 0;
    }

    function deleteNumber(id: number | string) {
        const entry = typeof id === 'number'
            ? unnamedSoldEntries.find((item) => item.id === id)
            : unnamedSoldEntries.find((item) => item.number === id);
        if (!entry) return;
        unnamedSoldEntries = unnamedSoldEntries.filter((item) => item.id !== id);
        sold = { ...sold };
        sold[entry.number] = (sold[entry.number] ?? 0) - entry.amount;
        if (sold[entry.number] <= 0) delete sold[entry.number];
        soldOrder = soldOrder.filter((item) => item.type !== 'number' || item.id !== id);
    }

    function deleteEntry(index: number) {
        const entry = displayedSoldEntries[index];
        if (!entry) return;
        if (entry.type === 'number') {
            deleteNumber(entry.id);
        } else {
            namedSoldEntries = namedSoldEntries.filter((item) => item.id !== entry.id);
            soldOrder = soldOrder.filter((item) =>
                item.type !== 'named' || item.id !== entry.id
            );
        }
        selectedRowIndex = Math.max(0, selectedRowIndex - 1);
    }

    function loadTicketEntries(entries: Array<{
        number: string;
        amount: number;
        amount_name: string | null;
        is_reventado?: number | boolean;
        is_megareventado?: number | boolean;
    }>) {
        const unnamedAmounts: Record<string, number> = {};
        const unnamed: UnnamedSoldEntry[] = [];
        const named: SoldEntry[] = [];
        const order: SoldOrderEntry[] = [];

        for (const item of entries) {
            const number = String(item.number).padStart(2, '0');
            if (item.amount_name) {
                const entry: SoldEntry = {
                    number,
                    amount: item.amount,
                    amount_name: item.amount_name,
                    id: nextEntryId++
                };
                named.push(entry);
                order.push({ type: 'named', id: entry.id });
            } else {
                const entry: UnnamedSoldEntry = {
                    number,
                    amount: item.amount,
                    id: nextEntryId++,
                    is_reventado: Number(Boolean(item.is_reventado)),
                    is_megareventado: Number(Boolean(item.is_megareventado))
                };
                unnamed.push(entry);
                order.push({ type: 'number', id: entry.id });
                unnamedAmounts[number] = (unnamedAmounts[number] ?? 0) + item.amount;
            }
        }

        sold = unnamedAmounts;
        unnamedSoldEntries = unnamed;
        namedSoldEntries = named;
        soldOrder = order;
        numberInput?.focus();
    }

    async function viewTickets() {
        tickets = await getTickets();
        showTicketsModal = true;
    }

    async function handlePrint(event?: SubmitEvent) {
        event?.preventDefault();
        const drawScheduleId = selectedBet?.schedule_id ?? selectedBet?.draw_schedule_id;
        if (!showTicketPreviewModal
            && canSellSelectedNumbers(drawScheduleId)
            && !hasProhibitedNumbers(currentAmountsByNumber())) {
            showConfirmModal = true;
        }
    }

    async function handleConfirmDetails() {
        showConfirmModal = false;
        await processTicket();
    }

    async function handleKeydown(event: KeyboardEvent) {
        if (event.repeat) return;
        if (showConfirmModal) {
            if (event.key === 'Enter') {
                event.preventDefault();
                await handleConfirmDetails();
            }
            return;
        }
        if (showTicketPreviewModal || showTicketsModal || showJalarModal || showQrModal) return;

        switch (event.key) {
            case 'r':
            case 'R':
                await handlePrint();
                break;
            case 't':
            case 'T':
                await viewTickets();
                break;
            case 'j':
            case 'J':
                showJalarModal = true;
                break;
            case 'q':
            case 'Q':
                hasProhibitedNumbers(currentAmountsByNumber());
                break;
            case 'x':
            case 'X':
                if (displayedSoldEntries.length > 0) deleteEntry(selectedRowIndex);
                break;
            case 'ArrowDown':
                event.preventDefault();
                selectedRowIndex = Math.min(selectedRowIndex + 1, displayedSoldEntries.length - 1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                selectedRowIndex = Math.max(selectedRowIndex - 1, 0);
                break;
        }
    }

    $effect(() => {
        isPrintConfirmationOpen = showConfirmModal;
    });
</script>

<svelte:window onkeydown={handleKeydown} />

<TicketPreviewModal
    bind:showTicketPreviewModal
    createdTicket
    bind:sold={soldSnapshot}
    amountNames={soldAmountNamesSnapshot}
    entries={namedSoldEntriesSnapshot}
    details={detailsSnapshot}
    selectedBet={ticketPreviewBet}
    selectedDate={ticketPreviewDate}
/>

<QrModal
    bind:showQRModal={showQrModal}
    data={sold}
    total={soldAmount}
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
    bind:tickets
    bind:numbersSold={sold}
    getSoldNumbersForTicket={getSoldNumbersForTicket}
    getSoldAmountNamesForTicket={getSoldAmountNamesForTicket}
    getSoldEntriesForTicket={getSoldEntriesForTicket}
    loadSoldEntries={loadTicketEntries}
/>

<JalarTicketModal
    bind:showModal={showJalarModal}
    bind:numbersSold={sold}
    loadSoldEntries={loadTicketEntries}
/>

<section class="sell">
    {#if selectedAmountName}
        <span class="selected-amount-name">Rifa: {selectedAmountName}</span>
    {/if}
    <span class="sold-amount">Tiquete: ₡{formatAmount(soldAmount)}</span>
    <SaleForm
        bind:priceValue
        bind:numberValue
        bind:reventadoNumber
        bind:priceInput
        bind:numberInput
        bind:formElement
        {updateSalesData}
    />
    {#if selectedBet?.draw_is_reventado}
        <div class="row">
            <Reventado
                bind:number={numberValue}
                bind:price={priceValue}
                bind:reventado={reventadoNumber}
            />
        </div>
    {/if}
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
            deleteNumber={deleteNumber}
        />
        <TicketActions
            {sold}
            {isSubmitting}
            handlePrint={handlePrint}
            bind:showQrModal
            bind:showJalarModal
            viewTickets={viewTickets}
        />
    </div>
</section>

<style>
    .sell {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        position: relative;
        padding: 1rem;
        box-sizing: border-box;
        background: #fff;
        border: 1px solid var(--color-border);
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
        min-height: 32rem;
        overflow: hidden;
        gap: 1rem;
        flex: 1.5;
    }

    .selected-amount-name {
        position: absolute;
        top: 1rem;
        right: 1rem;
        max-width: 45%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    :global(.buttons-group) {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
    }

    :global(.buttons-group button) {
        flex: 1;
    }

    .sold {
        width: 100%;
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }

    .sold-amount {
        margin-bottom: 1rem;
        margin-right: auto;
    }

    span {
        font-size: 1.25rem;
    }

    :global(.set-section .negative) {
        padding: .25rem 0;
        width: 100%;
    }
</style>
