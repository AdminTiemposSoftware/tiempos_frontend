<script lang="ts">
    import { onMount } from 'svelte';
    import MatrixInput from "$lib/components/listas/MatrixInput.svelte";
    import ListasFilterModal from '../../../lib/components/listas/ListasFilterModal.svelte';
    import { decodeListQrData } from '$lib/printing/printing';
    import { auth } from '$lib/stores/auth';

    type ListItemModification = {
        originalValue: number;
        operation: '+' | '-';
        modification: number;
    };

    type OperationMode = 'create' | 'subtract';

    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    let mode = $state<OperationMode>('create');
    let showCargarLista = $state(false);
    let createSelection = $state<Record<number, number>>({});
    let subtractSelection = $state<Record<number, number>>({});
    let createSelectionModifications = $state<Record<number, ListItemModification>>({});
    let subtractSelectionModifications = $state<Record<number, ListItemModification>>({});
    let branchNames = $state<{ value: number; label: string }[]>([]);
	let drawScheduleNames = $state<{ value: number; label: string }[]>([]);
	let selectedDate =  $state(utcMinus6Date.toISOString().split('T')[0]);
	let selectedBranch = $state<number[]>([]); // These need to be arrays to support multiple selections
	let selectedDrawSchedule = $state<number[]>([]);
    let hasLoadedList = $state(false);
	let { data } = $props();

    function getDisplayNameFromSelection(value: number | undefined, options: { value: number; label: string }[]) {
        return options.find((option) => option.value === value)?.label ?? 'Sin selección';
    }

    const loadButtonLabel = $derived.by(() => {
        if (!hasLoadedList) {
            return 'Cargar lista';
        }

        const branchLabel = selectedBranch[0] !== undefined
            ? getDisplayNameFromSelection(selectedBranch[0], branchNames)
            : 'Puesto';
        const drawLabel = selectedDrawSchedule[0] !== undefined
            ? getDisplayNameFromSelection(selectedDrawSchedule[0], drawScheduleNames)
            : 'Sorteo';

        return `${selectedDate} • ${branchLabel} • ${drawLabel}`;
    });

    function getFinalValueForCell(baseValue: number, modification?: ListItemModification) {
        if (!modification) {
            return baseValue;
        }

        const delta = Number.isFinite(modification.modification) ? modification.modification : 0;

        return modification.operation === '+' ? baseValue + delta : baseValue - delta;
    }

    function getFinalSelectionTotal(selection: Record<number, number>, modifications: Record<number, ListItemModification>) {
        return Object.entries(selection).reduce((sum, [rawIndex, baseValue]) => {
            const index = Number(rawIndex);
            const value = Number(baseValue);
            const modification = modifications[index];
            return sum + getFinalValueForCell(value, modification);
        }, 0);
    }

    let totalAmount = $derived(
        mode === 'create'
            ? getFinalSelectionTotal(createSelection, createSelectionModifications)
            : getFinalSelectionTotal(subtractSelection, subtractSelectionModifications)
    );

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

    function buildModificationMap(values: Record<number, number>) {
        return Object.entries(values).reduce<Record<number, ListItemModification>>((acc, [rawIndex, value]) => {
            const index = Number(rawIndex);
            const safeValue = Number(value);

            if (!Number.isFinite(safeValue)) {
                return acc;
            }

            acc[index] = {
                originalValue: safeValue,
                operation: '+',
                modification: 0,
            };

            return acc;
        }, {});
    }

    function loadFetchedValues(nextValues: Record<number, number>) {
        const normalizedValues = Object.entries(nextValues).reduce<Record<number, number>>((acc, [rawIndex, value]) => {
            const index = Number(rawIndex);
            const safeValue = Number(value);

            if (Number.isFinite(index) && Number.isFinite(safeValue)) {
                acc[index] = safeValue;
            }

            return acc;
        }, {});

        if (mode === 'create') {
            createSelection = normalizedValues;
            createSelectionModifications = buildModificationMap(normalizedValues);
            return;
        }

        subtractSelection = normalizedValues;
        subtractSelectionModifications = buildModificationMap(normalizedValues);
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
        mode = 'create';
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete('import');
        window.history.replaceState({}, '', nextUrl);
    });

    function clearLoadedList() {
        selectedDate = utcMinus6Date.toISOString().split('T')[0];
        selectedBranch = [];
        selectedDrawSchedule = [];
        createSelection = {};
        subtractSelection = {};
        createSelectionModifications = {};
        subtractSelectionModifications = {};
        hasLoadedList = false;
    }

    async function fetchList() {
        try {
            let response = await fetch(`/banca/report?date_from=${selectedDate}&date_to=${selectedDate}&branches=${encodeURIComponent(selectedBranch.join(','))}&draw_schedules=${encodeURIComponent(selectedDrawSchedule.join(','))}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const payload = await response.json();
            const dataItems = Array.isArray(payload?.items) ? (payload.items as any[]) : [];
            const fetchedValues = dataItems.reduce<Record<number, number>>((acc, item) => {
                const number = Number(item?.number ?? item?.value ?? item?.id ?? item?.lottery_number);
                const value = Number(item?.price ?? item?.amount ?? item?.value ?? item?.total ?? 0);

                if (Number.isFinite(number) && Number.isFinite(value)) {
                    acc[number] = value;
                }

                return acc;
            }, {});

            if (Object.keys(fetchedValues).length > 0) {
                loadFetchedValues(fetchedValues);
            }

            hasLoadedList = true;
            showCargarLista = false;
            return;
        } catch (error) {
            hasLoadedList = true;
            showCargarLista = false;
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
    totalAmount={totalAmount}
    onConfirm={fetchList}
    bind:showModal={showCargarLista}
/>

{#if ['banking'].includes($auth.user?.role ?? '')}
<section class="list-container">
    {#if mode === 'create'}
        <MatrixInput
            bind:valueMap={createSelection}
            bind:modificationMap={createSelectionModifications}
            interactive={true}
            allowModifications={true}
            mode="20x5"
        />
    {:else}
        <MatrixInput
            bind:valueMap={subtractSelection}
            bind:modificationMap={subtractSelectionModifications}
            interactive={true}
            allowModifications={true}
            mode="20x5"
        />
    {/if}


        <div class="right">
            <button
                onclick={() => {showCargarLista = true}}
                title={loadButtonLabel}
            >
                {loadButtonLabel}
            </button>

            <button
                type="button"
                class="secondary"
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

    .right .secondary {
        text-align: center;
        background: transparent;
        border: 1px solid var(--color-border);
        color: var(--color-text);
    }
</style>
