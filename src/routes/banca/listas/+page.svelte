<script lang="ts">
    import { onMount } from 'svelte';
    import { acts } from '@tadashi/svelte-notification';
    import MatrixInput from "$lib/components/listas/MatrixInput.svelte";
    import MatrixOperations from "$lib/components/listas/MatrixOperations.svelte";
    import ListasFilterModal from '../../../lib/components/listas/ListasFilterModal.svelte';
    import LoadListFromQrModal from '$lib/components/listas/LoadListFromQrModal.svelte';
    import MatrixComparisonModal from '$lib/components/listas/MatrixComparisonModal.svelte';
    import { decodeExportedListQrData, formatAmount } from '$lib/printing/printing';
    import { auth } from '$lib/stores/auth';

    type ListItemModification = {
        number_total_id: number;
        originalValue: number;
        operation: '+' | '-';
        modification: number;
    };

    type RegistryItem = {
        enabled?: unknown;
        number?: unknown;
        amount?: unknown;
        number_total_id?: unknown;
    };

    type OperationItem = {
        id?: unknown;
        operation?: unknown;
        number?: unknown;
        number_total_id?: unknown;
        amount?: unknown;
        date?: unknown;
    };

    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    let showModifyList = $state(false);
    let createSelection = $state<Record<number, number>>({});
    let createSelectionModifications = $state<Record<number, ListItemModification>>({});
    let branchNames = $state<{ value: number; label: string }[]>([]);
	let drawScheduleNames = $state<{ value: number; label: string }[]>([]);
	let selectedDate =  $state(utcMinus6Date.toISOString().split('T')[0]);
	let selectedBranch = $state<number | undefined>();
	let selectedDrawSchedule = $state<number | undefined>();
    let hasLoadedListToModify = $state(false);
	let isSaving = $state(false);
    let showSaveModal = $state(false);
    let showOverwriteModal = $state(false);
    let saveReventado = $state(false);
    let saveMegareventado = $state(false);
    let existingListExists = $state(false);
    let existingMatrix = $state<Record<number, number>>({});
    let savedMatrix = $state<Record<number, number>>({});
    let showLoadList = $state(false);
    let showLoadListByQR = $state(false);
    let qrInput = $state('');
    let matrixMode = $state<'input' | 'operations'>('input');
    let isListLoaded = $state(false);
    let listOperations = $state<OperationItem[]>([]);
    let applyToAllValue = $state('');
    let applyPercentageToAllValue = $state('');
    let applyToUncheckedValue = $state('');
    let applyPercentageToUncheckedValue = $state('');
    let checkedPercentageBaseTotal = $state<number | undefined>();
    let uncheckedPercentageBaseTotal = $state<number | undefined>();
    let checkedPercentageDirty = $state(false);
    let uncheckedPercentageDirty = $state(false);
    let selectionMode = $state(false);
    let selectedCells = $state<Record<number, boolean>>({});
    let numberAmountInput = $state('');
    let numberAmountValue = $state('');
    let numberInputElement = $state<HTMLInputElement | null>(null);
    let amountInputElement = $state<HTMLInputElement | null>(null);
    let showOperationsMatrix = $state(false);
    let allowNegative = $state(false);

	let { data } = $props();

    const matrixIsDirty = $derived.by(() => {
        const currentKeys = Object.keys(createSelection);
        const savedKeys = Object.keys(savedMatrix);

        return currentKeys.length > 0 && (
            isListLoaded ||
            currentKeys.length !== savedKeys.length ||
                currentKeys.some((key) => createSelection[Number(key)] !== savedMatrix[Number(key)]));
    });

    let originalTotal = $derived.by(() => {
        return Object.values(createSelection).reduce((total, value) => {
            const amount = Number(value);
            return Number.isFinite(amount) ? total + amount : total;
        }, 0);
    });

    let modifiedTotal = $derived.by(() => {
        return Object.entries(createSelection).reduce((total, [rawNumber, value]) => {
            const number = Number(rawNumber);
            const baseValue = Number(value);
            const modification = createSelectionModifications[number];

            if (!Number.isFinite(baseValue)) {
                return total;
            }

            if (!modification || !Number.isFinite(modification.modification)) {
                return total + baseValue;
            }

            const signedModification = modification.operation === '+'
                ? modification.modification
                : -getEffectiveSubtraction(modification.modification, baseValue);

            return total + baseValue + signedModification;
        }, 0);
    });

    function getEffectiveSubtraction(amount: number, currentValue: number) {
        return allowNegative ? amount : Math.min(amount, Math.max(0, currentValue));
    }

    function getDisplayName(value: number | undefined, options: { value: number; label: string }[]) {
        return options.find((option) => option.value === value)?.label ?? 'Sin selección';
    }

   	$effect(() => {
		const branchNamesItems = Array.isArray(data?.branchNames)
			? (data.branchNames as any[])
			: [];
		branchNames = [
			...branchNamesItems.map((item) => ({
				value: Number(item.id),
				label: String(item.name)
			}))
		];
	});

	$effect(() => {
		const scheduleNamesItems = Array.isArray(data?.scheduleNames)
			? (data.scheduleNames as any[])
			: [];
		drawScheduleNames = [
			...scheduleNamesItems.map((item) => ({
				value: Number(item.draw_schedule_id),
				label: `${String(item.draw_name)} - ${String(item.draw_schedule_name)}`
			}))
		];
	});

    function buildModificationMap(
        values: Record<number, number>,
        numberTotalIds: Record<number, number> = {}
    ) {
        return Object.entries(values).reduce<Record<number, ListItemModification>>((acc, [rawIndex, value]) => {
            const index = Number(rawIndex);
            const safeValue = Number(value);

            if (!Number.isFinite(safeValue)) {
                return acc;
            }

            acc[index] = {
                number_total_id: numberTotalIds[index] ?? 0,
                originalValue: safeValue,
                operation: '-',
                modification: 0,
            };

            return acc;
        }, {});
    }

    function loadFetchedValuesToModify(
        nextValues: Record<number, number>,
        numberTotalIds: Record<number, number> = {}
    ) {
        const normalizedValues = Object.entries(nextValues).reduce<Record<number, number>>((acc, [rawIndex, value]) => {
            const index = Number(rawIndex);
            const safeValue = Number(value);

            if (Number.isFinite(index) && Number.isFinite(safeValue)) {
                acc[index] = safeValue;
            }

            return acc;
        }, {});

        createSelection = normalizedValues;
        createSelectionModifications = buildModificationMap(normalizedValues, numberTotalIds);
        savedMatrix = { ...normalizedValues };
    }

    function loadValuesIntoModifications(nextValues: Record<number, number>) {
        createSelectionModifications = Object.entries(nextValues).reduce<
            Record<number, ListItemModification>
        >((nextModifications, [rawIndex, value]) => {
            const index = Number(rawIndex);
            const amount = Number(value);

            if (!Number.isInteger(index) || index < 0 || index >= 100 || !Number.isFinite(amount)) {
                return nextModifications;
            }

            const currentModification = createSelectionModifications[index];

            nextModifications[index] = {
                number_total_id: currentModification?.number_total_id ?? 0,
                originalValue: createSelection[index] ?? 0,
                operation: currentModification?.operation ?? '+',
                modification: amount
            };

            return nextModifications;
        }, {});
    }

    onMount(() => {
        const qrValue = new URLSearchParams(window.location.search).get('import');

        if (!qrValue) {
            return;
        }

        const importedValues = decodeExportedListQrData(qrValue);

        if (Object.keys(importedValues).length === 0) {
            return;
        }

        createSelection = importedValues;
        createSelectionModifications = buildModificationMap(importedValues);
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete('import');
        window.history.replaceState({}, '', nextUrl);
    });

    function clearLoadedList() {
        selectedDate = utcMinus6Date.toISOString().split('T')[0];
        selectedBranch = undefined;
        selectedDrawSchedule = undefined;
        createSelection = {};
        createSelectionModifications = {};
        hasLoadedListToModify = false;
        matrixMode = 'input';
        isListLoaded = false;
        savedMatrix = {};
        listOperations = [];
        qrInput = '';
    }

    function loadListFromQr() {
        const compactValues = decodeExportedListQrData(qrInput);
        const decodedValues = Object.keys(compactValues).length > 0
            ? compactValues
            : {};

        if (Object.keys(decodedValues).length !== 100) {
            acts.add({
                message: 'El QR no contiene una lista válida de 100 números.',
                mode: 'error',
                lifetime: 4
            });
            return;
        }

        const keepModificationView = hasLoadedListToModify || matrixMode === 'operations';

        if (keepModificationView) {
            loadValuesIntoModifications(decodedValues);
        } else {
            createSelection = decodedValues;
            createSelectionModifications = {};
            savedMatrix = { ...decodedValues };
            isListLoaded = true;
        }

        hasLoadedListToModify = keepModificationView;
        matrixMode = keepModificationView ? 'operations' : 'input';
        qrInput = '';
        showLoadList = false;
        showLoadListByQR = false;
    }

    function openSaveConfiguration() {
        if (matrixIsDirty) {
            showSaveModal = true;
        }
    }

    function getSaveNumbers() {
        return Array.from({ length: 100 }, (_, number) => ({
            number,
            amount: Number.isFinite(createSelection[number]) ? createSelection[number] : 0
        }));
    }

    async function checkExistingList() {
        if (!selectedDate || selectedBranch === undefined || selectedDrawSchedule === undefined) {
            acts.add({ message: 'Seleccione fecha, puesto y sorteo.', mode: 'error', lifetime: 3 });
            return;
        }

        if (!getSaveNumbers()) {
            return;
        }

        isSaving = true;
        try {
            const query = new URLSearchParams({
                draw_schedule_id: String(selectedDrawSchedule),
                branch_id: String(selectedBranch),
                date: selectedDate,
                is_reventado: String(saveReventado),
                is_megareventado: String(saveMegareventado)
            });
            const response = await fetch(`/banca/listas?${query}`);
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(payload?.error ?? 'No se pudo validar la lista.');
            }

            const items: RegistryItem[] = Array.isArray(payload?.items) ? payload.items : [];
            const enabledItems = items.filter(
                (item) => item?.enabled === true
            );
            existingListExists = enabledItems.length > 0;
            existingMatrix = {};
            showSaveModal = false;

            if (existingListExists) {
                existingMatrix = Object.fromEntries(
                    enabledItems.map((item) => {
                        const number = Number(item.number);
                        const amount = Number(item.amount);
                        return [number, Number.isFinite(amount) ? amount : 0];
                    }).filter(([number]) => Number.isInteger(number) && number >= 0 && number < 100)
                );
            }
            showOverwriteModal = true;
        } catch (error) {
            acts.add({
                message: error instanceof Error ? error.message : 'No se pudo validar la lista.',
                mode: 'error',
                lifetime: 4
            });
        } finally {
            isSaving = false;
        }
    }

    async function saveList() {
        const numbers = getSaveNumbers();
        if (!numbers || selectedBranch === undefined || selectedDrawSchedule === undefined) {
            return;
        }

        createSelection = Object.fromEntries(
            numbers.map(({ number, amount }) => [number, amount])
        );

        isSaving = true;
        try {
            const response = await fetch('/banca/listas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate,
                    branch_id: selectedBranch,
                    draw_schedule_id: selectedDrawSchedule,
                    is_reventado: saveReventado,
                    is_megareventado: saveMegareventado,
                    numbers
                })
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(payload?.error ?? 'No se pudo guardar la lista.');
            }

            createSelection = {};
            createSelectionModifications = {};
            savedMatrix = {};
            isListLoaded = false;
            showOverwriteModal = false;
            acts.add({ message: 'Lista guardada correctamente.', mode: 'success', lifetime: 3 });
        } catch (error) {
            acts.add({
                message: error instanceof Error ? error.message : 'No se pudo guardar la lista.',
                mode: 'error',
                lifetime: 4
            });
        } finally {
            isSaving = false;
        }
    }

    function handleChangeModifications(action: 'add' | 'sub') {
        if (!hasLoadedListToModify) {
            return;
        }

        const operation = action === 'add' ? '+' : '-';
        createSelectionModifications = Object.fromEntries(
            Object.entries(createSelectionModifications).map(([index, item]) => [
                index,
                { ...item, operation }
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

    function applyBulkValues() {
        const checkedAmount = applyToAllValue === '' ? 0 : Number(applyToAllValue);
        const checkedPercentage = applyPercentageToAllValue === '' ? 0 : Number(applyPercentageToAllValue);
        const uncheckedAmount = applyToUncheckedValue === '' ? 0 : Number(applyToUncheckedValue);
        const uncheckedPercentage = applyPercentageToUncheckedValue === ''
            ? 0
            : Number(applyPercentageToUncheckedValue);

        if (
            !Number.isFinite(checkedAmount) ||
            !Number.isFinite(checkedPercentage) ||
            !Number.isFinite(uncheckedAmount) ||
            !Number.isFinite(uncheckedPercentage)
        ) {
            return;
        }

        const currentTotal = matrixMode === 'operations' ? modifiedTotal : originalTotal;
        const checkedPercentageBase = checkedPercentageBaseTotal ?? currentTotal;
        const uncheckedPercentageBase = uncheckedPercentageBaseTotal ?? currentTotal;
        const checkedValue = (checkedPercentageBase * checkedPercentage) / 100 + checkedAmount;
        const uncheckedValue = (uncheckedPercentageBase * uncheckedPercentage) / 100 + uncheckedAmount;

        const selectedIndexes = Object.entries(selectedCells)
            .filter(([, selected]) => selected)
            .map(([index]) => Number(index));
        const selectedIndexSet = new Set(selectedIndexes);

        if (matrixMode === 'operations') {
            createSelectionModifications = Object.fromEntries(
                Array.from({ length: 100 }, (_, index) => {
                    const currentModification = createSelectionModifications[index];
                    const valueToApply = selectedIndexSet.has(index) ? checkedValue : uncheckedValue;

                    return [
                        index,
                        {
                            number_total_id: currentModification?.number_total_id ?? 0,
                            originalValue: createSelection[index] ?? currentModification?.originalValue ?? 0,
                            operation: currentModification?.operation ?? '+',
                            modification: valueToApply
                        }
                    ];
                })
            );
            return;
        }

        createSelection = Object.fromEntries(
            Array.from({ length: 100 }, (_, index) => [
                index,
                selectedIndexSet.has(index) ? checkedValue : uncheckedValue
            ])
        );
    }

    function commitBulkGroup(isChecked: boolean) {
        const hasPercentage = isChecked
            ? applyPercentageToAllValue !== ''
            : applyPercentageToUncheckedValue !== '';
        const percentageDirty = isChecked ? checkedPercentageDirty : uncheckedPercentageDirty;

        if (hasPercentage && (percentageDirty || (isChecked
            ? checkedPercentageBaseTotal === undefined
            : uncheckedPercentageBaseTotal === undefined))) {
            const currentTotal = matrixMode === 'operations' ? modifiedTotal : originalTotal;

            if (isChecked) {
                checkedPercentageBaseTotal = currentTotal;
                checkedPercentageDirty = false;
            } else {
                uncheckedPercentageBaseTotal = currentTotal;
                uncheckedPercentageDirty = false;
            }
        }

        applyBulkValues();
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

        if (event instanceof KeyboardEvent && event.key === 'Enter') {
            commitBulkGroup(true);
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

        if (event instanceof KeyboardEvent && event.key === 'Enter') {
            commitBulkGroup(false);
        }
    }

    function toggleAllCells() {
        const allSelected = Object.keys(selectedCells).length === 100
            && Object.values(selectedCells).every(Boolean);

        selectedCells = allSelected
            ? {}
            : Object.fromEntries(Array.from({ length: 100 }, (_, index) => [index, true]));
    }

    function applyAmountToNumbers(): boolean {
        const amountText = numberAmountValue.replace(/[.,\s]/g, '');
        const amount = Number(amountText);

        if (!numberAmountInput.trim() || !Number.isFinite(amount)) {
            return false;
        }

        const expandedNumbers = new Set<number>();
        const addIfValid = (value: number) => {
            if (Number.isInteger(value) && value >= 0 && value <= 99) {
                expandedNumbers.add(value);
            }
        };

        const numberParts = numberAmountInput
            .split('+')
            .map((part) => part.trim())
            .filter(Boolean)
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
                            for (let digit = 0; digit < 10; digit += 1) {
                                addIfValid(digit * 10 + base);
                            }
                        } else {
                            addIfValid(base);
                        }
                    } else {
                        for (let digit = 0; digit < 10; digit += 1) {
                            addIfValid(base * 10 + digit);
                        }
                    }
                    return;
                }

                if (part.includes('-')) {
                    const [startRaw, endRaw] = part.split('-').map((value) => value.trim());
                    const start = Number.parseInt(startRaw, 10);
                    const end = Number.parseInt(endRaw, 10);

                    if (!Number.isFinite(start) || !Number.isFinite(end)) {
                        return;
                    }

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

                    if (!expandedNumbers.has(index)) {
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
                        modification: (current?.modification ?? 0) + amount
                    }];
                })
            );
            return expandedNumbers.size > 0;
        }

        createSelection = Object.fromEntries(
            Array.from({ length: 100 }, (_, index) => [
                index,
                (createSelection[index] ?? 0) + (expandedNumbers.has(index) ? amount : 0)
            ])
        );

        return expandedNumbers.size > 0;
    }

    function handleNumberAmountKeydown(event: KeyboardEvent, inputType: 'number' | 'amount') {
        if (event.key === 'Enter') {
            event.preventDefault();

            if (inputType === 'amount') {
                numberInputElement?.focus();
                numberInputElement?.select();
            } else {
                handleNumberInputEnter();
            }
        }
    }

    function handleNumberInputEnter() {
        if (applyAmountToNumbers()) {
            numberAmountInput = '';
            numberAmountValue = '';
            amountInputElement?.focus();
        }
    }

    async function fetchListOperations() {
        if (!selectedDate || selectedBranch === undefined || selectedDrawSchedule === undefined) {
            return [];
        }

        const query = new URLSearchParams({
            draw_schedule_id: String(selectedDrawSchedule),
            branch_id: String(selectedBranch),
            date: selectedDate,
            is_reventado: String(saveReventado),
            is_megareventado: String(saveMegareventado)
        });
        const response = await fetch(`/number/operations?${query.toString()}`);
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(payload?.error ?? 'No se pudieron cargar las operaciones.');
        }

        return Array.isArray(payload?.items) ? payload.items as OperationItem[] : [];
    }

    async function fetchListToModify() {
        try {
            if (!selectedDate || !selectedBranch || !selectedDrawSchedule) return;
            listOperations = [];

            const query = new URLSearchParams({
                draw_schedule_id: String(selectedDrawSchedule),
                branch_id: String(selectedBranch),
                date: selectedDate,
                is_reventado: String(saveReventado),
                is_megareventado: String(saveMegareventado)
            });

            const response = await fetch(`/banca/listas?${query.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const payload = await response.json();
            const dataItems: RegistryItem[] = (Array.isArray(payload?.items) ? payload.items : []).filter(
                (item: RegistryItem) => item?.enabled === true
            );
            console.log('dataItems', dataItems);
            if (dataItems.length === 0) {
                acts.add({
                    message: 'Esta lista no existe',
                    mode: 'error',
                    lifetime: 3
                });
                return;
            }

            listOperations = await fetchListOperations();

            const fetchedValues = dataItems.reduce<Record<number, number>>((acc, item) => {
                const number = Number(item?.number);
                const value = Number(item?.amount);

                if (Number.isFinite(number) && Number.isFinite(value)) {
                    acc[number] = value;
                }

                return acc;
            }, {});
            const fetchedNumberTotalIds = dataItems.reduce<Record<number, number>>((acc, item) => {
                const number = Number(item?.number);
                const numberTotalId = Number(item?.number_total_id);

                if (Number.isFinite(number) && Number.isFinite(numberTotalId)) {
                    acc[number] = numberTotalId;
                }

                return acc;
            }, {});

            if (Object.keys(fetchedValues).length > 0) {
                loadFetchedValuesToModify(
                    fetchedValues,
                    fetchedNumberTotalIds
                );
            }

            hasLoadedListToModify = true;
            matrixMode = 'operations';
            showModifyList = false;
            return;
        } catch (error) {
            acts.add({
                message: error instanceof Error ? error.message : 'No se pudo cargar la lista.',
                mode: 'error',
                lifetime: 4
            });
        }
    }

    async function fetchList() {
        try {
            if (!selectedDate || selectedBranch === undefined || selectedDrawSchedule === undefined) {
                acts.add({
                    message: 'Seleccione fecha, puesto y sorteo.',
                    mode: 'error',
                    lifetime: 3
                });
                return;
            }

            const keepModificationView = hasLoadedListToModify || matrixMode === 'operations';
            const query = new URLSearchParams({
                draw_schedule_id: String(selectedDrawSchedule),
                branch_id: String(selectedBranch),
                date: selectedDate,
                is_reventado: String(saveReventado),
                is_megareventado: String(saveMegareventado)
            });

            const response = await fetch(`/banca/listas?${query.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(payload?.error ?? 'No se pudo cargar la lista.');
            }
            const dataItems: RegistryItem[] = (Array.isArray(payload?.items) ? payload.items : []).filter(
                (item: RegistryItem) => item?.enabled === true
            );

            if (dataItems.length === 0) {
                acts.add({
                    message: 'Esta lista no existe',
                    mode: 'error',
                    lifetime: 3
                });
                return;
            }

            const fetchedValues = dataItems.reduce<Record<number, number>>((acc, item) => {
                const number = Number(item?.number);
                const value = Number(item?.amount);

                if (Number.isInteger(number) && number >= 0 && number < 100 && Number.isFinite(value)) {
                    acc[number] = value;
                }

                return acc;
            }, {});

            if (keepModificationView) {
                loadValuesIntoModifications(fetchedValues);
                hasLoadedListToModify = true;
                matrixMode = 'operations';
            } else {
                createSelection = fetchedValues;
                createSelectionModifications = {};
                savedMatrix = { ...fetchedValues };
                hasLoadedListToModify = false;
                matrixMode = 'input';
                isListLoaded = true;
            }

            showLoadList = false;
        } catch (error) {
            acts.add({
                message: error instanceof Error ? error.message : 'No se pudo cargar la lista.',
                mode: 'error',
                lifetime: 4
            });
        }
    }

    async function saveModifications() {
        const operations = Object.entries(createSelectionModifications)
            .filter(([, item]) => Number.isFinite(item.modification) && item.modification > 0)
            .map(([index, item]) => {
                const currentValue = createSelection[Number(index)] ?? item.originalValue;

                return {
                    operation: item.operation === '+' ? 'add' : 'sub',
                    number_total_id: item.number_total_id,
                    amount: item.operation === '-'
                        ? getEffectiveSubtraction(item.modification, currentValue)
                        : item.modification
                };
            })
            .filter((item) => item.amount > 0);

        if (operations.length === 0) {
            acts.add({
                message: 'No hay modificaciones para guardar.',
                mode: 'error',
                lifetime: 3
            });
            return;
        }

        isSaving = true;
        try {
            const response = await fetch('/number/operations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate,
                    operations
                })
            });

            if (!response.ok) {
                acts.add({
                    message: 'Error al guardar las modificaciones. Por favor, inténtelo de nuevo.',
                    mode: 'error',
                    lifetime: 3
                });
                return;
            }

            createSelection = Object.entries(createSelectionModifications).reduce<Record<number, number>>(
                (nextSelection, [index, item]) => {
                    const currentValue = createSelection[Number(index)] ?? item.originalValue;
                    const modification = Number(item.modification);

                    nextSelection[Number(index)] = item.operation === '+'
                        ? currentValue + modification
                        : currentValue - getEffectiveSubtraction(modification, currentValue);

                    return nextSelection;
                },
                { ...createSelection }
            );

            createSelectionModifications = Object.fromEntries(
                Object.entries(createSelectionModifications).map(([index, item]) => [
                    index,
                    {
                        ...item,
                        originalValue: createSelection[Number(index)],
                        modification: 0
                    }
                ])
            );

            listOperations = await fetchListOperations();

            acts.add({
                message: 'Modificaciones guardadas correctamente.',
                mode: 'success',
                lifetime: 3
            });
        } catch {
            acts.add({
                message: 'Error al guardar las modificaciones. Por favor, inténtelo de nuevo.',
                mode: 'error',
                lifetime: 3
            });
        } finally {
            isSaving = false;
        }
    }
</script>

<svelte:head>
    <title>Listas</title>
</svelte:head>


<ListasFilterModal
    bind:selectedDate={selectedDate}
    bind:selectedBranch={selectedBranch}
    branchNames={branchNames}
    drawScheduleNames={drawScheduleNames}
    scheduleBranch={data?.scheduleBranch ?? []}
    bind:selectedDrawSchedule={selectedDrawSchedule}
    onConfirm={fetchListToModify}
    bind:showModal={showModifyList}
/>

<ListasFilterModal
    bind:selectedDate={selectedDate}
    bind:selectedBranch={selectedBranch}
    branchNames={branchNames}
    drawScheduleNames={drawScheduleNames}
    scheduleBranch={data?.scheduleBranch ?? []}
    bind:selectedDrawSchedule={selectedDrawSchedule}
    onConfirm={fetchList}
    bind:showModal={showLoadList}
/>

<LoadListFromQrModal
    bind:qrInput={qrInput}
    onConfirm={loadListFromQr}
    bind:showModal={showLoadListByQR}
/>

<ListasFilterModal
    bind:selectedDate={selectedDate}
    bind:selectedBranch={selectedBranch}
    branchNames={branchNames}
    drawScheduleNames={drawScheduleNames}
    scheduleBranch={data?.scheduleBranch ?? []}
    bind:selectedDrawSchedule={selectedDrawSchedule}
    includeReventado={false}
    bind:selectedReventado={saveReventado}
    bind:selectedMegareventado={saveMegareventado}
    onConfirm={checkExistingList}
    bind:showModal={showSaveModal}
/>

<MatrixComparisonModal
    bind:showModal={showOverwriteModal}
    confirm={saveList}
    existingListExists={existingListExists}
    existingMatrix={existingMatrix}
    createdMatrix={createSelection}
    selectedBranchName={getDisplayName(selectedBranch, branchNames)}
    selectedScheduleName={getDisplayName(selectedDrawSchedule, drawScheduleNames)}
    selectedDate={selectedDate}
    isReventado={saveReventado}
    isMegareventado={saveMegareventado}
/>

{#if ['banking'].includes($auth.user?.role ?? '')}
<section class="list-container">
    <div class="column left">
        {#if matrixMode === 'operations'}
            <MatrixOperations
                bind:valueMap={createSelection}
                bind:modificationMap={createSelectionModifications}
                bind:selectedCells
                bind:showOperationsMatrix={showOperationsMatrix}
                allowNegative={allowNegative}
                selectionMode={selectionMode}
                mode="20x5"
                operations={hasLoadedListToModify ? listOperations : []}
                selectedBranch={getDisplayName(selectedBranch, branchNames)}
                selectedSchedule={getDisplayName(selectedDrawSchedule, drawScheduleNames)}
                drawScheduleNames={drawScheduleNames}
                branchNames={branchNames}
            />
        {:else}
            <MatrixInput
                bind:valueMap={createSelection}
                bind:selectedCells
                selectionMode={selectionMode}
                mode="20x5"
            />
        {/if}

        <div class="inputs-group row">
            <div class="apply-to-all-group">
                <p>Singular</p>
                <div class="row">
                    <input
                        type="text"
                        placeholder="Monto"
                        bind:value={numberAmountValue}
                        bind:this={amountInputElement}
                        class="amount-input"
                        aria-label="Monto para los números"
                        onkeydown={(event) => handleNumberAmountKeydown(event, 'amount')}
                    />
                    <input
                        type="text"
                        placeholder="Número"
                        bind:value={numberAmountInput}
                        bind:this={numberInputElement}
                        class="number-input"
                        aria-label="Número o expresión de números"
                        oninput={(event) => limitNumberExpression(event.currentTarget)}
                        onkeydown={(event) => handleNumberAmountKeydown(event, 'number')}
                    />
                </div>
            </div>
            <div class="apply-to-all-group">
                <p>No marcados</p>
                <div class="row">
                    <input
                        type="number"
                        class="apply-to-all-input"
                        placeholder="Monto"
                        bind:value={applyToUncheckedValue}
                        inputmode="decimal"
                        aria-label="Monto"
                        oninput={(event) => handleUncheckedBulkValueInput(event)}
                        onkeydown={(event) => handleUncheckedBulkValueInput(event)}
                    />
                    <input
                        type="number"
                        class="apply-to-all-input"
                        placeholder="%"
                        bind:value={applyPercentageToUncheckedValue}
                        inputmode="decimal"
                        aria-label="%"
                        oninput={(event) => handleUncheckedBulkValueInput(event, true)}
                        onkeydown={(event) => handleUncheckedBulkValueInput(event, true)}
                    />
                </div>
            </div>
            <div class="apply-to-all-group">
                <p>Marcados</p>
                <div class="row">
                    <input
                        type="number"
                        class="apply-to-all-input"
                        placeholder="Monto"
                        bind:value={applyToAllValue}
                        inputmode="decimal"
                        aria-label="Monto"
                        oninput={(event) => handleBulkValueInput(event)}
                        onkeydown={(event) => handleBulkValueInput(event)}
                    />
                    <input
                        type="number"
                        class="apply-to-all-input"
                        placeholder="%"
                        bind:value={applyPercentageToAllValue}
                        inputmode="decimal"
                        aria-label="%"
                        oninput={(event) => handleBulkValueInput(event, true)}
                        onkeydown={(event) => handleBulkValueInput(event, true)}
                    />
                </div>
            </div>

        </div>
    </div>
    <div class="right">
        <button
            onclick={() => {showLoadList = true}}
        >
            Cargar lista
        </button>
        <button
            onclick={() => {showLoadListByQR = true}}
        >
            Cargar lista por QR
        </button>
        <button
            onclick={() => {showModifyList = true}}
        >
            Modificar lista
        </button>
        <button
            onclick={() => {showOperationsMatrix = true}}
            hidden={!hasLoadedListToModify}
        >
            Mostrar operaciones
        </button>
        {#if hasLoadedListToModify}
            <label class="allow-negative">
                <input type="checkbox" bind:checked={allowNegative} />
                Permite negativos
            </label>
        {/if}


        <h2 class="total">
            Total: {formatAmount(originalTotal)}
        </h2>
        <h2>
            Total +/-: {formatAmount(modifiedTotal)}
        </h2>

        <div class="row">
            {#if hasLoadedListToModify}
            <button
                type="button"
                onclick={() => handleChangeModifications('add')}
            >
                +
            </button>
            <button
                type="button"
                onclick={() => handleChangeModifications('sub')}
            >
                -
            </button>
            {/if}
        </div>
        <button
            onclick={hasLoadedListToModify ? saveModifications : openSaveConfiguration}
            disabled={isSaving || (hasLoadedListToModify ? false : !matrixIsDirty)}
        >
            {isSaving ? 'Guardando...' : 'Guardar'}
        </button>

        <button
            onclick={clearLoadedList}
        >
            Limpiar
        </button>
    </div>
</section>
{/if}


<style>
    .list-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: start;
        flex-direction: row;
        width: 100%;
        box-sizing: border-box;
        gap: 1rem;
    }

    .column {
        gap: 1rem;
        display: flex;
        flex-direction: column;
    }

    .inputs-group {
        background-color: var(--color-box-background);
        border: 1px solid var(--color-border);
        padding: 1rem !important;
    }

    .right {
        flex: 1;
        border: 1px solid var(--color-border);
		display: flex;
		padding: 1rem;
		flex-direction: column;
		height: 100%;
		background-color: var(--color-box-background);
		gap: 1rem;
		position: relative;
    }

    .right button {
        width: 100%;
        white-space: normal;
        text-align: left;
        line-height: 1.4;
    }

    .allow-negative {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .apply-to-all-input {
        width: 100%;
        box-sizing: border-box;
    }

    .total {
        margin-top: auto;
    }

    h2 {
        margin: 0;
        text-align: center;
        font-size: 1.3rem;
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

    :global(.list-container .column.left) {
        flex: 6;
    }

    :global(.matrix-cell-number) {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.2rem;
        border: 1px solid var(--color-border);
        width: 40%;
        gap: 0.5rem;
        background: var(--color-box-background);
    }

    .amount-input {
        width: 30% !important;
    }

    .number-input {
        width: 100% !important;
    }
</style>
