<script lang="ts">
    import { auth } from '../../../lib/stores/auth';
	import ProhibitedNumberModal from '../ProhibitedNumberModal.svelte';
    import ConfirmModal from '../ConfirmModal.svelte';
    import Matrix from '../venta/Matrix.svelte';
	import ReportModal from './ReportModal.svelte';
	import ExportModal from './ExportModal.svelte';
	import {Notifications, acts} from '@tadashi/svelte-notification'
	import SelectModal from '../SelectModal.svelte';
	import { formatAmount } from '../../printing/printing';
	import { GROUPING_OPTIONS, type GroupingMode, type ReportItem } from '../venta/grouping';

    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
	let prohibitedNumberToDelete = $state<prohibitedNumber | null>(null);
	let prohibitedNumbers = $state<prohibitedNumber[]>([]);
	let showDeleteProhibitedModal = $state(false);
	let showAddProhibitedModal = $state(false);
	let showUpdateProhibitedModal = $state(false);
	let selectedProhibitedNumber = $state<prohibitedNumber>({id: -1, number: 0, amount: 0, starter: 0, can_sell_after_amount: false, by_amount: false, by_percentage: true});
	let branchNames = $state<{ value: number; label: string }[]>([]);
	let drawScheduleNames = $state<{ value: number; label: string }[]>([]);
	let selectedBranch = $state<number[]>([]);
	let selectedDrawSchedule = $state<number[]>([]);
	let groupingModes = $state<GroupingMode[]>(['branch']);
	let matrixMode = $state<'20x5' | '5x20' | '10x10'>('10x10');
	let from =  $state(utcMinus6Date.toISOString().split('T')[0]);
	let to =  $state(utcMinus6Date.toISOString().split('T')[0]);
	let report = $state<ReportItem[]>([]);
	let isLoading = $state<boolean>(false);
	let showReportModal = $state<boolean>(false);
	let showExportModal = $state<boolean>(false);
	let reportQrData = $state<Record<number, number>>({});
	let totalQr = $state<number>(0);
	let puestosQr = $state<string[]>([]);
	let sorteosQr = $state<string[]>([]);
    let { data, user } = $props();
    let winnersFiltered = $state<WinnerItem[]>([]);
    let prohibitedFiltered = $state<prohibitedItem[]>([]);
    let totalAmountReport = $derived(report.reduce((acc, item) => acc + item.amount, 0));

    type WinnerItem = {
        position_number: number;
        date: string;
        position_id: number;
        position_multiplier: number;
        schedule_id: number;
        winner_id: number;
        winner_number: number;
    };

    type prohibitedItem = {
        banking_id: number;
        number: number;
        starter: string;
        can_sell_after_amount: boolean;
        by_amount: boolean;
        by_percentage: boolean;
        amount: string;
        date: string;
    };

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
		try {
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
            acts.add({
    			message: "Numero restringido eliminado.",
    			mode: 'success',
    			lifetime: 3
    		});
    	} catch (error) {
    		acts.add({
    			message: "Error al eliminar el numero restringido.",
    			mode: 'error',
    			lifetime: 3
    		});
            console.error(error);
    	}
	}

	function openAddProhibitedModal() {
		showAddProhibitedModal = true;
	}

	async function handleAddProhibitedNumber(payload: { number: string; amount: string, starter: string, can_sell_after_amount: boolean, by_amount: boolean, by_percentage: boolean }) {
		if (prohibitedNumbers.some((item) => item.number === Number(payload.number))) {
		    acts.add({
				message: 'El numero ya esta en la lista de numeros prohibidos.',
				mode: 'error',
				lifetime: 3
			});
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
		try {
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
    			acts.add({
    				message: 'Error al agregar el numero prohibido',
    				mode: 'error',
    				lifetime: 3
    			});
				return;
			}

    		const newProhibitedId = await response.json();

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
            acts.add({
                message: 'Numero prohibido agregado correctamente',
                mode: 'success',
                lifetime: 3
            });
		} catch (e) {
			acts.add({
				message: 'Error al agregar el numero prohibido',
				mode: 'error',
				lifetime: 3
			});
			console.error(e);
		}
	}

	const handleUpdateProhibitedNumber = async (payload: { id: number; number: string; amount: string; starter: string; can_sell_after_amount: boolean; by_amount: boolean; by_percentage: boolean }) => {
		try {
			const response = await fetch(`/number/prohibited/${payload.id}`, {
     			method: 'PUT',
     			headers: { 'Content-Type': 'application/json' },
     			body: JSON.stringify(payload)
      		});
      		if (!response.ok) {
                acts.add ({
                    message: 'Error al actualizar el numero prohibido',
    			    mode: 'error',
    				lifetime: 3
    			});
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
            acts.add({
                message: 'Numero prohibido actualizado correctamente',
                mode: 'success',
                lifetime: 3
            });

		} catch (error) {
		    console.error(error)
			acts.add ({
                message: 'Error al agregar el numero prohibido',
			    mode: 'error',
				lifetime: 3
			});
		}
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

	$effect(() => {
		const reportTodayItems = Array.isArray(data?.reportTodayItems)
			? (data.reportTodayItems as any[])
			: [];

		report = reportTodayItems.map((item) => ({
			branch_id: Number(item.branch_id),
			branch_name: String(item.branch_name),
			branch_comission: Number(item.branch_comission),
			draw_schedule_id: Number(item.draw_schedule_id),
			draw_schedule_name: String(item.draw_schedule_name),
			draw_id: Number(item.draw_id),
			draw_name: String(item.draw_name),
			number: Number(item.number),
			amount: Number(item.amount),
			is_reventado: Boolean(item.is_reventado),
			is_megareventado: Boolean(item.is_megareventado),
			date: String(item.date)
		})).filter((item) => Number.isFinite(item.number) && Number.isFinite(item.amount))
		.sort((a, b) => a.number - b.number);
	});

	function validFilters() {
        if (from > to) {
                acts.add({
                    message: "La fecha 'Desde' no puede ser mayor que la fecha 'Hasta'.",
                    mode: 'error',
                    lifetime: 3
                });
       	return false;
        }

        if (selectedBranch.length === 0 && user === 'banking') {
            acts.add({
                    message: "Seleccione al menos un puesto",
                    mode: 'error',
                    lifetime: 3
                });
       	return false;
        }

        if (selectedDrawSchedule.length === 0) {
            acts.add({
                    message: "Seleccione al menos un horario",
                    mode: 'error',
                    lifetime: 3
                });
       	return false;
        }

        return true;
	}

	async function applyFilters() {
	    if (!validFilters()) return;
		try {
		    isLoading = true;
			let response;
			if (user === 'banking') {
				response = await fetch(`/banca/report?date_from=${from}&date_to=${to}&branches=${encodeURIComponent(selectedBranch.join(','))}&draw_schedules=${encodeURIComponent(selectedDrawSchedule.join(','))}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				});
			} else {
				response = await fetch(`/puesto/report?date_from=${from}&date_to=${to}&draw_schedules=${encodeURIComponent(selectedDrawSchedule.join(','))}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				});
			}
    		if (!response.ok) {
    			acts.add({
    				message: "Error al aplicar filtros.",
    				mode: 'error',
    				lifetime: 3
    			});
     		    isLoading = false;
    			return;
    		}

    		const data = await response.json();
    		const dataItems = Array.isArray(data?.items)
    			? (data.items as any[])
    			: [];

    		report = dataItems.map((item) => ({
    			branch_id: Number(item.branch_id),
    			branch_name: String(item.branch_name),
                branch_comission: Number(item.branch_comission),
    			draw_schedule_id: Number(item.draw_schedule_id),
    			draw_schedule_name: String(item.draw_schedule_name),
    			draw_id: Number(item.draw_id),
    			draw_name: String(item.draw_name),
    			number: Number(item.number),
    			amount: Number(item.amount),
    			is_reventado: Boolean(item.is_reventado),
    			is_megareventado: Boolean(item.is_megareventado),
    			date: String(item.date)
    		})).filter(
    			(item) => Number.isFinite(item.number) && Number.isFinite(item.amount))
    		.sort((a, b) => a.number - b.number);

    		totalAmountReport = report.reduce((acc, item) => acc + item.amount, 0);
    		isLoading = false;
		} catch (error) {
			acts.add({
				message: "Error al aplicar filtros.",
				mode: 'error',
				lifetime: 3
			});
			isLoading = false;
			console.error(error);
		}
	}

	async function fetchWinnersFiltered() {
	    if (!validFilters()) return;
		try {
		    isLoading = true;
			let response;
			if (user === 'banking') {
				response = await fetch(`/banca/ganadores/filtered?date_from=${from}&date_to=${to}&branches=${encodeURIComponent(selectedBranch.join(','))}&draw_schedules=${encodeURIComponent(selectedDrawSchedule.join(','))}`, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' }
				});
			} else {
				response = await fetch(`/puesto/ganadores/filtered?date_from=${from}&date_to=${to}&draw_schedules=${encodeURIComponent(selectedDrawSchedule.join(','))}`, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' }
				});
			}
			const data = await response.json();
			const winnerItems = Array.isArray(data.items) ? data.items as WinnerItem[] : [];
			if (winnerItems.find(item => item.winner_number === null)) {
				acts.add({
					message: "No se han asignado algunos ganadores para los filtros seleccionados.",
					mode: 'warning',
					lifetime: 3
				});
			}
			winnersFiltered = winnerItems;

			showReportModal = true;
		} catch (error) {
			acts.add({
				message: "Error al aplicar filtros.",
				mode: 'error',
				lifetime: 3
			});
			console.error(error);
		} finally {
			isLoading = false;
		}
	}

	async function fetchProhibitedNumbers() {
		if (!validFilters()) return;
		try {
		    isLoading = true;
			let response;
			if (user === 'banking') {
				response = await fetch(`/number/prohibited?date_from=${from}&date_to=${to}&branches=${encodeURIComponent(selectedBranch.join(','))}`, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' }
				});
			} else {
				response = await fetch(`/puesto/number/prohibited?date_from=${from}&date_to=${to}`, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' }
				});
			}
			const data = await response.json();
			const prohibitedItems = Array.isArray(data.items) ? data.items as prohibitedItem[] : [];
			prohibitedFiltered = prohibitedItems;
		} catch (error) {
			acts.add({
				message: "Error al obtener números prohibidos.",
				mode: 'error',
				lifetime: 3
			});
			console.error(error);
		} finally {
			isLoading = false;
		}
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

	async function handleShowExportModal() {
		if (report.length === 0) {
			reportQrData = Object.fromEntries(
				Array.from({ length: 100 }, (_, i) => [i, 0])
			);
		} else {
			reportQrData = report.reduce((acc: Record<number, number>, item: ReportItem) => {
				acc[item.number] = (acc[item.number] || 0) + item.amount;
				return acc;
			}, {});
		}
		totalQr = Object.values(reportQrData).reduce((acc, amount) => acc + amount, 0);
		puestosQr = selectedBranch.length === 0 || selectedBranch.includes(0)
			? branchNames.slice(1).map((item) => item.label)
			: branchNames.filter((item) => selectedBranch.includes(item.value)).map((item) => item.label);
		sorteosQr = selectedDrawSchedule.length === 0 || selectedDrawSchedule.includes(0)
			? drawScheduleNames.slice(1).map((item) => item.label)
			: drawScheduleNames.filter((item) => selectedDrawSchedule.includes(item.value)).map((item) => item.label);
		showExportModal = true;
	}

	async function showReport() {
		await applyFilters();
		await fetchWinnersFiltered();
		await fetchProhibitedNumbers();
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

<ProhibitedNumberModal
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
	bind:prohibited={selectedProhibitedNumber}
	title="Agregar numero restringido"
	confirmText="Guardar"
	cancelText="Cancelar"
	handleAddProhibitedNumber={handleAddProhibitedNumber}
/>

<ExportModal
	bind:showModal={showExportModal}
	data={reportQrData}
	dateFrom={from}
	puestos={puestosQr}
	sorteos={sorteosQr}
	dateTo={to}
	total={totalQr}
/>

<ReportModal
    bind:showModal={showReportModal}
    report={report}
    winners={winnersFiltered}
    prohibitedNumbers={prohibitedFiltered}
/>

<section class="inicio">
    <div class="content">
        <div class="left">
            <div class="filters">
                <div class="total">
                    <label for="from">Desde</label>
                    <input id="from" type="date" bind:value={from}/>
                </div>
                <div class="field">
                    <label for="to">Hasta</label>
                    <input id="to" type="date" bind:value={to}/>
                </div>
                {#if user !== 'branch'}
                    <div class="field">
                        <label for="puesto">Puesto</label>
    					<SelectModal
    						options={branchNames}
    						bind:selected={selectedBranch}
    						placeholder="Seleccione un puesto"
    					/>
    				</div>
                {/if}
	            <div class="field">
	                <label for="sorteo">Sorteo</label>
					<SelectModal
						options={drawScheduleNames}
						bind:selected={selectedDrawSchedule}
						placeholder="Seleccione un sorteo"
					/>
	            </div>
	            <div class="total-amount">
	                <p class="total-label">Total en esta lista</p>
	                <p class="total-amount-label">₡{formatAmount(totalAmountReport)} </p>
	            </div>
            </div>
	        <Matrix bind:report={report} bind:isLoading={isLoading} bind:groupingModes={groupingModes} mode={matrixMode} />
        </div>
        <div class="right">
            <div class="column">
			    <button type="button" class="option-button" onclick={applyFilters}>
   					Filtrar
                </button>
				<button type="button" class="option-button" onclick={handleShowExportModal}>
				    Exportar lista
				</button>
				<button type="button" class="option-button" onclick={showReport}>
				    Obtener reporte
 			    </button>
			</div>
			<div class="row view">
                <button
                    type="button"
                    class={`option-button ${matrixMode === '20x5' ? 'selected-mode' : ''}`}
                    onclick={() => { matrixMode = '20x5'; }}
                >
                20x5
                </button>
                <button
                    type="button"
                    class={`option-button ${matrixMode === '10x10' ? 'selected-mode' : ''}`}
                    onclick={() => { matrixMode = '10x10'; }}
                >
                10x10
                </button>
            </div>
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
    {#if user === 'banking'}
    <header>
        <div class="prohibited">
            <span class="label">Restringidos:</span>
            <div class="prohibited-list">
				<button
					class={`prohibited-badge`}
					onclick={() => {}}
					aria-label={`Actualizar numero restringido`}
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
    {/if}
</section>
<Notifications />


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
		width: 100%;
		justify-content: space-between;
		display: flex;
		align-items: center;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.matrix-mode-buttons {
		display: flex;
		gap: 0.5rem;
	}


	.selected-mode {
		background-color: var(--color-theme-1);
		color: #fff;
	}

	.grouping-option {
		width: 100%;
	}

	.total-amount {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-left: auto;
		width: 10rem;
		text-align: center;
		font-size: 1.2rem;
	}

	.total-label {
		font-weight: 600;
	}


</style>
