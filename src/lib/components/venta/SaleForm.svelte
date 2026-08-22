<script lang="ts">
    let {
        priceValue = $bindable(),
        numberValue = $bindable(),
        reventadoNumber = $bindable(),
        priceInput = $bindable(),
        numberInput = $bindable(),
        formElement = $bindable(),
        updateSalesData,
    } = $props();

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
            numberValue = result;
        }
    }

    function handlePriceInput(event: Event) {
        const target = event.target as HTMLInputElement;
        priceValue = formatThousands(target.value);
    }

    function formatThousands(value: string) {
        const digitsOnly = value.replace(/\D/g, '');
        if (!digitsOnly) {
            return '';
        }
        return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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

    async function handlekeyinput(event: KeyboardEvent) {
        const target = event.target;
        const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);

        if (event.repeat) {
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
                } else {
                    event.preventDefault();
                    priceInput?.focus();
                }
                break;

            case "a":
            case "A":
            // Agregar button
                processForm();
                break;
        }
    }
</script>

<svelte:window onkeydown={handlekeyinput} />
<form onsubmit={(event) => { event.preventDefault(); processForm(); }} bind:this={formElement}>
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
    {#if reventadoNumber}
        <div class="question monto">
            <label for="price">Monto Reventado:</label>
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
    {/if}
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
            bind:value={numberValue}
            oninput={handleNumberInput}
        />
    </div>
    <button type="submit"><div class="button-name"><p>A</p>gregar</div></button>
</form>

<style>

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

    form {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        width: 100%;
        gap: 1rem;
    }
</style>
