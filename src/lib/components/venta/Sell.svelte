<script lang="ts">
    let sold= $state<Record<string, { price: number }>>({}); 
    let soldAmount = $state(0);
    let priceInput: HTMLInputElement;
    let randomCountInput: HTMLInputElement;
    let priceValue = $state('');
    let showQrModal = $state(false);
    let showTicketsModal = $state(false);
    let tickets = $state([]);
    let numberInput: HTMLInputElement;
    let randomCount = $state(1);
    let isSubmitting = $state(false);
    let submitError = $state('');
    let {getTickets, getSoldNumbersForTicket, selectedBet, handlePDFPrint, selectedDate} = $props();
    let selectedRowIndex = $state(0);
    let rowRefs: Array<HTMLTableRowElement | null> = [];
    let showTicketPreviewModal = $state(false); 
    let details = $state('');
    let detailsSnapshot = $state('');
    let soldSnapshot: Record<string, { price: number }> = $state({});
    let createdTicket: { ticket_serial: string; ticket_amount: number; printed_at: string; ticket_number: string } | null = $state(null);
    let showConfirmModal = $state(false);
    let showScanQrModal = $state(false);
    let qrScanInput = $state('');
    let formElement: HTMLFormElement;
    
    import { onMount } from 'svelte';
    import { TrashBinSolid, CubeSolid, QuestionCircleSolid, PrinterSolid, EyeSolid, ReceiptSolid, CameraPhotoSolid } from "flowbite-svelte-icons";
    import { sellingMatrix } from '../../stores/UpdateSellMatrix';
    import { total } from '../../stores/UpdateSellMatrix';
    import QrModal from './QrModal.svelte';
    import TicketsModal from './TicketsModal.svelte';
    import { prohibitedNumbers } from "../../stores/UpdateSellMatrix";
    import { Notifications, acts } from '@tadashi/svelte-notification';
    import { auth } from '../../stores/auth';
    import TicketPreviewModal from './TicketPreviewModal.svelte';
    import ConfirmModalWithInput from '../ConfirmModalWithInput.svelte';
    import QrScanModal from './QrScanModal.svelte';

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

    function updateSalesData(numbers: string[], price: number) {
        const newSelled = { ...sold };
        numbers.forEach((num) => {
            if (newSelled[num]) {
                newSelled[num].price += price;
            } else {
                newSelled[num] = { price };
            }
        });
        sold = newSelled;
        soldAmount = Object.values(sold).reduce((sum, item) => sum + item.price, 0);
        formElement.reset();
        priceInput?.focus();
        priceValue = '';
    }

    function buildNumbersPayload(values: Record<string, { price: number }>) {
        return Object.entries(values).map(([number, price]) => ({
            number: parseInt(number, 10),
            amount: price.price,
            is_reventado: 0,
            is_megareventado: 0
        }));
    }

    async function submitTicket(event: Event) {
        event.preventDefault();
        await processTicket();
        showTicketPreviewModal = true;
    }

    function hasProhibitedNumbers(soldSnapshot: Record<string, { price: number }>) {
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
        submitError = '';

        const drawScheduleId = selectedBet?.schedule_id ?? selectedBet?.draw_schedule_id;
        if (!canSellSelectedNumbers(drawScheduleId)) return;
            
        soldSnapshot = { ...sold };
        isSubmitting = true;

        if (hasProhibitedNumbers(soldSnapshot)) return;

        const response = await fetch('/puesto/venta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                draw_schedule_id: drawScheduleId,
                details: details,
                numbers: buildNumbersPayload(soldSnapshot)
            })
        });

        isSubmitting = false;

        if (!response.ok) {
            submitError = 'No se pudo crear el tiquete.';
            return;
        }

        const responseBody = await response.json().catch(() => null);
        createdTicket = Array.isArray(responseBody?.items) ? responseBody.items[0] : null;

        sellingMatrix.update((matrix) => {
            for (const [number, price] of Object.entries(soldSnapshot)) {
                matrix[number] = (matrix[number] || 0) + price.price;
            }
            return matrix;
        });
        total.update((n) => n + Object.values(soldSnapshot).reduce((sum, item) => sum + item.price, 0));
        sold = {};
        soldAmount = 0;
        detailsSnapshot = details;        
        details = '';
    }

    function deleteNumber(number: string) {
        const { [number]: _, ...rest } = sold;
        soldAmount -= sold[number]?.price || 0;
        sold = rest;
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

        // Split by plus sign
        const parts: string[] = numberInput.split('+').map((n) => n.trim()).filter((n) => n);

        const expandedNumbers: string[] = [];
        const addIfValid = (value: number) => {
            if (Number.isNaN(value) || value < 0 || value > 99) {
                return;
            }
            expandedNumbers.push(String(value));
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
                const [startRaw, endRaw] = part.split('-').map((n) => n.trim());
                const start = parseInt(startRaw, 10);
                const end = parseInt(endRaw, 10);
                if (Number.isNaN(start) || Number.isNaN(end)) {
                    return;
                }
                const from = Math.min(start, end);
                const to = Math.max(start, end);
                for (let i = from; i <= to; i++) {
                    addIfValid(i);
                }
                return;
            }

            addIfValid(parseInt(part, 10));
        });

        updateSalesData(expandedNumbers, parseInt(price, 10));
    }

    function cleanSell() {
        if (Object.keys(sold).length === 0) {
            return;
        }
        sold = {};
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

    // TODO: Implement functionality for these buttons
    function viewQR() {
        // if (Object.keys(sold).length === 0) {
        //     return;
        // }
        showQrModal = true;
    }

    async function scanQR() {
        showScanQrModal = true;
    }

    async function viewTickets() {
        tickets = await getTickets();
        showTicketsModal = true;
    }

    function closeTicketsModal() {
        showTicketsModal = false;
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
                }
                else {
                    event.preventDefault();
                    priceInput?.focus();
                }
                break;
            case "a":
            case "A":
                // Agregar button
                processForm();
                break;
            case "r":
            case "R":
                await handlePrint();    
                break;
            case "t":
            case "T":
                // Ver Tiquetes button
                viewTickets();
                break;
            case "e":
            case "E":
                // Escanear QR button
                scanQR();
                break;
            case "v":
            case "V":
                //TODO : Ver QR button
                break;
            case "p":
            case "P":
                //TODO : Pares button
                generatePairs();
                break;
            case "l":
            case "L":
                // Limpiar button
                cleanSell();
                break;
            case "i":
            case "I":
                generateRandomNumbers();
                // Limpiar inputs 
                // 
                break;
            case "ArrowDown":
                event.preventDefault();
                console.log('Current sold keys:');
                selectedRowIndex = Math.min(selectedRowIndex + 1, Object.keys(sold).length - 1);
                break;
            case "ArrowUp":
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
            case "d":
            case "D":
                handleConfirmPDF();
                break;
        }
    }
    async function handleConfirmPDF() {
        if (createdTicket) {
            const ticketRow = {
                id: 0,
                serial: createdTicket.ticket_serial,
                total: Number(createdTicket.ticket_amount) || 0,
                details: '',
                time: createdTicket.printed_at ?? '',
                date: selectedDate ?? '',
                status: true
            };
            const soldNumbers = Object.entries(soldSnapshot).map(([number, price]) => ({
                number: String(number).padStart(2, '0'),
                price: price.price
            }));
            await handlePDFPrint(ticketRow, soldNumbers, createdTicket.ticket_number ?? null);
            sold = {};
            soldAmount = 0;
        }

    }

    function closeQrModal() {
        showQrModal = false;
    }

    function isValidTicketSerial(serial: string) {
        if (!/^\d{16}$/.test(serial)) {
            return false;
        }

        const year = Number(serial.slice(0, 2));
        const month = Number(serial.slice(2, 4));
        const day = Number(serial.slice(4, 6));
        const hour = Number(serial.slice(6, 8));
        const minute = Number(serial.slice(8, 10));
        const second = Number(serial.slice(10, 12));

        return (
            Number.isInteger(year) &&
            month >= 1 && month <= 12 &&
            day >= 1 && day <= 31 &&
            hour >= 0 && hour <= 23 &&
            minute >= 0 && minute <= 59 &&
            second >= 0 && second <= 59
        );
    }

    function decodeQrData(qrData: string) {
        const normalized = qrData.trim().toUpperCase();

        if (!normalized || /[^0-9A-F]/.test(normalized)) {
            return null;
        }

        for (let prefixLength = normalized.length - 8; prefixLength >= 0; prefixLength -= 8) {
            const serialHex = normalized.slice(prefixLength);
            let serialDecimal = '';

            // try {
            //     serialDecimal = BigInt(`0x${serialHex}`).toString(10);
            // } catch {
            //     continue;
            // }

            // if (!isValidTicketSerial(serialDecimal)) {
            //     continue;
            // }

            const decodedSold: Record<string, { price: number }> = {};

            for (let index = 0; index < prefixLength; index += 8) {
                const chunk = normalized.slice(index, index + 8);
                const number = Number.parseInt(chunk.slice(0, 2), 16);
                const price = Number.parseInt(chunk.slice(2), 16);

                if (Number.isNaN(number) || Number.isNaN(price) || number < 0 || number > 99) {
                    continue;
                }

                decodedSold[String(number).padStart(2, '0')] = { price };
            }

            return decodedSold;
        }

        return null;
    }

    async function handlePrint() {
        const drawScheduleId = selectedBet?.schedule_id ?? selectedBet?.draw_schedule_id;
        if(!showTicketPreviewModal && canSellSelectedNumbers(drawScheduleId)) {
            showConfirmModal = true;
        }
    }

    async function handleConfirmDetails() {
        showConfirmModal = false;
        await processTicket();
        showTicketPreviewModal = true;
    }
    
    function handleConfirmScanQrModal() {
        const decodedSold = decodeQrData(qrScanInput);

        if (!decodedSold) {
            acts.add({
                message: 'No se pudo leer el QR.',
                mode: 'error',
                lifetime: 3
            });
            return;
        }

        sold = decodedSold;
        soldAmount = Object.values(decodedSold).reduce((sum, item) => sum + item.price, 0);
        selectedRowIndex = 0;
        showScanQrModal = false;
        qrScanInput = '';
    }
</script>

<TicketPreviewModal 
    bind:showTicketPreviewModal={showTicketPreviewModal} 
    createdTicket={createdTicket}
    bind:sold={soldSnapshot}
    details={detailsSnapshot}
    handleConfirmPDF={handleConfirmPDF}
    selectedBet={selectedBet}
    selectedDate={selectedDate}
/>

<QrModal 
    bind:showQRModal={showQrModal}
    data={$sellingMatrix} 
    total={$total}
    date={selectedDate}
    onClose={closeQrModal} 
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
    onClose={closeTicketsModal} 
    getSoldNumbersForTicket={getSoldNumbersForTicket}
/>

<QrScanModal
    bind:showModal={showScanQrModal}
    bind:input={qrScanInput}
    confirm={handleConfirmScanQrModal}
/>

<svelte:window onkeydown={handlekeyinput} />
<section class="sell">
    <span class="sold-amount">Tiquete: ₡{soldAmount}</span>

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
            disabled={Object.keys(sold).length === 0}
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
                    {#each Object.entries(sold) as [number, price], index}
                        <tr
                            bind:this={rowRefs[index]}
                            class:selected-row = {index === selectedRowIndex}
                            onclick={() => {
                                selectedRowIndex = index;
                            }}

                        >
                            <td>{number}</td>
                            <td>₡{price.price}</td>
                            <td>
                                <button class="negative" onclick={() => deleteNumber(number)}>X</button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    <form onsubmit={submitTicket}>
        <button
            type="submit"
            disabled={Object.keys(sold).length === 0 || isSubmitting}
        >
            <PrinterSolid class="shrink-0 h-4 w-4" />
            <div class="button-name">Imp<p>r</p>imir</div>
        </button>
    </form>
    {#if submitError}
        <div class="form-error">{submitError}</div>
    {/if}
    <div class="buttons-group">
            <button 
                onclick={viewQR}
                // disabled={Object.keys(sold).length === 0}
            >
                <EyeSolid class="shrink-0 h-4 w-4" />
                <div class="button-name"><p>V</p>er QR</div>
            </button>
            <button onclick={scanQR}>
                <CameraPhotoSolid class="shrink-0 h-4 w-4" />
                <div class="button-name"><p>E</p>scanear QR</div>
            </button>
            <button onclick={viewTickets}>
                <ReceiptSolid class="shrink-0 h-4 w-4" />
                <div class="button-name"><p>T</p>iquetes</div>
            </button>

        </div>
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

    .sold th,
    .sold td {
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

    .negative {
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

    .form-error {
        margin: 0.5rem 0 0;
        color: #b91c1c;
        font-size: 0.9rem;
    }
    
    .selected-row {
        outline: 2px solid var(--color-theme-1);
        outline-offset: -2px;
    }

</style>
