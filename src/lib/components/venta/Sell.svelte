<script lang="ts">
    let {
        getTickets,
        getSoldNumbersForTicket,
        getSoldAmountNamesForTicket,
        getSoldEntriesForTicket,
        selectedBet,
        selectedDate,
        isPrintConfirmationOpen = $bindable(false),
        amountNameItems = [],
    } = $props();

    type SoldEntry = { number: string; amount: number; amount_name: string | null; id: number };
    type UnnamedSoldEntry = {
        number: string;
        amount: number;
        id: number;
        is_reventado: number;
        is_megareventado: number;
    };
    type SoldOrderEntry = { type: 'number'; id: number } | { type: 'named'; id: number };
    let sold= $state<Record<string, number>>({});
    let unnamedSoldEntries = $state<UnnamedSoldEntry[]>([]);
    let namedSoldEntries = $state<SoldEntry[]>([]);
    let soldOrder = $state<SoldOrderEntry[]>([]);
    let nextEntryId = 0;
    let soldAmountNames = $state<Record<string, string | null>>({});
    let priceInput: HTMLInputElement;
    let randomCountInput: HTMLInputElement;
    let priceValue = $state('');
    let selectedAmountName = $state<string | null>(null);
    let showTicketsModal = $state(false);
    let tickets = $state([]);
    let numberInput: HTMLInputElement;
    let randomCount = $state(1);
    let isSubmitting = $state(false);
    let selectedRowIndex = $state(0);
    let rowRefs: Array<HTMLTableRowElement | null> = [];
    let showTicketPreviewModal = $state(false);
    let ticketPreviewBet = $state<any>(null);
    let ticketPreviewDate = $state('');
    let details = $state('');

    function snapshotBetForPreview(bet: any) {
        if (!bet) return null;

        return {
            ...bet,
            positions: Array.isArray(bet.positions)
                ? bet.positions.map((position: any) => ({ ...position }))
                : []
        };
    }

    let detailsSnapshot = $state('');
    let soldSnapshot: Record<string, number> = $state({});
    let unnamedSoldEntriesSnapshot = $state<UnnamedSoldEntry[]>([]);
    let namedSoldEntriesSnapshot = $state<SoldEntry[]>([]);
    let soldAmountNamesSnapshot: Record<string, string | null> = $state({});
    let showConfirmModal = $state(false);
    let createdTicket: { ticket_serial: string; ticket_amount: number; printed_at: string; ticket_number: string } | null = $state(null);
    let formElement: HTMLFormElement;
    let soldAmount = $derived.by(() => Object.values(sold).reduce((sum, item) => sum + item, 0)
        + namedSoldEntries.reduce((sum, item) => sum + item.amount, 0));
    let displayedSoldEntries = $derived.by(() => [...soldOrder].reverse().flatMap((entry) => {
        if (entry.type === 'number') {
            const unnamedEntry = unnamedSoldEntries.find((item) => item.id === entry.id);
            return unnamedEntry
                ? [{ type: 'number' as const, number: unnamedEntry.number, price: unnamedEntry.amount, amount_name: null, id: unnamedEntry.id }]
                : [];
        }

        const namedEntry = namedSoldEntries.find((item) => item.id === entry.id);
        return namedEntry
            ? [{ type: 'named' as const, number: namedEntry.number, price: namedEntry.amount, amount_name: namedEntry.amount_name, id: namedEntry.id }]
            : [];
    }));
    let showJalarModal = $state(false);
    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
	const today = utcMinus6Date.toISOString().split('T')[0];

    import { onMount } from 'svelte';
    import { TrashBinSolid, CubeSolid, QuestionCircleSolid, PrinterSolid, EyeSolid, ReceiptSolid, CameraPhotoSolid } from "flowbite-svelte-icons";
    import { sellingMatrix } from '../../stores/UpdateSellMatrix';
    import { total } from '../../stores/UpdateSellMatrix';
    import TicketsModal from './TicketsModal.svelte';
    import { prohibitedNumbers } from "../../stores/UpdateSellMatrix";
    import { acts } from '@tadashi/svelte-notification';
    import { auth } from '../../stores/auth';
    import TicketPreviewModal from './TicketPreviewModal.svelte';
    import ConfirmModalWithInput from '../ConfirmModalWithInput.svelte';
    import JalarTicketModal from './JalarTicketModal.svelte';
    import { formatAmount } from '../../printing/printing';

    onMount(() => {
        priceInput?.focus();
    });

    function formatThousands(value: string) {
        const digitsOnly = value.replace(/\D/g, '');
        if (!digitsOnly) {
            return '';
        }
        return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function handlePriceInput(event: Event) {
        const target = event.target as HTMLInputElement;
        priceValue = formatThousands(target.value);
        selectedAmountName = null;
    }

    function handleNumberInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const raw = target.value.replace(/[^0-9+*\-]/g, '');
        let result = '';
        let digitCount = 0;
        let lastWasOperator = true;
        for (const char of raw) {
            if (char >= '0' && char <= '9') {
                if (digitCount < 2) {
                    result += char;
                    digitCount += 1;
                    lastWasOperator = false;
                }
                continue;
            }
            if (char === '+' || char === '-' || char === '*') {
                if (!lastWasOperator && digitCount > 0) {
                    result += char;
                    digitCount = 0;
                    lastWasOperator = true;
                    continue;
                }
                if (lastWasOperator && result.length === 0 && char === '*') {
                    result = '*';
                    continue;
                }
                if (lastWasOperator && result.length > 0) {
                    result = result.slice(0, -1) + char;
                }
            }
        }
        if (target.value !== result) {
            target.value = result;
        }
    }

    function updateSalesData(numbers: string[], price: number, amountName: string | null = null) {
        if (amountName) {
            namedSoldEntries = [...namedSoldEntries, ...numbers.map((number) => ({
                number,
                amount: price,
                amount_name: amountName,
                id: nextEntryId++
            }))];
            soldOrder = [
                ...soldOrder,
                ...namedSoldEntries.slice(-numbers.length).map((entry) => ({ type: 'named' as const, id: entry.id }))
            ];
            formElement.reset();
            priceInput?.focus();
            priceValue = '';
            selectedAmountName = null;
            return;
        }
        const newSelled = { ...sold };
        numbers.forEach((num) => {
            const unnamedEntry = {
                number: num,
                amount: price,
                id: nextEntryId++,
                is_reventado: 0,
                is_megareventado: 0
            };
            unnamedSoldEntries = [...unnamedSoldEntries, unnamedEntry];
            soldOrder = [...soldOrder, { type: 'number', id: unnamedEntry.id }];
            newSelled[num] = (newSelled[num] ?? 0) + price;
        });
        sold = newSelled;
        selectedAmountName = null;
        formElement.reset();
        priceInput?.focus();
        priceValue = '';
    }

    function buildNumbersPayload(entries: UnnamedSoldEntry[], namedEntries: SoldEntry[]) {
        const unnamedByGroup = new Map<string, {
            number: number;
            amount: number;
            is_reventado: number;
            is_megareventado: number;
        }>();
        for (const entry of entries) {
            const number = parseInt(entry.number, 10);
            const key = `${number}:${entry.is_reventado}:${entry.is_megareventado}`;
            const current = unnamedByGroup.get(key);
            if (current) {
                current.amount += entry.amount;
            } else {
                unnamedByGroup.set(key, {
                    number,
                    amount: entry.amount,
                    is_reventado: entry.is_reventado,
                    is_megareventado: entry.is_megareventado
                });
            }
        }
        const unnamed = Array.from(unnamedByGroup.values()).map((entry) => ({
            ...entry,
            amount_name: null
        }));
        return [
            ...unnamed,
            ...namedEntries.map((entry) => ({
                number: parseInt(entry.number, 10),
                amount: entry.amount,
                is_reventado: 0,
                is_megareventado: 0,
                amount_name: entry.amount_name
            }))
        ];
    }

    function expandNumberExpression(numberInput: string): string[] {
        const parts = numberInput.split('+').map((part) => part.trim()).filter(Boolean);
        const expandedNumbers: string[] = [];
        const addIfValid = (value: number) => {
            if (Number.isInteger(value) && value >= 0 && value <= 99) {
                expandedNumbers.push(String(value));
            }
        };

        parts.forEach((part) => {
            if (part.includes('*')) {
                const cleaned = part.replace('*', '').trim();
                const base = parseInt(cleaned, 10);
                if (Number.isNaN(base)) {
                    return;
                }

                if (part.startsWith('*') && !part.endsWith('*')) {
                    if (base < 10) {
                        for (let i = 0; i < 10; i++) {
                            addIfValid(i * 10 + base);
                        }
                    } else {
                        addIfValid(base);
                    }
                    return;
                }

                const baseNum = base * 10;
                for (let i = 0; i < 10; i++) {
                    addIfValid(baseNum + i);
                }
                return;
            }

            if (part.includes('-')) {
                const [startRaw, endRaw] = part.split('-').map((value) => value.trim());
                const start = parseInt(startRaw, 10);
                const end = parseInt(endRaw, 10);
                if (Number.isNaN(start) || Number.isNaN(end)) {
                    return;
                }

                const from = Math.min(start, end);
                const to = Math.max(start, end);
                for (let value = from; value <= to; value++) {
                    addIfValid(value);
                }
                return;
            }

            addIfValid(parseInt(part, 10));
        });

        return expandedNumbers;
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

    function currentAmountsByNumber() {
        const amounts = { ...sold };
        for (const entry of namedSoldEntries) {
            amounts[entry.number] = (amounts[entry.number] ?? 0) + entry.amount;
        }
        return amounts;
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
        if (Object.keys(sold).length === 0 && namedSoldEntries.length === 0){
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
        soldSnapshot = { ...sold };
        unnamedSoldEntriesSnapshot = [...unnamedSoldEntries];
        soldAmountNamesSnapshot = { ...soldAmountNames };
        namedSoldEntriesSnapshot = [...namedSoldEntries];
        if (hasProhibitedNumbers(currentAmountsByNumber())) return;
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
                    numbers: buildNumbersPayload(unnamedSoldEntriesSnapshot, namedSoldEntriesSnapshot)
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
            ticketPreviewBet = snapshotBetForPreview(selectedBet);
            ticketPreviewDate = selectedDate;
            if (selectedDate === today) {
                sellingMatrix.update((matrix) => {
                    for (const [number, price] of Object.entries(soldSnapshot)) {
                        matrix[number] = (matrix[number] || 0) + price;
                    }
                    for (const entry of namedSoldEntriesSnapshot) {
                        matrix[entry.number] = (matrix[entry.number] || 0) + entry.amount;
                    }
                    return matrix;
                });
                total.update((n) => n
                    + Object.values(soldSnapshot).reduce((sum, item) => sum + item, 0)
                    + namedSoldEntriesSnapshot.reduce((sum, item) => sum + item.amount, 0));
            }
            showTicketPreviewModal = true;
            sold = {};
            unnamedSoldEntries = [];
            soldAmountNames = {};
            namedSoldEntries = [];
            soldOrder = [];
            detailsSnapshot = details;
            details = '';
        } catch (error) {
            isSubmitting = false;
            console.error(error);
            acts.add({
                message: 'Hubo un error al crear el tiquete.',
                mode: 'error',
                lifetime: 3
            });
        }
    }

    function deleteNumber(id: number) {
        const entry = unnamedSoldEntries.find((item) => item.id === id);
        if (!entry) return;
        unnamedSoldEntries = unnamedSoldEntries.filter((item) => item.id !== id);
        sold = { ...sold };
        sold[entry.number] -= entry.amount;
        if (sold[entry.number] <= 0) delete sold[entry.number];
        soldOrder = soldOrder.filter((item) => item.type !== 'number' || item.id !== id);
    }

    function deleteEntry(index: number) {
        const entry = displayedSoldEntries[index];
        if (!entry) return;

        if (entry.type === 'number') {
            deleteNumber(entry.id);
            return;
        }

        namedSoldEntries = namedSoldEntries.filter((namedEntry) => namedEntry.id !== entry.id);
        soldOrder = soldOrder.filter((orderedEntry) =>
            orderedEntry.type !== 'named' || orderedEntry.id !== entry.id
        );
    }

    function loadTicketEntries(entries: Array<{
        number: string;
        amount: number;
        amount_name: string | null;
        is_reventado?: number | boolean;
        is_megareventado?: number | boolean;
    }>) {
        const unnamedAmounts: Record<string, number> = {};
        const nextUnnamedEntries: UnnamedSoldEntry[] = [];
        const nextNamedEntries: SoldEntry[] = [];
        const nextOrder: SoldOrderEntry[] = [];

        for (const entry of entries) {
            const number = String(entry.number).padStart(2, '0');
            if (entry.amount_name) {
                const namedEntry = {
                    number,
                    amount: entry.amount,
                    amount_name: entry.amount_name,
                    id: nextEntryId++
                };
                nextNamedEntries.push(namedEntry);
                nextOrder.push({ type: 'named', id: namedEntry.id });
                continue;
            }

            const unnamedEntry = {
                number,
                amount: entry.amount,
                id: nextEntryId++,
                is_reventado: Number(Boolean(entry.is_reventado)),
                is_megareventado: Number(Boolean(entry.is_megareventado))
            };
            nextUnnamedEntries.push(unnamedEntry);
            nextOrder.push({ type: 'number', id: unnamedEntry.id });
            unnamedAmounts[number] = (unnamedAmounts[number] ?? 0) + entry.amount;
        }

        sold = unnamedAmounts;
        unnamedSoldEntries = nextUnnamedEntries;
        soldAmountNames = {};
        namedSoldEntries = nextNamedEntries;
        soldOrder = nextOrder;
        selectedAmountName = null;
        priceValue = '';
        numberInput?.focus();
    }

    function onSubmit(event: Event) {
        event.preventDefault();
        processForm();
    }

    function processForm() {
        // const formData = new FormData(event.target as HTMLFormElement);
	    const formData = new FormData(formElement);
        const numberInput = formData.get("number") as string;
        const price = (formData.get("price") as string).replace(/\./g, '');

        if (!numberInput || !price) {
            return;
        }

        updateSalesData(
            expandNumberExpression(numberInput),
            parseInt(price, 10),
            selectedAmountName
        );
    }

    function cleanSell() {
        if (Object.keys(sold).length === 0 && namedSoldEntries.length === 0) {
            return;
        }
        sold = {};
        soldAmountNames = {};
        namedSoldEntries = [];
        soldOrder = [];
    }

    function handleAmountNameShortcut(event: KeyboardEvent) {
        if (
            event.repeat ||
            showConfirmModal ||
            showTicketPreviewModal ||
            showTicketsModal ||
            showJalarModal ||
            event.target instanceof HTMLTextAreaElement ||
            (event.target instanceof HTMLElement && event.target.isContentEditable)
        ) {
            return false;
        }

        const shortcut = amountNameItems.find((item: { key?: string }) =>
            String(item.key ?? '').toLowerCase() === event.key.toLowerCase()
        );
        const amount = shortcut ? Number(shortcut.amount) : NaN;

        if (!shortcut || !Number.isFinite(amount) || amount < 0) {
            return false;
        }

        event.preventDefault();
        selectedAmountName = shortcut.name;
        priceValue = formatThousands(String(shortcut.amount));
        numberInput?.focus();
        return true;
    }

    function generateRandomNumbers() {
        if (!priceValue.trim()) {
            randomCountInput?.focus();
            randomCountInput?.select();
            return;
        }

        const price = parseInt(priceValue.replace(/\./g, ''), 10);
        if (!price || Number.isNaN(price)) {
            priceInput?.focus();
            return;
        }

        const rawCount = Number(randomCount);
        const requestedCount = Math.min(100, Math.max(1, Number.isFinite(rawCount) ? Math.floor(rawCount) : 1));
        const existingNumbers = new Set(Object.keys(sold).map((num) => parseInt(num, 10)));
        const pool = Array.from({ length: 100 }, (_, i) => i).filter(
            (num) => !existingNumbers.has(num)
        );
        if (pool.length === 0) {
            return;
        }

        const count = Math.min(requestedCount, pool.length);
        const numbers: string[] = [];

        for (let i = 0; i < count; i++) {
            const index = Math.floor(Math.random() * pool.length);
            const picked = pool.splice(index, 1)[0];
            numbers.push(String(picked).padStart(2, "0"));
        }

        updateSalesData(numbers, price);
        priceInput?.focus();
        priceValue = '';
        randomCount = 1;
    }

    function generatePairs() {
        if (!priceValue.trim()) {
            priceInput?.focus();
            return;
        }

        const price = parseInt(priceValue.replace(/\./g, ''), 10);
        if (!price || Number.isNaN(price)) {
            return;
        }

        const pairNumbers = Array.from({ length: 10 }, (_, i) => String(i * 11));
        if (pairNumbers.length === 0) {
            return;
        }

        updateSalesData(pairNumbers, price);
    }

    async function viewTickets() {
        tickets = await getTickets();
        showTicketsModal = true;
    }

    function onJalar() {
        showJalarModal = true;
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

        if (handleAmountNameShortcut(event)) {
            return;
        }

        switch (event.key) {
            case "Enter":
                event.preventDefault();
                if (isTyping && target instanceof HTMLInputElement && target.id === 'random-count') {
                    processForm();
                    priceInput?.focus();
                } else if (target instanceof HTMLInputElement && target.id === 'number') {
                    if (priceValue.trim()) {
                        processForm();
                        priceInput?.focus();
                    } else {
                        target.blur();
                        priceInput?.focus();
                    }
                } else if (target instanceof HTMLInputElement && target.id === 'price') {
                    numberInput?.focus();
                } else if (showTicketPreviewModal || showTicketsModal || showJalarModal) {
                    return;
                }
                else {
                    event.preventDefault();
                    priceInput?.focus();
                }
                break;
            case "a":
            case "A":
                processForm();
                break;
            case "r":
            case "R":
                await handlePrint();
                break;
            case "t":
            case "T":
                viewTickets();
                break;
            case "J":
            case "j":
                onJalar();
                break;
            case "p":
            case "P":
                generatePairs();
                break;
            case "l":
            case "L":
                cleanSell();
                break;
            case "i":
            case "I":
                generateRandomNumbers();
                break;
            case "ArrowDown":
                if (showTicketPreviewModal || showTicketsModal || showJalarModal) {
                    return;
                }
                event.preventDefault();
                selectedRowIndex = Math.min(selectedRowIndex + 1, Object.keys(sold).length - 1);
                break;
            case "ArrowUp":
                if (showTicketPreviewModal || showTicketsModal || showJalarModal) {
                    return;
                }
                event.preventDefault();
                selectedRowIndex = Math.max(selectedRowIndex - 1, 0);
                break;
            case "x":
            case "X":
                if (selectedRowIndex >= 0) {
                    deleteEntry(selectedRowIndex);
                    selectedRowIndex = Math.max(0, selectedRowIndex - 1);
                }
                break;
            case "q":
            case "Q":
                hasProhibitedNumbers(currentAmountsByNumber());
                break;
        }
    }

    async function handlePrint(event?: SubmitEvent) {
        event?.preventDefault();

        const drawScheduleId = selectedBet?.schedule_id ?? selectedBet?.draw_schedule_id;
        if(!showTicketPreviewModal && canSellSelectedNumbers(drawScheduleId) && !hasProhibitedNumbers(currentAmountsByNumber())) {
            showConfirmModal = true;
        }
    }

    async function handleConfirmDetails() {
        showConfirmModal = false;
        await processTicket();
    }

    $effect(() => {
        isPrintConfirmationOpen = showConfirmModal;
    });

</script>

<TicketPreviewModal
    bind:showTicketPreviewModal={showTicketPreviewModal}
    createdTicket={createdTicket}
    bind:sold={soldSnapshot}
    amountNames={soldAmountNamesSnapshot}
    entries={namedSoldEntriesSnapshot}
    details={detailsSnapshot}
    selectedBet={ticketPreviewBet}
    selectedDate={ticketPreviewDate}
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
    getSoldAmountNamesForTicket={getSoldAmountNamesForTicket}
    getSoldEntriesForTicket={getSoldEntriesForTicket}
    loadSoldEntries={loadTicketEntries}
/>

<JalarTicketModal
    bind:showModal={showJalarModal}
    bind:numbersSold={sold}
    loadSoldEntries={loadTicketEntries}
/>

<svelte:window onkeydown={handlekeyinput} />
<section class="sell">
    {#if selectedAmountName}
        <span class="selected-amount-name">Rifa: {selectedAmountName}</span>
    {/if}
    <span class="sold-amount">Tiquete: ₡{formatAmount(soldAmount)}</span>
    <form onsubmit={onSubmit} bind:this={formElement}>
        <div class="question monto">
            <label for="price">Monto:</label>
            <input
                type="text"
                inputmode="numeric"
                pattern="[0-9.]*"
                id="price"
                name="price"
                bind:this={priceInput}
                bind:value={priceValue}
                oninput={handlePriceInput}
            />
        </div>
        <div class="question numero">
            <label for="number">Numero:</label>
            <input
                id="number"
                name="number"
                inputmode="numeric"
                pattern="[0-9+*\-]*"
                min="0"
                max="99"
                bind:this={numberInput}
                oninput={handleNumberInput}
            />
        </div>
        <button type="submit"><div class="button-name"><p>A</p>gregar</div></button>
    </form>
    <div class="buttons-group">
        <button
            onclick={cleanSell}
            disabled={Object.keys(sold).length === 0 && namedSoldEntries.length === 0}
        >
            <TrashBinSolid class="shrink-0 h-4 w-4" />
            <div class="button-name"><p>L</p>impiar</div>
        </button>
        <button onclick={generatePairs}>
            <CubeSolid class="shrink-0 h-4 w-4" />
            <div class="button-name"><p>P</p>ares</div>
        </button>
        <div class="random-controls">
            <button onclick={generateRandomNumbers}>
                <QuestionCircleSolid class="shrink-0 h-4 w-4" />
                <div class="button-name">Aleator<p>i</p>o</div>
            </button>
            <input
                class="random-count"
                id="random-count"
                type="number"
                min="1"
                max="100"
                step="1"
                bind:value={randomCount}
                bind:this={randomCountInput}
                aria-label="Cantidad de aleatorios"
            />
        </div>
    </div>
    <div class="sold">
        <div class="sold-table scroll-thin">
            <table>
                <thead>
                    <tr>
                        <th>Numero</th>
                        <th>Monto</th>
                    </tr>
                </thead>
                <tbody>
                    {#each displayedSoldEntries as entry, index}
                        <tr
                            bind:this={rowRefs[index]}
                            class:selected-row = {index === selectedRowIndex}
                            onclick={() => {
                                selectedRowIndex = index;
                            }}

                        >
                            <td>{entry.number}</td>
                            <td>{entry.amount_name || `₡${entry.price}`}</td>
                            <td>
                                <button class="negative" onclick={() => deleteEntry(index)}>X</button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    <form onsubmit={handlePrint}>
        <button
            type="submit"
            disabled={(Object.keys(sold).length === 0 && namedSoldEntries.length === 0) || isSubmitting}
        >
            <PrinterSolid class="shrink-0 h-4 w-4" />
            <div class="button-name">Imp<p>r</p>imir</div>
        </button>
    </form>
    <div class="buttons-group">
            <button onclick={onJalar}>
                <CameraPhotoSolid class="shrink-0 h-4 w-4" />
                <div class="button-name"><p>J</p>alar tiquete</div>
            </button>
            <button onclick={viewTickets}>
                <ReceiptSolid class="shrink-0 h-4 w-4" />
                <div class="button-name"><p>T</p>iquetes</div>
            </button>

        </div>
    </div>
</section>
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

    .selected-amount-name {
        position: absolute;
        top: 1rem;
        right: 1rem;
        max-width: 45%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .sell::before {
        top: -4px;
    }

    .sell::after {
        bottom: -4px;
    }

    .sell form {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        width: 100%;
        gap: 1rem;
    }

    span{
        font-size: 1.25rem;
    }

    .sold-amount {
        margin-bottom: 1rem;
        margin-right: auto;
    }

    .question {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .question input {
        width: 100%;
    }

    .question.monto {
        flex: 1;
    }

    .question.numero {
        flex: 4;
    }

    .sold {
        width: 100%;
        flex:1;
    }
    .sold-table {
        max-height: 330px;
        overflow-y: auto;
    }

    .sold table {
        width: 100%;
        border-collapse: collapse;
    }

    :global(.set-section th),
    :global(.set-section td) {
        padding: 0.25rem 0.5rem;
        text-align: left;
        border: 1px solid #ccc;
    }

    .sold th {
        background-color: var(--color-box-background);
        font-weight: 600;
        border: 1px solid #ccc;
        border-bottom: 2px solid #ccc;
        position: sticky;
        top: 0;
        z-index: 2;
    }

    .sold tr:hover {
        background-color: #f9fafb;
    }

    .sold button {
        width: 100%;
    }

    :global(.set-section  .negative) {
        padding: 0.25rem 0rem;
    }

    .buttons-group {
        display: flex;
        gap: 0.5rem;
        margin: 1rem 0;
        width: 100%;
        font-size: medium;
    }

    .buttons-group button {
        flex: 1;
        padding: 0.5rem 0.5rem;
    }

    .random-controls {
        display: flex;
        gap: 0.5rem;
        border-radius: 0.25rem;
        background-color: var(--color-theme-1);
        padding: 0.5rem 1rem;
        flex:1;
    }

    .random-controls button {
        flex: 1;
        background: none;
        padding: 0;
    }

    .random-controls input {
        width: 2rem;
        padding: 0rem;
        text-align: center;
    }

    .selected-row {
        outline: 2px solid var(--color-theme-1);
        outline-offset: -2px;
    }

</style>
