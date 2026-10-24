<script lang="ts">
    import { acts } from '@tadashi/svelte-notification';

    type ListItemModification = {
        number_total_id: number;
        originalValue: number;
        operation: '+' | '-';
        modification: number;
    };

    let {
        createSelection = $bindable(),
        createSelectionModifications = $bindable(),
        selectedCells = $bindable(),
        originalMatrix,
        hasLoadedMultipleListsToModify,
        matrixMode,
        originalTotal,
        modifiedTotal,
        allowNegative,
        applyToAllValue = $bindable(),
        applyPercentageToAllValue = $bindable(),
        applyToUncheckedValue = $bindable(),
        applyPercentageToUncheckedValue = $bindable(),
        checkedPercentageBaseTotal = $bindable(),
        uncheckedPercentageBaseTotal = $bindable(),
        checkedPercentageDirty = $bindable(),
        uncheckedPercentageDirty = $bindable(),
        numberAmountInput = $bindable(),
        numberAmountValue = $bindable(),
        getModifiedValue
    } = $props();

    let numberInputElement = $state<HTMLInputElement | null>(null);
    let amountInputElement = $state<HTMLInputElement | null>(null);
    let uncheckedAmountInputElement = $state<HTMLInputElement | null>(null);
    let checkedAmountInputElement = $state<HTMLInputElement | null>(null);
    let uncheckedPercentageInputElement = $state<HTMLInputElement | null>(null);
    let checkedPercentageInputElement = $state<HTMLInputElement | null>(null);

    function subtractOriginalFromCurrent() {
        if (Object.keys(originalMatrix).length === 0 || Object.keys(createSelection).length === 0) {
            acts.add({
                message: 'Cargue una lista original y una matriz para realizar la resta.',
                mode: 'error',
                lifetime: 3
            });
            return;
        }

        createSelection = Object.fromEntries(
            Object.keys(createSelection).map((rawIndex) => {
                const index = Number(rawIndex);
                const currentValue = getModifiedValue(index);
                const originalValue = Number(originalMatrix[index] ?? 0);

                return [
                    index,
                    Number.isFinite(currentValue) && Number.isFinite(originalValue)
                        ? originalValue - currentValue
                        : 0
                ];
            })
        );

        createSelectionModifications = Object.fromEntries(
            Object.entries(createSelectionModifications).map(([index, item]) => [
                index,
                {
                    ...item,
                    originalValue: createSelection[Number(index)] ?? 0,
                    modification: 0
                }
            ])
        );
    }

    function sanitizeNumericInput(input: HTMLInputElement) {
        const sanitizedValue = input.value
            .replace(/[^\d.-]/g, '')
            .replace(/(?!^)-/g, '')
            .replace(/(\..*)\./g, '$1');

        if (input.value !== sanitizedValue) {
            input.value = sanitizedValue;
        }

        return sanitizedValue;
    }

    function limitNumberExpression(input: HTMLInputElement) {
        const limitedValue = input.value
            .replace(/[^\d+\-*\s]/g, '')
            .replace(/\d+/g, (digits) => digits.slice(0, 2));

        if (input.value !== limitedValue) {
            input.value = limitedValue;
        }

        numberAmountInput = limitedValue;
    }

    function applyBulkValue(isChecked: boolean, isPercentage: boolean) {
        const rawValue = isChecked
            ? (isPercentage ? applyPercentageToAllValue : applyToAllValue)
            : (isPercentage ? applyPercentageToUncheckedValue : applyToUncheckedValue);
        const value = rawValue === '' ? 0 : Number(rawValue);

        if (!Number.isFinite(value)) {
            return;
        }

        const currentTotal = matrixMode === 'operations' ? modifiedTotal : originalTotal;
        let percentageBase = isChecked ? checkedPercentageBaseTotal : uncheckedPercentageBaseTotal;
        const percentageDirty = isChecked ? checkedPercentageDirty : uncheckedPercentageDirty;

        if (isPercentage && (percentageDirty || percentageBase === undefined)) {
            percentageBase = currentTotal;

            if (isChecked) {
                checkedPercentageBaseTotal = percentageBase;
                checkedPercentageDirty = false;
            } else {
                uncheckedPercentageBaseTotal = percentageBase;
                uncheckedPercentageDirty = false;
            }
        }

        const appliedValue = isPercentage ? ((percentageBase ?? currentTotal) * value) / 100 : value;
        const selectedIndexSet = new Set(Object.entries(selectedCells)
            .filter(([, selected]) => selected)
            .map(([index]) => Number(index)));

        if (matrixMode === 'operations') {
            createSelectionModifications = Object.fromEntries(
                Array.from({ length: 100 }, (_, index) => {
                    const currentModification = createSelectionModifications[index];
                    const belongsToGroup = selectedIndexSet.has(index) === isChecked;

                    return [
                        index,
                        belongsToGroup
                            ? {
                                number_total_id: currentModification?.number_total_id ?? 0,
                                originalValue: createSelection[index] ?? currentModification?.originalValue ?? 0,
                                operation: currentModification?.operation ?? '+',
                                modification: appliedValue
                            }
                            : currentModification ?? {
                                number_total_id: 0,
                                originalValue: createSelection[index] ?? 0,
                                operation: '+',
                                modification: 0
                            }
                    ];
                })
            );
            return;
        }

        createSelection = Object.fromEntries(
            Array.from({ length: 100 }, (_, index) => [
                index,
                selectedIndexSet.has(index) === isChecked
                    ? appliedValue
                    : createSelection[index] ?? 0
            ])
        );
    }

    function handleBulkValueInput(event: Event, isPercentage = false) {
        const input = event.currentTarget as HTMLInputElement;
        const sanitizedValue = sanitizeNumericInput(input);

        if (isPercentage) {
            applyPercentageToAllValue = sanitizedValue;
            checkedPercentageDirty = true;
        } else {
            applyToAllValue = sanitizedValue;
        }

    }

    function handleUncheckedBulkValueInput(event: Event, isPercentage = false) {
        const input = event.currentTarget as HTMLInputElement;
        const sanitizedValue = sanitizeNumericInput(input);

        if (isPercentage) {
            applyPercentageToUncheckedValue = sanitizedValue;
            uncheckedPercentageDirty = true;
        } else {
            applyToUncheckedValue = sanitizedValue;
        }

    }

    function handleBulkAmountKeydown(event: KeyboardEvent, isChecked: boolean) {
        handleBulkValueInput(event, false);

        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        applyBulkValue(isChecked, false);

        if (isChecked) {
            applyToAllValue = '';
            uncheckedAmountInputElement?.focus();
        } else {
            applyToUncheckedValue = '';
            checkedAmountInputElement?.focus();
        }
    }

    function handleUncheckedBulkAmountKeydown(event: KeyboardEvent) {
        handleUncheckedBulkValueInput(event, false);

        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        applyBulkValue(false, false);
        applyToUncheckedValue = '';
        checkedAmountInputElement?.focus();
    }

    function handleBulkPercentageKeydown(event: KeyboardEvent, isChecked: boolean) {
        handleBulkValueInput(event, true);

        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        applyBulkValue(isChecked, true);

        if (isChecked) {
            applyPercentageToAllValue = '';
            uncheckedPercentageInputElement?.focus();
        } else {
            applyPercentageToUncheckedValue = '';
            checkedPercentageInputElement?.focus();
        }
    }

    function handleUncheckedBulkPercentageKeydown(event: KeyboardEvent) {
        handleUncheckedBulkValueInput(event, true);

        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        applyBulkValue(false, true);
        applyPercentageToUncheckedValue = '';
        checkedPercentageInputElement?.focus();
    }

    function applyAmountToNumbers(): boolean {
        const amount = Number(numberAmountValue.replace(/[.,\s]/g, ''));

        if (!numberAmountInput.trim() || !Number.isFinite(amount)) {
            return false;
        }

        const expandedNumbers = new Map<number, number>();
        const addIfValid = (value: number) => {
            if (Number.isInteger(value) && value >= 0 && value <= 99) {
                expandedNumbers.set(value, (expandedNumbers.get(value) ?? 0) + 1);
            }
        };
        const numberParts = numberAmountInput.split('+').map((part) => part.trim()).filter(Boolean);
        const validNumberPart = /^(?:\d{1,2}|\*\d{1,2}|\d{1,2}\*|\d{1,2}-\d{1,2})$/;

        if (numberParts.length === 0 || numberParts.some((part) => !validNumberPart.test(part))) {
            return false;
        }

        numberParts.forEach((part) => {
            if (part.includes('*')) {
                const base = Number.parseInt(part.replace('*', '').trim(), 10);

                if (!Number.isFinite(base)) {
                    return;
                }

                if (part.startsWith('*') && !part.endsWith('*')) {
                    if (base < 10) {
                        for (let digit = 0; digit < 10; digit += 1) addIfValid(digit * 10 + base);
                    } else {
                        addIfValid(base);
                    }
                } else {
                    for (let digit = 0; digit < 10; digit += 1) addIfValid(base * 10 + digit);
                }
                return;
            }

            if (part.includes('-')) {
                const [startRaw, endRaw] = part.split('-').map((value) => value.trim());
                const start = Number.parseInt(startRaw, 10);
                const end = Number.parseInt(endRaw, 10);

                if (!Number.isFinite(start) || !Number.isFinite(end)) return;
                for (let value = Math.min(start, end); value <= Math.max(start, end); value += 1) {
                    addIfValid(value);
                }
                return;
            }

            addIfValid(Number.parseInt(part, 10));
        });

        if (matrixMode === 'operations') {
            createSelectionModifications = Object.fromEntries(
                Array.from({ length: 100 }, (_, index) => {
                    const current = createSelectionModifications[index];
                    const occurrenceCount = expandedNumbers.get(index) ?? 0;
                    if (occurrenceCount === 0) {
                        return [index, current ?? {
                            number_total_id: 0,
                            originalValue: createSelection[index] ?? 0,
                            operation: '+',
                            modification: 0
                        }];
                    }

                    return [index, {
                        number_total_id: current?.number_total_id ?? 0,
                        originalValue: createSelection[index] ?? current?.originalValue ?? 0,
                        operation: current?.operation ?? '+',
                        modification: (current?.modification ?? 0) + (amount * occurrenceCount)
                    }];
                })
            );
            return expandedNumbers.size > 0;
        }

        createSelection = Object.fromEntries(
            Array.from({ length: 100 }, (_, index) => [
                index,
                (createSelection[index] ?? 0) + (amount * (expandedNumbers.get(index) ?? 0))
            ])
        );
        return expandedNumbers.size > 0;
    }

    function handleNumberAmountKeydown(event: KeyboardEvent, inputType: 'number' | 'amount') {
        if (event.key !== 'Enter') return;
        event.preventDefault();

        if (inputType === 'amount') {
            numberInputElement?.focus();
            numberInputElement?.select();
        } else if (applyAmountToNumbers()) {
            numberAmountInput = '';
            numberAmountValue = '';
            amountInputElement?.focus();
        }
    }
</script>

<div class="inputs-group row">
    <div class="apply-to-all-group">
        <p>Singular</p>
        <div class="row">
            <input type="text" placeholder="Monto" bind:value={numberAmountValue} bind:this={amountInputElement}
                class="amount-input" aria-label="Monto para los números"
                onkeydown={(event) => handleNumberAmountKeydown(event, 'amount')} />
            <input type="text" placeholder="Número" bind:value={numberAmountInput} bind:this={numberInputElement}
                class="number-input" aria-label="Número o expresión de números"
                oninput={(event) => limitNumberExpression(event.currentTarget)}
                onkeydown={(event) => handleNumberAmountKeydown(event, 'number')} />
        </div>
    </div>
    <div class="apply-to-all-group">
        <p>No marcados</p>
        <div class="row">
            <input type="number" class="apply-to-all-input" placeholder="Monto" bind:value={applyToUncheckedValue}
                bind:this={uncheckedAmountInputElement}
                inputmode="decimal" aria-label="Monto" oninput={(event) => handleUncheckedBulkValueInput(event)}
                onkeydown={handleUncheckedBulkAmountKeydown} />
            <input type="number" class="apply-to-all-input" placeholder="%" bind:value={applyPercentageToUncheckedValue}
                bind:this={uncheckedPercentageInputElement}
                inputmode="decimal" aria-label="%" oninput={(event) => handleUncheckedBulkValueInput(event, true)}
                onkeydown={handleUncheckedBulkPercentageKeydown} />
        </div>
    </div>
    <div class="apply-to-all-group">
        <p>Marcados</p>
        <div class="row">
            <input type="number" class="apply-to-all-input" placeholder="Monto" bind:value={applyToAllValue}
                bind:this={checkedAmountInputElement}
                inputmode="decimal" aria-label="Monto" oninput={(event) => handleBulkValueInput(event)}
                onkeydown={(event) => handleBulkAmountKeydown(event, true)} />
            <input type="number" class="apply-to-all-input" placeholder="%" bind:value={applyPercentageToAllValue}
                bind:this={checkedPercentageInputElement}
                inputmode="decimal" aria-label="%" oninput={(event) => handleBulkValueInput(event, true)}
                onkeydown={(event) => handleBulkPercentageKeydown(event, true)} />
        </div>
    </div>
    <button type="button" onclick={subtractOriginalFromCurrent} hidden={!hasLoadedMultipleListsToModify}>
        Restar a la original
    </button>
</div>

<style>
    .inputs-group {
        background-color: var(--color-box-background);
        border: 1px solid var(--color-border);
        padding: 1rem !important;
    }

    .apply-to-all-input {
        width: 100%;
        box-sizing: border-box;
    }

    .row {
        gap: 0.5rem;
        padding-top: 0.25rem;
    }

    .apply-to-all-group {
        border: 1px solid var(--color-border);
        padding: 0.5rem;
        text-align: center;
    }

    .amount-input {
        width: 30% !important;
    }

    .number-input {
        width: 100% !important;
    }
</style>
