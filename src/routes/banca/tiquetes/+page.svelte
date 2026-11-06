<script lang="ts">
	import { acts } from '@tadashi/svelte-notification';
	import { auth } from '$lib/stores/auth';
	import { getBancaFilterData } from '$lib/stores/bancaFilterCache';
	import ListasFilterModal from '$lib/components/listas/ListasFilterModal.svelte';

	type Ticket = {
		id: number;
		relative_id: number;
		username: string | null;
		serial: string;
		amount: number | string;
		date: string;
		time: string | null;
		detail: string | null;
		enabled: boolean;
		deleted_by: number | null;
		deleted_at: string | null;
	};

	let { data } = $props();
	let branchNames = $state<{ value: number; label: string }[]>([]);
	let drawScheduleNames = $state<{ value: number; label: string }[]>([]);
	let from = $state('');
	let to = $state('');
	let selectedBranches = $state<number[]>([]);
	let selectedDrawSchedules = $state<number[]>([]);
	let tickets = $state<Ticket[]>([]);
	let ticketNumbers = $state<Record<string, number>>({});
	let showFilterModal = $state(false);
	let isLoading = $state(false);
	let hasLoadedDefaults = $state(false);

	function today() {
		return new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().split('T')[0];
	}

	function formatDate(value: string | null) {
		return value ? value.slice(0, 10) : '-';
	}

	function formatTime(value: string | null) {
		return value ? value.slice(0, 8) : '-';
	}

	function formatAmount(value: number | string) {
		return `₡${Number(value || 0).toLocaleString('es-CR', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})}`;
	}

	function isDeleted(ticket: Ticket) {
		return !ticket.enabled || ticket.deleted_at !== null;
	}

	function loadFilterOptions() {
		const filterData = getBancaFilterData(data ?? {});
		branchNames = (filterData.branchNames as Array<{ id: number; name: string }>).map((branch) => ({
			value: Number(branch.id),
			label: String(branch.name)
		}));
		drawScheduleNames = (
			filterData.scheduleNames as Array<{
				draw_schedule_id: number;
				draw_name: string;
				draw_schedule_name: string;
			}>
		).map((schedule) => ({
			value: Number(schedule.draw_schedule_id),
			label: `${schedule.draw_name} - ${schedule.draw_schedule_name}`
		}));

		if (!hasLoadedDefaults && branchNames.length > 0 && drawScheduleNames.length > 0) {
			hasLoadedDefaults = true;
			const currentDate = today();
			from = currentDate;
			to = currentDate;
			selectedBranches = branchNames.map((branch) => branch.value);
			selectedDrawSchedules = drawScheduleNames.map((schedule) => schedule.value);
			void fetchTickets();
		}
	}

	$effect(loadFilterOptions);

	async function fetchTickets() {
		if (!from || !to || selectedBranches.length === 0 || selectedDrawSchedules.length === 0) {
			acts.add({
				message: 'Seleccione un rango de fechas, puestos y sorteos.',
				mode: 'error',
				lifetime: 3
			});
			return;
		}

		isLoading = true;
		try {
			const params = new URLSearchParams({
				date_from: from,
				date_to: to,
				branches: selectedBranches.join(','),
				draw_schedules: selectedDrawSchedules.join(',')
			});
			const response = await fetch(`/banca/tiquetes?${params}`);
			const payload = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(payload?.error ?? 'No se pudieron cargar los tiquetes.');
			}

			tickets = Array.isArray(payload?.items) ? payload.items : [];
			const details = Array.isArray(payload?.numbers) ? payload.numbers : [];
			ticketNumbers = details.reduce((counts: Record<string, number>, item: { ticket_header_serial?: string }) => {
				const serial = String(item.ticket_header_serial ?? '');
				counts[serial] = (counts[serial] ?? 0) + 1;
				return counts;
			}, {});
		} catch (error) {
			tickets = [];
			ticketNumbers = {};
			acts.add({
				message: error instanceof Error ? error.message : 'No se pudieron cargar los tiquetes.',
				mode: 'error',
				lifetime: 4
			});
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Tiquetes vendidos</title>
</svelte:head>

{#if $auth.user?.role === 'banking'}
	<section class="tickets-page">
		<div class="page-header">
			<div>
				<h1>Tiquetes vendidos</h1>
				<p>Consulta histórica de tiquetes vendidos por puesto y sorteo.</p>
			</div>
			<button type="button" onclick={() => (showFilterModal = true)}>Filtrar</button>
		</div>

		<div class="summary">
			<span>{tickets.length} tiquetes encontrados</span>
			<span>{from || '-'} a {to || '-'}</span>
		</div>

		{#if isLoading}
			<p class="state-message">Cargando tiquetes...</p>
		{:else if tickets.length === 0}
			<p class="state-message">No hay tiquetes para los filtros seleccionados.</p>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Serial</th>
							<th>Fecha</th>
							<th>Impreso</th>
							<th>Vendedor</th>
							<th>Total</th>
							<th>Números</th>
							<th>Detalle</th>
							<th>Estado</th>
							<th>Eliminado por</th>
							<th>Eliminado en</th>
						</tr>
					</thead>
					<tbody>
						{#each tickets as ticket}
							<tr class:deleted={isDeleted(ticket)}>
								<td>{ticket.relative_id}</td>
								<td>{ticket.serial}</td>
								<td>{formatDate(ticket.date)}</td>
								<td>{formatTime(ticket.time)}</td>
								<td>{ticket.username || '-'}</td>
								<td>{formatAmount(ticket.amount)}</td>
								<td>{ticketNumbers[ticket.serial] ?? 0}</td>
								<td>{ticket.detail || '-'}</td>
								<td>{isDeleted(ticket) ? 'Eliminado' : 'Activo'}</td>
								<td>{ticket.deleted_by ?? '-'}</td>
								<td>{ticket.deleted_at ? `${formatDate(ticket.deleted_at)} ${formatTime(ticket.deleted_at)}` : '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<ListasFilterModal
		bind:from
		bind:to
		bind:selectedBranch={selectedBranches}
		bind:selectedDrawSchedule={selectedDrawSchedules}
		branchNames={branchNames}
		drawScheduleNames={drawScheduleNames}
		scheduleBranch={getBancaFilterData(data ?? {}).scheduleBranch}
		selectionMode="multiple"
		onConfirm={() => {
			showFilterModal = false;
			void fetchTickets();
		}}
		bind:showModal={showFilterModal}
	/>
{:else}
	<p class="state-message">No autorizado.</p>
{/if}

<style>
	.tickets-page {
		padding: 1.5rem;
	}

	.page-header,
	.summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	h1 {
		margin: 0;
	}

	.page-header p {
		margin: 0.35rem 0 0;
		color: var(--color-text-secondary, #666);
	}

	.summary {
		margin: 1rem 0;
		color: var(--color-text-secondary, #666);
	}

	.table-container {
		overflow: auto;
		max-height: 70vh;
		border: 1px solid var(--color-border, #ddd);
	}

	table {
		width: 100%;
		min-width: 1050px;
		border-collapse: collapse;
		background: var(--color-box-background, white);
	}

	th,
	td {
		padding: 0.55rem 0.7rem;
		border-bottom: 1px solid var(--color-border, #ddd);
		text-align: left;
		white-space: nowrap;
	}

	th {
		position: sticky;
		top: 0;
		background: var(--color-box-background, #efefef);
		z-index: 1;
	}

	tr.deleted {
		background: #fdecec;
		color: #7a1e1e;
	}

	.state-message {
		padding: 2rem;
		text-align: center;
	}
</style>
