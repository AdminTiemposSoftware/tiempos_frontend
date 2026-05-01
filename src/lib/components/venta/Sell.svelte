<script lang="ts">
    let sold= $state<Record<string, { price: number }>>({});
    let soldAmount = $state(0);
    let priceInput: HTMLInputElement;
    let priceValue = $state('');
    let showQrModal = $state(false);
    let showTicketsModal = $state(false);
    let tickets = $state([]);
    let numberInput: HTMLInputElement;
    let randomCount = $state(1);
    let {getTickets, getSoldNumbersForTicket} = $props();

    import { onMount } from 'svelte';
    import { TrashBinSolid, CubeSolid, QuestionCircleSolid, PrinterSolid, SearchSolid, EyeSolid, ReceiptSolid, CameraPhotoSolid } from "flowbite-svelte-icons";
    import { sellingMatrix } from '../../stores/UpdateSellMatrix';
    import { prohibitedNumbers } from '../../stores/UpdateSellMatrix';
    import { total } from '../../stores/UpdateSellMatrix';
    import QrModal from './QrModal.svelte';
    import TicketsModal from './TicketsModal.svelte';

    onMount(() => {
        priceInput?.focus();
    });

    function handlePriceKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault();
            numberInput?.focus();
        }
    }

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
        // TODO This should also update the database
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
    }

    function deleteNumber(number: string) {
        const { [number]: _, ...rest } = sold;
        sold = rest;
    }

    function onSubmit(event: Event) {
        event.preventDefault();
        const formData = new FormData(event.target as HTMLFormElement);
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

        // Filter out prohibited numbers
        const validNumbers = expandedNumbers.filter(
            (num) => !$prohibitedNumbers.includes(parseInt(num, 10))
        );

        updateSalesData(validNumbers, parseInt(price, 10));

        (event.target as HTMLFormElement).reset();
        priceInput?.focus();
        priceValue = '';
    }

    function confirmSale() {
        sellingMatrix.update(matrix => {
            for (const [number, price] of Object.entries(sold)) {
                matrix[number] = (matrix[number] || 0) + price.price;
            }
            return matrix;
        });
        total.update(n => n + soldAmount);
        sold = {}; // Clear the local list
    }

    function cleanSell() {
        if (Object.keys(sold).length === 0) {
            return;
        }
        sold = {};
    }

    function generateRandomNumbers() {
        if (!priceValue.trim()) {
            priceInput?.focus();
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
            (num) => !existingNumbers.has(num) && !$prohibitedNumbers.includes(num)
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
    }

    function generatePairs() {
        if (!priceValue.trim()) {
            return;
        }

        const price = parseInt(priceValue.replace(/\./g, ''), 10);
        if (!price || Number.isNaN(price)) {
            return;
        }

        const pairNumbers = Array.from({ length: 10 }, (_, i) => String(i * 11));
        const validNumbers = pairNumbers.filter(num => !$prohibitedNumbers.includes(parseInt(num, 10)));
        if (validNumbers.length === 0) {
            return;
        }

        updateSalesData(validNumbers, price);
    }

    //TODO: Implement functionality for these buttons
    function printTicket() {
    }

    // TODO: Implement functionality for these buttons
    function viewQR() {
        if (Object.keys(sold).length === 0) {
            return;
        }
        showQrModal = true;
    }

    // TODO: Implement functionality for these buttons
    function scanQR() {
    }

    function viewTickets() {
        tickets = getTickets(); // TODO: Use the selected bet
        showTicketsModal = true;
    }

    function closeTicketsModal() {
        showTicketsModal = false;
    }
</script>

{#if showQrModal}
    <QrModal data={JSON.stringify(sold)} onClose={() => showQrModal = false} />
{/if}

{#if showTicketsModal}
    <TicketsModal 
        tickets={tickets} 
        bind:numbersSold={sold}
        onClose={closeTicketsModal} 
        getSoldNumbersForTicket={getSoldNumbersForTicket}
    />
{/if}

<section class="sell">
    <span class="sold-amount">Tiquete: ₡{soldAmount}</span>

    <form onsubmit={onSubmit}>
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
                onkeydown={handlePriceKeydown}
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
        <button type="submit">Agregar</button>
    </form>
    <div class="buttons-group">
        <button 
            onclick={cleanSell}
            disabled={Object.keys(sold).length === 0}
        >
            <TrashBinSolid class="shrink-0 h-4 w-4" />
            Limpiar
        </button>
        <button onclick={generatePairs}>
            <CubeSolid class="shrink-0 h-4 w-4" />
            Pares
        </button>
        <div class="random-controls">
            <button onclick={generateRandomNumbers}>
                <QuestionCircleSolid class="shrink-0 h-4 w-4" />
                Aleatorio
            </button>
            <input
                class="random-count"
                type="number"
                min="1"
                max="100"
                step="1"
                bind:value={randomCount}
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
                    {#each Object.entries(sold) as [number, price]}
                        <tr>
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
        <!-- TODO: Implement functionality for these buttons -->
        <button
            onclick={confirmSale}
            disabled={Object.keys(sold).length === 0}
        >
            <PrinterSolid class="shrink-0 h-4 w-4" />
            Imprimir
        </button>
        <div class="buttons-group">
            <!-- TODO : This function shouldnt be necesary  -->
            <!-- <button onclick={searchTicket}>
                <SearchSolid class="shrink-0 h-4 w-4" />
                Buscar Tiquete
            </button> -->
            <button 
                onclick={viewQR}
                disabled={Object.keys(sold).length === 0}
            >
                <EyeSolid class="shrink-0 h-4 w-4" />
                Ver QR
            </button>
            <button onclick={scanQR}>
                <CameraPhotoSolid class="shrink-0 h-4 w-4" />
                Escanear QR
            </button>
            <button onclick={viewTickets}>
                <ReceiptSolid class="shrink-0 h-4 w-4" />
                Tiquetes
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
        max-height: 240px;
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

</style>
