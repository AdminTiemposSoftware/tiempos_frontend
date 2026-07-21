<script lang="ts">
    import { auth } from '../../../lib/stores/auth';
	import ProhibitedNumberModal from '../../../lib/components/ProhibitedNumberModal.svelte';
    import ConfirmModal from '../../../lib/components/ConfirmModal.svelte';
    import Matrix from '../../../lib/components/venta/Matrix.svelte';
	import {Notifications, acts} from '@tadashi/svelte-notification'
	import SelectModal from '../../../lib/components/SelectModal.svelte';
	import { GROUPING_OPTIONS, type GroupingMode, type ReportItem } from '../../../lib/components/venta/grouping';
	
    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
	let prohibitedNumberToDelete = $state<prohibitedNumber | null>(null);
	let prohibitedNumbers = $state<prohibitedNumber[]>([]);
	let showDeleteProhibitedModal = $state(false);
	let showAddProhibitedModal = $state(false);
	let showUpdateProhibitedModal = $state(false);
	let selectedProhibitedNumber = $state<prohibitedNumber | undefined>(undefined);
	let branchNames = $state<{ value: number; label: string }[]>([]);
	let drawScheduleNames = $state<{ value: number; label: string }[]>([]);
	let selectedBranch = $state<number[]>([]);
	let selectedDrawSchedule = $state<number[]>([]);
	let groupingModes = $state<GroupingMode[]>(['branch']);
	let from =  $state(utcMinus6Date.toISOString().split('T')[0]);
	let to =  $state(utcMinus6Date.toISOString().split('T')[0]);
	let report = $state<ReportItem[]>([]);
	let isLoading = $state<boolean>(false);
    let { data } = $props();

	type prohibitedNumber = {
		id: number;
		number: number;
		amount: number;
		starter: number;
		can_sell_after_amount: boolean;
		by_amount: boolean;
		by_percentage: boolean;
	};

    async function handleConfirmDeleteProhibitedNumber() {
		if (prohibitedNumberToDelete == null) {
			return;
		}

		const response = await fetch(`/number/prohibited/${prohibitedNumberToDelete.id}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' }
		});

		if (!response.ok) {
			acts.add({
				message: "Error al eliminar el numero restringido.",
				mode: 'error', 
				lifetime: 3
			});
			return;
		}

		showUpdateProhibitedModal = false;
		prohibitedNumbers = prohibitedNumbers.filter((item) => item.number !== prohibitedNumberToDelete?.number);
		prohibitedNumberToDelete = null;
	}

	function openAddProhibitedModal() {
		showAddProhibitedModal = true;
	}

	async function handleAddProhibitedNumber(payload: { number: string; amount: string, starter: string, can_sell_after_amount: boolean, by_amount: boolean, by_percentage: boolean }) {
		if (prohibitedNumbers.some((item) => item.number === Number(payload.number))) {
			// TODO el numero ya esta en la lista, mostrar mensaje de error
			return;
		}
		
		const value = Number(payload.number);
		const amount = Number(payload.amount);
		const starter = Number(payload.starter);
		const can_sell_after_amount = payload.can_sell_after_amount;
		const by_amount = payload.by_amount;
		const by_percentage = payload.by_percentage;
		if (!Number.isFinite(amount)) {
			return;
		}
		const response = await fetch('/number/prohibited', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ 
				number: value, 
				amount, starter, 
				can_sell_after_amount: can_sell_after_amount, 
				by_amount: by_amount,
				by_percentage: by_percentage })
		});
		if (!response.ok) {
			return;
		}

		const newProhibitedId = await response.json();
		
		console.log('Nuevo ID de número restringido:', newProhibitedId.items[0].NewProhibitedId);

		prohibitedNumbers = prohibitedNumbers.some((item) => item.number === value)
			? prohibitedNumbers
			: [...prohibitedNumbers, { 
				id: newProhibitedId.items[0].NewProhibitedId,
				number: value, 
				amount, 
				starter, 
				can_sell_after_amount: can_sell_after_amount, 
				by_amount: by_amount, 
				by_percentage: by_percentage }].sort((a, b) => a.number - b.number);
		showAddProhibitedModal = false;
	}

	const handleUpdateProhibitedNumber = async (payload: 
	{ 
		id: number; 
		number: string; 
		amount: string, 
		starter: string, 
		can_sell_after_amount: boolean, 
		by_amount: boolean, 
		by_percentage: boolean 
	}) => {

		const response = await fetch(`/number/prohibited/${payload.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!response.ok) {
			//TODO send notification of error
			return;
		}
		prohibitedNumbers = prohibitedNumbers.map((item) => 
			item.id === payload.id 
			? { 
				...item, 
				amount: Number(payload.amount), 
				starter: Number(payload.starter), 
				can_sell_after_amount: Boolean(payload.can_sell_after_amount), 
				by_amount: Boolean(payload.by_amount), 
				by_percentage: Boolean(payload.by_percentage) 
			} : item
		);
		showUpdateProhibitedModal = false;
	}

	
    $effect(() => {
		const prohibitedItems = Array.isArray(data?.prohibitedItems)
			? (data.prohibitedItems as prohibitedNumber[])
			: [];
		prohibitedNumbers = prohibitedItems
			.map((item) => ({
				id: item.id,
				number: Number(item.number),
				amount: Number(item.amount),
				starter: Number(item.starter),
				can_sell_after_amount: Boolean(item.can_sell_after_amount),
				by_amount: Boolean(item.by_amount),
				by_percentage: Boolean(item.by_percentage)
			}))
			.filter((item) => Number.isFinite(item.number) && Number.isFinite(item.amount))
			.sort((a, b) => a.number - b.number);
    });

	$effect(() => {
		const branchNamesItems = Array.isArray(data?.branchNames)
			? (data.branchNames as any[])
			: [];
		branchNames = [
			{ value: 0, label: 'Todos' },
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
			{ value: 0, label: 'Todos' },
			...scheduleNamesItems.map((item) => ({
				value: Number(item.draw_schedule_id),
				label: `${String(item.draw_name)} - ${String(item.draw_schedule_name)}`
			}))
		];
	});

	$effect(() => {
		const reportTodayItems = Array.isArray(data?.reportTodayItems)
			? (data.reportTodayItems as any[])
			: [];

		report = reportTodayItems
			.map((item) => ({
				branch_id: Number(item.branch_id),
				branch_name: String(item.branch_name),
				draw_schedule_id: Number(item.draw_schedule_id),
				draw_schedule_name: String(item.draw_schedule_name),
				draw_id: Number(item.draw_id),
				draw_name: String(item.draw_name),
				number: Number(item.number),
				amount: Number(item.amount),
				is_reventado: Boolean(item.is_reventado),
				is_megareventado: Boolean(item.is_megareventado),
				date: String(item.date)
			}))
			.filter(
				(item) =>
					Number.isFinite(item.number) &&
					Number.isFinite(item.amount)
			)
			.sort((a, b) => a.number - b.number);
	});

	async function applyFilters() {
		isLoading = true;
		if (from > to) {
            acts.add({
                message: "La fecha 'Desde' no puede ser mayor que la fecha 'Hasta'.",
                mode: 'error', 
                lifetime: 3
            });
			return;
		}

		let branchesPayload: number[] = [];
		let drawSchedulesPayload: number[] = [];
		// All option is selected
		if (selectedBranch.includes(0)) {
			branchesPayload = branchNames.slice(1).map((item) => item.value);
		} else {
			branchesPayload = selectedBranch;
		}

		// All option is selected
		if (selectedDrawSchedule.includes(0)) {
			drawSchedulesPayload = drawScheduleNames.slice(1).map((item) => item.value);
		} else {
			drawSchedulesPayload = selectedDrawSchedule;
		}

		const response = await fetch(`/banca/report?date_from=${from}&date_to=${to}&branches=${encodeURIComponent(branchesPayload.join(','))}&draw_schedules=${encodeURIComponent(drawSchedulesPayload.join(','))}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

		if (!response.ok) {
			acts.add({
				message: "Error al aplicar filtros.",
				mode: 'error', 
				lifetime: 3
			});
			return;
		}

		const data = await response.json();
		const dataItems = Array.isArray(data?.items)
			? (data.items as any[])
			: [];

		report = dataItems
			.map((item) => ({
				branch_id: Number(item.branch_id),
				branch_name: String(item.branch_name),
				draw_schedule_id: Number(item.draw_schedule_id),
				draw_schedule_name: String(item.draw_schedule_name),
				draw_id: Number(item.draw_id),
				draw_name: String(item.draw_name),
				number: Number(item.number),
				amount: Number(item.amount),
				is_reventado: Boolean(item.is_reventado),
				is_megareventado: Boolean(item.is_megareventado),
				date: String(item.date)
			}))
			.filter(
				(item) =>
					Number.isFinite(item.number) &&
					Number.isFinite(item.amount)
			)
			.sort((a, b) => a.number - b.number);

		isLoading = false;
	}


	function showDeleteProhibitedNumber(value: prohibitedNumber) {
		prohibitedNumberToDelete = value;
		showDeleteProhibitedModal = true;
	}

	function openUpdateProhibitedModal(prohibitedNumber: prohibitedNumber) {
		selectedProhibitedNumber = prohibitedNumber;
		showUpdateProhibitedModal = true;
	}

	function toggleGroupingMode(mode: GroupingMode) {
		if (groupingModes.includes(mode)) {
			if (groupingModes.length === 1) {
				return;
			}

			groupingModes = groupingModes.filter((item) => item !== mode);
			return;
		}

		groupingModes = [...groupingModes, mode];
	}

	function moveGroupingMode(mode: GroupingMode, direction: -1 | 1) {
		const currentIndex = groupingModes.indexOf(mode);

		if (currentIndex === -1) {
			return;
		}

		const targetIndex = currentIndex + direction;

		if (targetIndex < 0 || targetIndex >= groupingModes.length) {
			return;
		}

		const nextModes = [...groupingModes];
		[nextModes[currentIndex], nextModes[targetIndex]] = [nextModes[targetIndex], nextModes[currentIndex]];
		groupingModes = nextModes;
	}

	function getGroupingModeLabel(mode: GroupingMode) {
		return GROUPING_OPTIONS.find((option: { value: GroupingMode; label: string }) => option.value === mode)?.label ?? mode;
	}
</script>

<svelte:head>
    <title>Inicio</title>
</svelte:head>

<ConfirmModal
	bind:showModal={showDeleteProhibitedModal}
	message={
		prohibitedNumberToDelete == null
			? 'Eliminar numero restringido?'
			: `Eliminar el numero ${prohibitedNumberToDelete.number}?`
	}
	confirmText="Eliminar"
	cancelText="Cancelar"
	confirm={handleConfirmDeleteProhibitedNumber}
/>

<!-- <ProhibitedNumberModal
	bind:showModal={showUpdateProhibitedModal}
	bind:prohibited={selectedProhibitedNumber}
	title="Actualizar numero restringido"
	confirmText="Guardar"
	cancelText="Cancelar"
	handleUpdateProhibitedNumber={handleUpdateProhibitedNumber}
	handleDeleteProhibitedNumber={showDeleteProhibitedNumber}
/>

<ProhibitedNumberModal
	bind:showModal={showAddProhibitedModal}
	title="Agregar numero restringido"
	confirmText="Guardar"
	cancelText="Cancelar"
	handleAddProhibitedNumber={handleAddProhibitedNumber}
/> -->

{#if ['banking'].includes($auth.user?.role ?? '')}
<section class="inicio">
    <!-- <div class="ganadores">
        <h2>Aun tienes pendiente de asignar los ganadores de los sorteos:</h2>
        
    </div> -->
    <div class="content">
        <div class="left">
            <div class="filters">
                <div class="field">
                    <label for="from">Desde</label>
                    <input id="from" type="date" bind:value={from}/>
                </div>
                <div class="field">
                    <label for="to">Hasta</label>
                    <input id="to" type="date" bind:value={to}/>
                </div>
                <div class="field">
                    <label for="puesto">Puesto</label>
					<SelectModal
						options={branchNames}
						bind:selected={selectedBranch}
						placeholder="Seleccione un puesto"
					/>
				</div>
	            <div class="field">
	                <label for="sorteo">Sorteo</label>
					<SelectModal
						options={drawScheduleNames}
						bind:selected={selectedDrawSchedule}
						placeholder="Seleccione un sorteo"
					/>
	            </div>
				
				<button type="button" class="option-button" onclick={applyFilters}>
					Filtrar	
				</button>
            </div>
	        <Matrix bind:report={report} bind:isLoading={isLoading} bind:groupingModes={groupingModes} />
			<button type="button" class="option-button" onclick={applyFilters}>
				Obtener reporte	
			</button>
        </div>
        <div class="right">
			<div class="field grouping-field">
				<label for="agrupacion">Agrupación</label>
					<div class="grouping-options">
						{#each GROUPING_OPTIONS as option}
							<button
								type="button"
								class={`grouping-option ${groupingModes.includes(option.value) ? 'selected' : ''}`}
								onclick={() => toggleGroupingMode(option.value)}
							>
								<input type="checkbox" checked={groupingModes.includes(option.value)} readonly />
								<span>{option.label}</span>
							</button>
						{/each}
					</div>
				<div class="grouping-order">
					<label for="orden">Orden</label>
					<div class="grouping-chip-list">
						{#each groupingModes as mode, index}
							<div class="chip">
								<span>{index + 1}. {getGroupingModeLabel(mode)}</span>
								<div class="grouping-chip-actions">
									<button type="button" onclick={() => moveGroupingMode(mode, -1)} disabled={index === 0}>↑</button>
									<button type="button" onclick={() => moveGroupingMode(mode, 1)} disabled={index === groupingModes.length - 1}>↓</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
        </div>
    </div>
    <header>
        <div class="prohibited">
            <span class="label">Restringidos:</span>
            <div class="prohibited-list">
				<button
					class={`prohibited-badge`}
					onclick={() => {}}
					aria-label={`Actualizar numero restringido}`}
				>
					<span class="prohibited-number">Numero</span>
					
					<span class="prohibited-amount">Monto</span>
					<span class="prohibited-starter">Arranque</span>

				</button>
                {#if prohibitedNumbers?.length}
                    {#each prohibitedNumbers as prohibitedNumber}
                        <button
                            class={`prohibited-badge ${!prohibitedNumber.can_sell_after_amount ? 'can-sell-after-amount' : ''}`}
                            onclick={() => {openUpdateProhibitedModal(prohibitedNumber);}}
                            aria-label={`Actualizar numero restringido ${prohibitedNumber.number}`}
                        >
							<span class="prohibited-number">{prohibitedNumber.number}</span>
							
							<span class="prohibited-amount">{prohibitedNumber.amount}</span>
							<span class="prohibited-starter">{prohibitedNumber.starter}</span>

						</button>
                    {/each}
                {:else}
                    <span class="prohibited-empty">-</span>
                {/if}
                <button
                    type="button"
                    class="prohibited-badge prohibited-add"
                    onclick={openAddProhibitedModal}
                    aria-label="Agregar numero restringido"
                >
                    +
                </button>
            </div>
        </div> 
    </header>
</section>
<Notifications />

{/if}

<style>
    .inicio {
        flex: 1;
		justify-content: space-between;
        flex-direction: column;
    }

	.field {
		min-width: 8rem;
	}
	.field input {
		height: 57.59%;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: flex-end;
	}

	.grouping-field {
		flex: 1 1 100%;
	}

	.grouping-editor {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		background-color: #fff;
	}

	.grouping-options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.grouping-option {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.65rem;
		border: 1px solid var(--color-border);
		background-color: white;
		color: var(--color-text);
		font-size: 0.85rem;
	}

	.grouping-option.selected {
		border-color: var(--color-theme-2);
		background: var(--color-theme-8);
	}

	.grouping-option input {
		width: auto;
		height: auto;
	}

	.grouping-order {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.grouping-order-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.grouping-chip-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.grouping-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.6rem;
		border: 1px solid var(--color-border);
		background-color: var(--color-box-background);
	}

	.grouping-chip-actions {
		display: inline-flex;
		gap: 0.25rem;
	}

	.grouping-chip-actions button {
		padding: 0.15rem 0.35rem;
		border: 1px solid var(--color-border);
		background: #fff;
		color: var(--color-text);
	}

	.grouping-chip-actions button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

    .left {
		border: 1px solid var(--color-border);
		display: flex;
		padding: 1rem;
		flex-direction: column;
        flex: 5;
		gap: 1rem;
    }
    .right {
        flex: 1;
		border: 1px solid var(--color-border);
		padding: 1rem;
		gap: 1rem;
		display: flex;
		flex-direction: column;
    }

	.option-button {
		width: 100%;
	}

    .content {
		padding: 1rem;
		background-color: var(--color-box-background);
		border: 1px solid var(--color-border);
        display: flex;
        gap: 1rem;
    }

	.ganadores {
		padding: 1rem;
		background-color: var(--color-box-background);
		border: 1px solid var(--color-border);
		margin-bottom: 1rem;
		display: flex;
		width: 100%;
	}
	.prohibited {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: start;
	}
	.prohibited-badge {
		display: flex;
		flex-direction: column;
		font-size: 1.1rem;
		border-radius: 0;
		padding: 0rem;
		min-width: 50px;
		border: 2px solid var(--color-border);
		color: var(--color-text);
		width: fit-content;
		height: 100%;
		gap: 0;
	}
	
	.prohibited-badge *{
		padding: 0.35rem;
	}

	.prohibited-badge:hover {
		background-color: white;
		color: var(--color-theme-1);
	}
	.prohibited-add {
		border-style: dashed;
		color: var(--color-theme-2);
		border-color: var(--color-theme-2);
		font-weight: 600;
	}

	.prohibited-list{
		gap: 0;
		display: flex;
		flex-direction: row;
	}

	.prohibited-amount, .prohibited-starter {
		font-size: 0.85rem;
		border-top: 2px solid var(--color-border);
		width: 100%;
		font-weight: 500;
	}

	.chip {
        border-radius: 0.25rem;
        background-color: white;
        color: var(--color-text);
        border: 1px solid var(--color-border);
		padding: .2rem .5rem;
		font-size: 0.85rem;
	}

</style>
