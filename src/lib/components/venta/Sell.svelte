<script lang="ts">
    let sold= $state<Record<string, { price: number }>>({});
    let soldAmount = $state(0);
    let priceInput: HTMLInputElement;
    let priceValue = $state('');
    let showQrModal = $state(false);
    let showTicketsModal = $state(false);
    let tickets = $state([]);
    let numberInput: HTMLInputElement;
    let {getTickets, getSoldNumbersForTicket} = $props();

    import { TrashBinSolid, CubeSolid, QuestionCircleSolid, PrinterSolid, SearchSolid, EyeSolid, ReceiptSolid, CameraPhotoSolid } from "flowbite-svelte-icons";
    import { sellingMatrix } from '../../stores/UpdateSellMatrix';
    import { prohibitedNumbers } from '../../stores/UpdateSellMatrix';
    import { total } from '../../stores/UpdateSellMatrix';
    import QrModal from './QrModal.svelte';
    import TicketsModal from './TicketsModal.svelte';

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
        let numbers: string[] = numberInput.split('+').map(n => n.trim()).filter(n => n);
        
        // Expand any ranges marked with * (e.g., "1*" becomes 10-19)
        const expandedNumbers: string[] = [];
        numbers.forEach(num => {
            if (num.includes('*')) {
                const digit = num.replace('*', '');
                const baseNum = parseInt(digit) * 10;
                for (let i = 0; i < 10; i++) {
                    console.log(baseNum + i);
                    expandedNumbers.push(String(baseNum + i));
                }
            } else {
                expandedNumbers.push(num);
            }
        });

        // Filter out prohibited numbers
        const validNumbers = expandedNumbers.filter(num => !$prohibitedNumbers.includes(parseInt(num)));

        updateSalesData(validNumbers, parseInt(price));

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
        if (!numberInput) {
            return;
        }
        const randomNumber = Math.floor(Math.random() * 100)
            .toString()
            .padStart(2, "0");
        numberInput.value = randomNumber;
        priceInput?.focus();
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
                min="0"
                max="99"
                bind:this={numberInput}
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
        <button onclick={generateRandomNumbers}>
            <QuestionCircleSolid class="shrink-0 h-4 w-4" />
            Aleatorio
        </button>
        <button 
            onclick={printTicket}
            disabled={Object.keys(sold).length === 0}
        >
            <PrinterSolid class="shrink-0 h-4 w-4" />
            Imprimir
        </button>
    </div>
    <div class="sold">
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
        <!-- TODO: Implement functionality for these buttons -->
        <button
            onclick={confirmSale}
            disabled={Object.keys(sold).length === 0}
        >
            Confirmar Venta</button
        >
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
        width: 40%;
        height: 100%;
    }

    .sell form {
        display: flex;
        justify-content: center;
        justify-content: space-between;
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
    
    .sold table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
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

</style>
