<script lang="ts">
	import { acts } from '@tadashi/svelte-notification';
	import { auth } from '$lib/stores/auth';
	import { getBancaFilterData } from '$lib/stores/bancaFilterCache';
	import TicketFilters from '$lib/components/tiquetes/TicketFilters.svelte';
	import TicketResultsTable from '$lib/components/tiquetes/TicketResultsTable.svelte';

	type Ticket = {
		id: number;
		relative_id: number;
		username: string | null;
		serial: string;
		amount: number | string;
		date: string;
		time: string | null;
		printed_at?: string | null;
		detail: string | null;
		enabled: boolean;
		deleted_by?: number | null;
		deleted_at: string | null;
		deleted_by_name?: string | null;
		branch_name?: string | null;
		draw_name?: string | null;
		draw_schedule_name?: string | null;
	};

	type TicketNumber = {
		ticket_header_serial?: string | null;
		number?: number | string | null;
		amount?: number | string | null;
		amount_name?: string | null;
		is_reventado?: boolean;
		is_megareventado?: boolean;
	};

	let { data } = $props();
	let branchNames = $state<{ value: number; label: string }[]>([]);
	let drawScheduleNames = $state<{ value: number; label: string }[]>([]);
	let from = $state('');
	let to = $state('');
	let selectedBranches = $state<number[]>([]);
	let selectedDrawSchedules = $state<number[]>([]);
	let tickets = $state<Ticket[]>([]);
	let ticketNumbers = $state<TicketNumber[]>([]);
	let searchTerm = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let databaseTicket = $state<Ticket | null>(null);
	let databaseTicketNumbers = $state<TicketNumber[]>([]);
	let isDatabaseSearching = $state(false);
	let databaseSearchError = $state('');
	let hasLoadedDefaults = $state(false);

	function today() {
		return new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().split('T')[0];
	}

	function formatDate(value: string | null) {
		return value ? value.slice(0, 10) : '-';
	}

	function formatTime(value: string | null) {
		if (!value) {
			return '-';
		}

		const time = value.includes('T') ? value.split('T')[1] : value.split(' ')[1];
		return (time ?? value).slice(0, 8);
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

	$effect(() => {
		if (!hasLoadedDefaults) {
			loadFilterOptions();
		}
	});

	async function fetchTickets() {
		errorMessage = '';
		databaseTicket = null;
		databaseTicketNumbers = [];
		databaseSearchError = '';
		if (!from || !to || selectedBranches.length === 0 || selectedDrawSchedules.length === 0) {
			errorMessage = 'Seleccione un rango de fechas, puestos y sorteos.';
			acts.add({
				message: errorMessage,
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
			ticketNumbers = Array.isArray(payload?.numbers) ? payload.numbers : [];
		} catch (error) {
			tickets = [];
			ticketNumbers = [];
			errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar los tiquetes.';
			acts.add({
				message: errorMessage,
				mode: 'error',
				lifetime: 4
			});
		} finally {
			isLoading = false;
		}
	}

	async function searchDatabase(serial: string) {
		databaseSearchError = '';
		isDatabaseSearching = true;
		try {
			const response = await fetch(`/banca/tiquetes?serial=${encodeURIComponent(serial)}`);
			const payload = await response.json().catch(() => null);
			if (response.status === 404) {
				throw new Error('Ticket not found');
			}
			if (!response.ok) {
				throw new Error(payload?.error ?? 'No se pudo buscar el tiquete en la base de datos.');
			}

			const result = Array.isArray(payload?.items) ? payload.items[0] : null;
			if (!result) {
				throw new Error('Ticket not found');
			}
			databaseTicket = result;
			databaseTicketNumbers = Array.isArray(payload?.numbers) ? payload.numbers : [];
		} catch (error) {
			databaseTicket = null;
			databaseTicketNumbers = [];
			databaseSearchError = error instanceof Error
				? error.message
				: 'No se pudo buscar el tiquete en la base de datos.';
		} finally {
			isDatabaseSearching = false;
		}
	}
</script>

<svelte:head>
	<title>Tiquetes vendidos</title>
</svelte:head>


{#if $auth.user?.role === 'banking'}
	<section class="tickets-page">
		<TicketFilters
			bind:from
			bind:to
			bind:selectedBranches
			bind:selectedDrawSchedules
			branchOptions={branchNames}
			scheduleOptions={drawScheduleNames}
			onApply={fetchTickets}
		/>
		<div class="ticket-search">
			<input
				id="ticket-serial-search"
				type="search"
				placeholder="Ingrese el serial del tiquete"
				aria-label="Buscar por serial"
				bind:value={searchTerm}
			/>
		</div>

		{#if errorMessage}
			<div class="state-message error-state" role="alert">
				<strong>No se pudieron cargar los tiquetes</strong>
				<p>{errorMessage}</p>
			</div>
		{:else if isLoading}
			<div class="state-message loading-state" role="status">
				<span class="spinner" aria-hidden="true"></span>
				<p>Cargando tiquetes...</p>
			</div>
		{:else}
			<TicketResultsTable
				tickets={tickets}
				ticketNumbers={ticketNumbers}
				{searchTerm}
				{databaseTicket}
				{databaseTicketNumbers}
				{isDatabaseSearching}
				{databaseSearchError}
				onSearchDatabase={searchDatabase}
				{formatDate}
				{formatTime}
				{isDeleted}
			/>
		{/if}
	</section>
{:else}
	<p class="state-message">No autorizado.</p>
{/if}

<style>
	.tickets-page {
		display: flex;
		align-items: stretch;
		justify-content: flex-start;
		flex-direction: column;
		width: 100%;
		margin: 0;
		padding:1rem;
		border: 1px solid var(--color-border);
		background: var(--color-box-background);
	}

	.ticket-search {
		display: flex;
		justify-content: flex-start;
		margin-top: 1rem;
	}

	.ticket-search input {
		width: min(100%, 22rem);
		padding: 0.45rem 0.6rem;
	}

	.state-message {
		display: flex;
		min-height: 180px;
		box-sizing: border-box;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 0.35rem;
		margin-top: 1.5rem;
		padding: 2rem;
		border: 1px solid #dbe3ec;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.78);
		color: #66758a;
		text-align: center;
	}

	.state-message p {
		margin: 0;
	}

	.error-state {
		border-color: #f0b8ad;
		background: #fff8f5;
		color: #8f3d2c;
	}

	.spinner {
		width: 1.5rem;
		height: 1.5rem;
		border: 3px solid #dbe3ec;
		border-top-color: var(--color-theme-1);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 640px) {
		.tickets-page {
			padding-right: 0;
			padding-left: 0;
		}
	}
</style>
