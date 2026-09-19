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

	let { data } = $props();

    const matrixIsDirty = $derived.by(() => {
        const currentKeys = Object.keys(createSelection);
        const savedKeys = Object.keys(savedMatrix);

        return currentKeys.length > 0 && (
            isListLoaded ||
            currentKeys.length !== savedKeys.length ||
                currentKeys.some((key) => createSelection[Number(key)] !== savedMatrix[Number(key)]));
    });

    let totalInList = $derived.by(() => {
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
                : -modification.modification;

            return total + baseValue + signedModification;
        }, 0);
    });

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

    function applyOperations(
        values: Record<number, number>,
        operations: OperationItem[]
    ) {
        return operations.reduce<Record<number, number>>((nextValues, item) => {
            const number = Number(item.number);
            const amount = Number(item.amount);

            if (!Number.isInteger(number) || number < 0 || number >= 100 || !Number.isFinite(amount)) {
                return nextValues;
            }

            const operation = String(item.operation ?? '').trim().toLowerCase();
            const signedAmount = operation === '-' || operation === 'sub' || operation === 'subtract'
                ? -amount
                : amount;

            nextValues[number] = (nextValues[number] ?? 0) + signedAmount;
            return nextValues;
        }, { ...values });
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
            console.log(numbers);
            console.log(createSelection);

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
            console.log('payload', payload.items);
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
                    applyOperations(fetchedValues, listOperations),
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
        const operations = Object.values(createSelectionModifications)
            .filter((item) => Number.isFinite(item.modification) && item.modification > 0)
            .map((item) => ({
                operation: item.operation === '+' ? 'add' : 'sub',
                number_total_id: item.number_total_id,
                amount: item.modification
            }));

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
                        : currentValue - modification;

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
    {#if matrixMode === 'operations'}
        <MatrixOperations
            bind:valueMap={createSelection}
            bind:modificationMap={createSelectionModifications}
            mode="20x5"
            operations={hasLoadedListToModify ? listOperations : []}
        />
    {:else}
        <MatrixInput
            bind:valueMap={createSelection}
            mode="20x5"
        />
    {/if}

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
        <h2>
            Total : {formatAmount(totalInList)}
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
        padding: 1rem;
        box-sizing: border-box;
        gap: 1rem;
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

    .row {
        margin-top: auto;
    }

    h2 {
        margin: 0;
        text-align: center;
        font-size: 1.3rem;
    }
</style>
