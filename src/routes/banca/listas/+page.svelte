<script lang="ts">
    import { onMount } from 'svelte';
    import { acts, Notifications } from '@tadashi/svelte-notification';
    import MatrixInput from "$lib/components/listas/MatrixInput.svelte";
    import ListasFilterModal from '../../../lib/components/listas/ListasFilterModal.svelte';
    import { decodeListQrData } from '$lib/printing/printing';
    import { auth } from '$lib/stores/auth';

    type ListItemModification = {
        number_total_id: number;
        originalValue: number;
        operation: '+' | '-';
        modification: number;
    };

    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    let showCargarLista = $state(false);
    let createSelection = $state<Record<number, number>>({});
    let createSelectionModifications = $state<Record<number, ListItemModification>>({});
    let branchNames = $state<{ value: number; label: string }[]>([]);
	let drawScheduleNames = $state<{ value: number; label: string }[]>([]);
	let selectedDate =  $state(utcMinus6Date.toISOString().split('T')[0]);
	let selectedBranch = $state<number | undefined>();
	let selectedDrawSchedule = $state<number | undefined>();
    let hasLoadedList = $state(false);
	let isSaving = $state(false);
	let { data } = $props();

    function getDisplayName(value: number | undefined, options: { value: number; label: string }[]) {
        return options.find((option) => option.value === value)?.label ?? 'Sin selección';
    }

    const loadButtonLabel = $derived.by(() => {
        if (!hasLoadedList) {
            return 'Cargar lista';
        }

        const branchLabel = selectedBranch !== undefined
            ? getDisplayName(selectedBranch, branchNames)
            : 'Puesto';
        const drawLabel = selectedDrawSchedule !== undefined
            ? getDisplayName(selectedDrawSchedule, drawScheduleNames)
            : 'Sorteo';

        return `${selectedDate} • ${branchLabel} • ${drawLabel}`;
    });

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

    function loadFetchedValues(
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
    }

    onMount(() => {
        const qrValue = new URLSearchParams(window.location.search).get('import');

        if (!qrValue) {
            return;
        }

        const importedValues = decodeListQrData(qrValue);

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
        hasLoadedList = false;
    }

    function handleChangeModifications(action: 'add' | 'sub') {
        if (!hasLoadedList) {
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

    async function fetchList() {
        try {
            if (!selectedDate || !selectedBranch || !selectedDrawSchedule) return;

            let response = await fetch(`/banca/report?date_from=${selectedDate}&date_to=${selectedDate}&branches=${encodeURIComponent(selectedBranch?.toString() ?? '')}&draw_schedules=${encodeURIComponent(selectedDrawSchedule?.toString() ?? '')}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const payload = await response.json();
            const dataItems = Array.isArray(payload?.items) ? (payload.items as any[]) : [];
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
            const fetchedNumberTotalIds = dataItems.reduce<Record<number, number>>((acc, item) => {
                const number = Number(item?.number);
                const numberTotalId = Number(item?.number_total_id);

                if (Number.isFinite(number) && Number.isFinite(numberTotalId)) {
                    acc[number] = numberTotalId;
                }

                return acc;
            }, {});

            if (Object.keys(fetchedValues).length > 0) {
                loadFetchedValues(fetchedValues, fetchedNumberTotalIds);
            }

            hasLoadedList = true;
            showCargarLista = false;
            return;
        } catch (error) {
            hasLoadedList = true;
            showCargarLista = false;
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
    bind:selectedDrawSchedule={selectedDrawSchedule}
    onConfirm={fetchList}
    bind:showModal={showCargarLista}
/>

{#if ['banking'].includes($auth.user?.role ?? '')}
<section class="list-container">
    <Notifications />
    <MatrixInput
        bind:valueMap={createSelection}
        bind:modificationMap={createSelectionModifications}
        allowModifications={true}
        mode="20x5"
    />


    <div class="right">
        <button
            onclick={() => {showCargarLista = true}}
            title={loadButtonLabel}
        >
            {loadButtonLabel}
        </button>

        <div class="row bottom">
            {#if hasLoadedList}
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
            onclick={saveModifications}
            disabled={isSaving || !hasLoadedList}
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
    }

    .right button {
        width: 100%;
        white-space: normal;
        text-align: left;
        line-height: 1.4;
    }

    .bottom {
        margin-top: auto;
    }
</style>
