<script lang="ts">
	import { GROUPING_OPTIONS, type GroupingMode } from '$lib/components/venta/grouping';
	import { PrinterSolid } from "flowbite-svelte-icons";
	import SelectModal from '$lib/components/SelectModal.svelte';
	import { acts } from '@tadashi/svelte-notification';

	let {
		data = undefined,
		apiPath = '/puesto/reportes',
		showBranchFilter = false,
		branchOptions = [],
		groups: initialGroups = [],
		totals: initialTotals = undefined,
		printable = false,
		initialGroupingModes = undefined,
		printHeader = undefined
	} = $props();

	const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
	let from = $state(utcMinus6Date.toISOString().split('T')[0]);
	let to = $state(utcMinus6Date.toISOString().split('T')[0]);
	let scheduleOptions = $state<{ value: number; label: string }[]>([]);
	let selectedDrawSchedule = $state<number[]>([]);
	let selectedBranch = $state<number[]>([]);
	let groups = $state<GroupSection[]>(Array.isArray(initialGroups) ? initialGroups : []);
	let totals = $state(initialTotals ?? { total: 0, comission: 0, devolution: 0, buy: 0, winner_total: 0, net: 0 });
	let isLoading = $state(false);
	let hasGeneratedReport = $state(false);
	let errorMessage = $state('');
	let lastRequestedGrouping = $state('');

	$effect(() => {
		const schedules = Array.isArray(data?.scheduleNames) ? data.scheduleNames : [];
		scheduleOptions = schedules
			.map((item: { draw_schedule_id?: number; draw_name?: string; draw_schedule_name?: string }) => ({
				value: Number(item.draw_schedule_id),
				label: `${String(item.draw_name ?? '')} - ${String(item.draw_schedule_name ?? '')}`.replace(/^ - | - $/g, '')
			}))
			.filter((item) => Number.isFinite(item.value));
		if (!hasGeneratedReport && selectedDrawSchedule.length === 0) {
			selectedDrawSchedule = scheduleOptions.map((item) => item.value);
		}
	});

	async function getReport() {
		errorMessage = '';
		if (!from || !to || from > to) {
			errorMessage = "La fecha 'Desde' no puede ser mayor que la fecha 'Hasta'.";
			acts.add({ message: errorMessage, mode: 'error', lifetime: 3 });
			return;
		}
		if (selectedDrawSchedule.length === 0) {
			errorMessage = 'Seleccione al menos un horario.';
			acts.add({ message: errorMessage, mode: 'error', lifetime: 3 });
			return;
		}

		isLoading = true;
		try {
			lastRequestedGrouping = groupingModes.join(',');
			const branchQuery = showBranchFilter
				? `&branches=${encodeURIComponent(selectedBranch.join(','))}`
				: '';
			if (showBranchFilter && selectedBranch.length === 0) {
				errorMessage = 'Seleccione al menos un puesto.';
				acts.add({ message: errorMessage, mode: 'error', lifetime: 3 });
				return;
			}
			const response = await fetch(
				`${apiPath}?date_from=${encodeURIComponent(from)}&date_to=${encodeURIComponent(to)}&draw_schedules=${encodeURIComponent(selectedDrawSchedule.join(','))}${branchQuery}&grouping_modes=${encodeURIComponent(groupingModes.join(','))}`
			);
			const payload = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(payload?.error ?? 'No se pudo obtener el reporte.');
			}

			groups = Array.isArray(payload?.groups) ? payload.groups : [];
			totals = payload?.totals ?? totals;
			hasGeneratedReport = true;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'No se pudo obtener el reporte.';
			acts.add({ message: errorMessage, mode: 'error', lifetime: 3 });
		} finally {
			isLoading = false;
		}

	}

	$effect(() => {
		const grouping = groupingModes.join(',');
		if (hasGeneratedReport && !isLoading && grouping !== lastRequestedGrouping) void getReport();
	});

	const currentPrintHeader = $derived(printHeader ?? {
		branches: branchOptions
			.filter((item: { value: number; label: string }) => selectedBranch.includes(item.value))
			.map((item: { value: number; label: string }) => item.label),
		drawSchedules: scheduleOptions
			.filter((item) => selectedDrawSchedule.includes(item.value))
			.map((item) => item.label),
		dateFrom: from,
		dateTo: to
	});

	type GroupRow = {
		id: string;
		label: string;
		winner_numbers: number[];
		winner_total: number;
		devolution: number;
		total: number;
		comission: number;
		buy: number;
		net: number;
	};

	type GroupSection = {
		id: string;
		label: string;
		rows: GroupRow[];
		winner_total: number;
		devolution: number;
		total: number;
		comission: number;
		buy: number;
		net: number;
	};

	// Defines the active grouping hierarchy.
	// By default, reports are grouped first by date and then by branch.
	let groupingModes = $state<GroupingMode[]>(
		initialGroupingModes?.length ? [...initialGroupingModes] : ['date', 'draw_schedule']
	);
	let showGroupingConfig = $state(false);

	const groupingPresets: { label: string; modes: GroupingMode[] }[] = [
		{
			label: 'Fecha > Sorteo > Horario > Puesto',
			modes: ['date', 'draw', 'draw_schedule', 'branch']
		},
		{
			label: 'Fecha > Sorteo > Horario',
			modes: ['date', 'draw', 'draw_schedule']
		},
		{
			label: 'Puesto > Fecha > Sorteo > Horario',
			modes: ['branch', 'date', 'draw', 'draw_schedule']
		},
		{
			label: 'Puesto > Sorteo > Horario',
			modes: ['branch', 'draw', 'draw_schedule']
		},
		{
			label: 'Sorteo > Horario > Puesto > Fecha',
			modes: ['draw', 'draw_schedule', 'branch', 'date']
		},
		{
			label: 'Sorteo > Puesto > Fecha',
			modes: ['draw', 'branch', 'date']
		},
		{
			label: 'Sorteo > Horario > Fecha',
			modes: ['draw', 'draw_schedule', 'date']
		}
	];

	function applyGroupingPreset(modes: GroupingMode[]) {
		groupingModes = [...modes];
	}

	const currencyFormatter = new Intl.NumberFormat('es-CR', {style: 'currency', currency: 'CRC', maximumFractionDigits: 0});
	function formatCurrency(value: number) {return currencyFormatter.format(value);}

	// Enables or disables a grouping mode.
	// At least one grouping mode must remain selected.
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

	// Moves a grouping mode one position up or down in the grouping hierarchy.
	function moveGroupingMode(mode: GroupingMode, direction: -1 | 1) {
		const currentIndex = groupingModes.indexOf(mode);
		if (currentIndex === -1) {
			return;
		}
		const targetIndex = currentIndex + direction;
		// Don't move beyond the beginning or end of the list.
		if (targetIndex < 0 || targetIndex >= groupingModes.length) {
			return;
		}
		// Create a new array and swap the selected grouping with its neighbor.   814 839

		const nextModes = [...groupingModes];
		[nextModes[currentIndex], nextModes[targetIndex]] = [
			nextModes[targetIndex],
			nextModes[currentIndex]
		];
		groupingModes = nextModes;
	}

	// Converts a grouping mode into its user-facing label.
	function getGroupingModeLabel(mode: GroupingMode) {
		return (GROUPING_OPTIONS.find(
			(option: { value: GroupingMode; label: string }) => option.value === mode
		)?.label ?? mode);
	}

	function openPrintWindow() {
		const printData = JSON.stringify({
			groups: $state.snapshot(groups),
			totals: $state.snapshot(totals),
			groupingModes: $state.snapshot(groupingModes),
			printHeader: currentPrintHeader ? $state.snapshot(currentPrintHeader) : undefined
		});
		const printKey = `report-print-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		const printOrigin = window.location.origin;
		let printWindow: Window | null = null;

		const handlePrintReady = (event: MessageEvent) => {
			if (
				event.origin !== printOrigin ||
				event.source !== printWindow ||
				event.data?.type !== 'report-print-ready' ||
				event.data?.key !== printKey
			) {
				return;
			}

			printWindow?.postMessage(
				{ type: 'report-print-data', key: printKey, data: printData },
				printOrigin
			);
			window.removeEventListener('message', handlePrintReady);
		};

		window.addEventListener('message', handlePrintReady);
		printWindow = window.open(`/banca/report-print?key=${printKey}`, '_blank');

		if (!printWindow) {
			window.removeEventListener('message', handlePrintReady);
		}
	}
</script>


<section class="report">
    <div class="content">
    	{#if !printable}
    		<form class="filters" onsubmit={(event) => { event.preventDefault(); void getReport(); }}>
    			<div class="field">
    				<label for="from">Desde</label>
    				<input id="from" type="date" bind:value={from} required />
    			</div>
    			<div class="field">
    				<label for="to">Hasta</label>
    				<input id="to" type="date" bind:value={to} required />
    			</div>
    			<div class="field schedule-field">
    				<label for="schedule-select">Horario</label>
    				<SelectModal
    					options={scheduleOptions}
    					bind:selected={selectedDrawSchedule}
    					placeholder="Seleccione un horario"
    				/>
    			</div>
    			{#if showBranchFilter}
    				<div class="field schedule-field">
    					<label for="branch-select">Puesto</label>
    					<SelectModal
    						options={branchOptions}
    						bind:selected={selectedBranch}
    						placeholder="Seleccione un puesto"
    					/>
    				</div>
    			{/if}
    			<button type="submit" disabled={isLoading || scheduleOptions.length === 0}>
    				{isLoading ? 'Generando...' : 'Obtener Reporte'}
    			</button>
    		</form>
    		{#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}
    	{/if}
    	{#if printable && currentPrintHeader}
    		<header class="print-header">
    			<h1>Reporte</h1>
    			<p>{currentPrintHeader.branches.join(', ') || 'Todos'}</p>
    			<p>{currentPrintHeader.drawSchedules.join(', ') || 'Todos'}</p>
    			<p>{currentPrintHeader.dateFrom} - {currentPrintHeader.dateTo}</p>
    		</header>
    	{/if}
    	<div class="report-container">
       	{#if printable || hasGeneratedReport}
      		{#if groups.length === 0}
     			<p class="empty">No hay datos para mostrar.</p>
      		{:else}
     			<div class="totals-head">
     			    <span>Total</span>
        				<span>Comisión</span>
        				<span>Devolución</span>
        				<span>Compra</span>
        				<span>Premio</span>
        				<span>Numero</span>
        				<span>Neto</span>
     			</div>

     			{#each groups as group}
     			<div class="group">
        				<div class="group-label">{group.label}</div>
        				<ul>
        				{#each group.rows as row}
       					<li>
      						<span class="label">{row.label}</span>
      						<div class="totals">
      						    <strong>{formatCurrency(row.total)}</strong>
     							<strong>{formatCurrency(row.comission)}</strong>
     							<strong>{formatCurrency(row.devolution)}</strong>
     							<strong>{formatCurrency(row.buy)}</strong>
     							<strong>{formatCurrency(row.winner_total)}</strong>
     							<strong>{row.winner_numbers.join(', ')}</strong>
     							<strong>{formatCurrency(row.net)}</strong>
      						</div>
       					</li>
        				{/each}
        				</ul>
        				<div class="sub totals">
        				    <strong>{formatCurrency(group.total)}</strong>
           					<strong>{formatCurrency(group.comission)}</strong>
           					<strong>{formatCurrency(group.devolution)}</strong>
           					<strong>{formatCurrency(group.buy)}</strong>
           					<strong>{formatCurrency(group.winner_total)}</strong>
           					<strong></strong>
           					<strong>{formatCurrency(group.net)}</strong>
        				</div>
     			</div>
     			{/each}
      		{/if}
      		<footer class="modal-footer">
     			<span class="label">Total</span>
     			<div class="totals footer">
     			    <strong>{formatCurrency(totals.total)}</strong>
        				<strong>{formatCurrency(totals.comission)}</strong>
        				<strong>{formatCurrency(totals.devolution)}</strong>
        				<strong>{formatCurrency(totals.buy)}</strong>
        				<strong>{formatCurrency(totals.winner_total)}</strong>
        				<strong>
         			</strong>
     			<strong>{formatCurrency(totals.net)}</strong>
     			</div>
      		</footer>
    		{/if}
    	</div>
    </div>
	{#if !printable}
	<div class="grouping-field">
  		<div class="grouping-presets">
       	    <span class="grouping-config-toggle">Agrupar por</span>
			{#each GROUPING_OPTIONS as option}
				{@const presetsForMode = groupingPresets.filter((preset) => preset.modes[0] === option.value)}
				{#if presetsForMode.length > 0}
					<span class="grouping-preset-subtitle">Por {option.label.toLowerCase()}</span>
					{#each presetsForMode as preset}
						<button
							type="button"
							class="grouping-preset"
							onclick={() => applyGroupingPreset(preset.modes)}
							title={preset.label}
						>
							{preset.label}
						</button>
					{/each}
				{/if}
			{/each}
		</div>
  		<button
 			type="button"
 			class="grouping-config-toggle"
 			aria-expanded={showGroupingConfig}
 			onclick={() => showGroupingConfig = !showGroupingConfig}
  		>
 			<span>Configurar</span>
 			<span aria-hidden="true">{showGroupingConfig ? '^' : '>'}</span>
  		</button>
  		{#if showGroupingConfig}
 			<div class="grouping-config">
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
  		{/if}
        <button type="button" onclick={openPrintWindow} ><PrinterSolid class="shrink-0 h-4 w-4" /> Imprimir</button>
   	</div>
	{/if}
</section>

<style>
    .report {
        flex: 1;
		justify-content: space-between;
        flex-direction: row;
        gap: 1rem;
        align-items: start;
    }

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	h1 {
		margin: 0;
		color: var(--color-text);
		font-size: 1.6rem;
		font-weight: 700;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 1rem;
		margin-bottom: 1.25rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		background-color: var(--color-box-background);
	}

	.schedule-field {
		flex: 2 1 18rem;
	}

	:global(.schedule-field .multi-select) {
		width: 100%;
		max-width: none;
		min-height: 2.35rem;
	}

	.report-container {
	    flex: 1;
	    height: 100%;
		padding: 1rem;
		border: 1px solid var(--color-border);
		background: #fff;
	}

	.printable {
		position: static;
		display: block;
		width: 100%;
		height: auto;
		background: white;
		overflow: visible;
		backdrop-filter: none;
		animation: none;
		font-size: 0.8rem;
	}

	.print-header {
		margin-bottom: 1rem;
		text-align: center;
		gap: 0.2rem;
	}

	.print-header h1 {
		margin: 0 0 0.5rem;
		font-size: 1.2rem;
		font-weight: 700;
	}

	.print-header p {
		margin: 0;
		font-size: 0.8rem;
	}

	.modal-footer {
		padding: 0.7rem !important;
	}

	.totals-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
		opacity: 0.85;
		width: 60%;
		margin-left: auto;
		padding: 0 1rem;
	}

	.content {
		overflow: auto;
		display: flex;
		flex: 4;
		flex-direction: column;
  height: 100%;
	}

	.group {
		padding: 0.5rem 1rem;
		font-size: 1rem;
	}

	.group-label {
		padding-bottom: 0.25rem;
		font-weight: 600;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li, .modal-footer {
		display: flex;
		justify-content: space-between;
		padding: 0.15rem 0 0.15rem 1rem ;
		border-top: 1px solid var(--color-border);
	}

	.label {
	    width: 40%;
	}

	.totals {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
	}

	.totals strong, .totals-head span {
		flex: 1;
		text-align: center;
	}

	.modal-footer .totals {
		width: 59%;
		margin-left: auto;
		flex: initial;
	}

	.empty {
		margin: 0;
		color: #555;
	}

	.grouping-options {
		display: flex;
		flex-direction: column;
		flex-wrap: unset;
	}

	.grouping-presets {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding-bottom: 0.75rem;
	}

	.grouping-presets-label {
		font-size: 0.8rem;
		font-weight: 600;
		opacity: 0.8;
	}

	.grouping-preset {
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		background: transparent;
		color: inherit;
		cursor: pointer;
		text-align: left;
		justify-content: left;
	}

	.grouping-preset-subtitle {
		margin-top: 0.25rem;
		font-size: 0.8rem;
		font-weight: 600;
		opacity: 0.8;
	}

	.grouping-preset:hover {
		background: var(--color-border);
	}

	.grouping-config-toggle {
		display: flex;
		justify-content: space-between;
		width: 100%;
		padding: 0.25rem 0;
		border: 0;
		background: transparent;
		color: inherit;
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		opacity: 0.7;
	}

	.grouping-config-toggle:hover {
		opacity: 1;
	}

	.grouping-config {
		margin-top: 0.5rem;
	}

	.grouping-config-label {
		display: block;
		margin-bottom: 0.35rem;
		font-size: 0.8rem;
		font-weight: 600;
		opacity: 0.8;
	}

	.grouping-field {
		display: flex;
		flex-direction: column;
        flex: 1;
        gap: 1rem;
        position: relative;
        overflow-y: auto;
        background-color: var(--color-box-background);
        border: 1px solid var(--color-border);
        padding: 1rem;
   	}


    .grouping-chip-list {
        flex-direction: column;
    }

    .sub.totals {
        width: 59%;
        margin-left: auto;
        border-top: 1px solid var(--color-border);
    }
</style>
