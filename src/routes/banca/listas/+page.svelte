<script lang="ts">
    import { onMount } from 'svelte';
    import { acts } from '@tadashi/svelte-notification';
    import MatrixInput from "$lib/components/listas/MatrixInput.svelte";
    import MatrixOperations from "$lib/components/listas/MatrixOperations.svelte";
    import MatrixValueControls from "$lib/components/listas/MatrixValueControls.svelte";
    import ListasFilterModal from '../../../lib/components/listas/ListasFilterModal.svelte';
    import LoadListFromQrModal from '$lib/components/listas/LoadListFromQrModal.svelte';
    import MatrixComparisonModal from '$lib/components/listas/MatrixComparisonModal.svelte';
    import ExportModal from '$lib/components/listas/ExportModal.svelte';
    import { decodeExportedListQrData, formatAmount } from '$lib/printing/printing';
    import { auth } from '$lib/stores/auth';
    import { getBancaFilterData } from '$lib/stores/bancaFilterCache';

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
	let from = $state(utcMinus6Date.toISOString().split('T')[0]);
	let to = $state(utcMinus6Date.toISOString().split('T')[0]);
	let selectedBranch = $state<number | undefined>();
	let selectedDrawSchedule = $state<number | undefined>();
	let selectedBranches = $state<number[]>([]);
	let selectedDrawSchedules = $state<number[]>([]);
    let hasLoadedListToModify = $state(false);
    let hasLoadedMultipleListsToModify = $state(false);
	let isSaving = $state(false);
    let showSaveModal = $state(false);
    let showOverwriteModal = $state(false);
    let saveReventado = $state(false);
    let saveMegareventado = $state(false);
    let existingListExists = $state(false);
    let existingMatrix = $state<Record<number, number>>({});
    let originalMatrix = $state<Record<number, number>>({});
    let savedMatrix = $state<Record<number, number>>({});
    let showLoadList = $state(false);
    let showLoadListByQR = $state(false);
    let showModifyMultipleLists = $state(false);
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
    let showOperationsMatrix = $state(false);
    let showExportModalCurrent = $state(false);
    let allowNegative = $state(false);

	let { data } = $props();

    const currentExportMatrix = $derived.by(() => {
        if (matrixMode !== 'operations') {
            return createSelection;
        }

        return Object.fromEntries(
            Array.from({ length: 100 }, (_, number) => [number, getModifiedValue(number)])
        );
    });

    const matrixIsDirty = $derived.by(() => {
        const currentKeys = Object.keys(createSelection);
        const savedKeys = Object.keys(savedMatrix);

        return currentKeys.length > 0 && (
            isListLoaded ||
            hasLoadedMultipleListsToModify ||
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
		const filterData = getBancaFilterData(data ?? {});
		const branchNamesItems = filterData.branchNames as any[];
		branchNames = [
			...branchNamesItems.map((item) => ({
				value: Number(item.id),
				label: String(item.name)
			}))
		];
	});

	$effect(() => {
		const filterData = getBancaFilterData(data ?? {});
		const scheduleNamesItems = filterData.scheduleNames as any[];
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
        hasLoadedMultipleListsToModify = false;
        matrixMode = 'input';
        isListLoaded = false;
        originalMatrix = {};
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
            originalMatrix = {};
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

    function getModifiedValue(index: number) {
        const baseValue = Number(createSelection[index] ?? 0);
        const modification = createSelectionModifications[index];

        if (!Number.isFinite(baseValue) || !modification || !Number.isFinite(modification.modification)) {
            return Number.isFinite(baseValue) ? baseValue : 0;
        }

        const amount = modification.operation === '-'
            ? getEffectiveSubtraction(modification.modification, baseValue)
            : modification.modification;

        return baseValue + (modification.operation === '+' ? amount : -amount);
    }

    function getSaveMatrix() {
        if (!hasLoadedMultipleListsToModify) {
            return createSelection;
        }

        return Object.fromEntries(
            Array.from({ length: 100 }, (_, number) => [number, getModifiedValue(number)])
        );
    }

    function getSaveNumbers() {
        const saveMatrix = getSaveMatrix();

        return Array.from({ length: 100 }, (_, number) => ({
            number,
            amount: Number.isFinite(saveMatrix[number]) ? saveMatrix[number] : 0
        }));
    }

    function applyOperationsWithoutSaving() {
        if (!hasLoadedMultipleListsToModify) {
            return;
        }

        createSelection = Object.fromEntries(
            Object.keys(createSelectionModifications).map((rawIndex) => {
                const index = Number(rawIndex);
                return [index, getModifiedValue(index)];
            })
        );

        createSelectionModifications = Object.fromEntries(
            Object.entries(createSelectionModifications).map(([index, item]) => [
                index,
                {
                    ...item,
                    originalValue: createSelection[Number(index)] ?? item.originalValue,
                    modification: 0
                }
            ])
        );
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
            originalMatrix = {};
            isListLoaded = false;
            hasLoadedListToModify = false;
            hasLoadedMultipleListsToModify = false;
            matrixMode = 'input';
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
        if (!hasLoadedListToModify && !hasLoadedMultipleListsToModify) {
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
                originalMatrix = { ...fetchedValues };
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

            originalMatrix = { ...fetchedValues };

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

    async function fetchMultipleListsToModify() {
        try {
            const response = await fetch(`/banca/listas/filtered?date_from=${from}&date_to=${to}&branches=${encodeURIComponent(selectedBranches.join(','))}&draw_schedules=${encodeURIComponent(selectedDrawSchedules.join(','))}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});
            const payload = await response.json();

            const dataItems: RegistryItem[] = (Array.isArray(payload?.items) ? payload.items : [])
            console.log('dataItems', dataItems);
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

                if (Number.isFinite(number) && Number.isFinite(value)) {
                    acc[number] = value;
                }

                return acc;
            }, {});
            if (Object.keys(fetchedValues).length > 0) {
                loadFetchedValuesToModify(fetchedValues);
                originalMatrix = { ...fetchedValues };
            } else {
                acts.add({
                    message: 'La respuesta no contiene números válidos.',
                    mode: 'error',
                    lifetime: 3
                });
                return;
            }

            hasLoadedListToModify = false;
            isListLoaded = false;
            matrixMode = 'operations';
            showModifyMultipleLists = false;
            hasLoadedMultipleListsToModify = true;
        } catch {
            acts.add({
                message: 'Error al cargar la lista',
                mode: 'error',
                lifetime: 3
            });
            matrixMode = 'input';
            hasLoadedMultipleListsToModify = false;
        } finally {
            isSaving = false;
        }
    }
</script>

<ExportModal
    bind:showModal={showExportModalCurrent}
    data={currentExportMatrix}
    dateFrom={selectedDate}
    dateTo={selectedDate}
    total={matrixMode === 'operations' ? modifiedTotal : originalTotal}
    puestos={[]}
    sorteos={[]}
    branchNames={branchNames}
	drawScheduleNames={drawScheduleNames}
	scheduleBranch={getBancaFilterData(data ?? {}).scheduleBranch}
/>

<svelte:head>
    <title>Listas</title>
</svelte:head>


<ListasFilterModal
    bind:selectedDate={selectedDate}
    bind:selectedBranch={selectedBranch}
    branchNames={branchNames}
    drawScheduleNames={drawScheduleNames}
    scheduleBranch={getBancaFilterData(data ?? {}).scheduleBranch}
    bind:selectedDrawSchedule={selectedDrawSchedule}
    onConfirm={fetchListToModify}
    bind:showModal={showModifyList}
/>

<ListasFilterModal
    bind:from={from}
    bind:to={to}
    bind:selectedBranch={selectedBranches}
    branchNames={branchNames}
    drawScheduleNames={drawScheduleNames}
    scheduleBranch={getBancaFilterData(data ?? {}).scheduleBranch}
    bind:selectedDrawSchedule={selectedDrawSchedules}
    onConfirm={fetchMultipleListsToModify}
    bind:showModal={showModifyMultipleLists}
    selectionMode="multiple"
/>

<ListasFilterModal
    bind:selectedDate={selectedDate}
    bind:selectedBranch={selectedBranch}
    branchNames={branchNames}
    drawScheduleNames={drawScheduleNames}
    scheduleBranch={getBancaFilterData(data ?? {}).scheduleBranch}
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
    scheduleBranch={getBancaFilterData(data ?? {}).scheduleBranch}
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
    createdMatrix={getSaveMatrix()}
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
                scheduleBranch={getBancaFilterData(data ?? {}).scheduleBranch}
            />
        {:else}
            <MatrixInput
                bind:valueMap={createSelection}
                bind:selectedCells
                selectionMode={selectionMode}
                mode="20x5"
            />
        {/if}

        <MatrixValueControls
            bind:createSelection
            bind:createSelectionModifications
            bind:selectedCells
            bind:applyToAllValue
            bind:applyPercentageToAllValue
            bind:applyToUncheckedValue
            bind:applyPercentageToUncheckedValue
            bind:checkedPercentageBaseTotal
            bind:uncheckedPercentageBaseTotal
            bind:checkedPercentageDirty
            bind:uncheckedPercentageDirty
            bind:numberAmountInput
            bind:numberAmountValue
            {originalMatrix}
            {hasLoadedMultipleListsToModify}
            {matrixMode}
            {originalTotal}
            {modifiedTotal}
            {allowNegative}
            {getModifiedValue}
        />
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
            onclick={() => {showModifyMultipleLists = true}}
        >
            Recorte
        </button>
        <button
            type="button"
            onclick={() => {showExportModalCurrent = true}}
        >
            Ver QR
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
            {#if hasLoadedListToModify || hasLoadedMultipleListsToModify}
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
        {#if hasLoadedMultipleListsToModify}
            <button
                type="button"
                onclick={applyOperationsWithoutSaving}
            >
                Aplicar operaciones
            </button>
        {/if}
        <button
            onclick={hasLoadedListToModify && !hasLoadedMultipleListsToModify
                ? saveModifications
                : openSaveConfiguration}
            disabled={isSaving}
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
</style>
