<script lang="ts">
	import { acts } from '@tadashi/svelte-notification';
	import { auth } from '$lib/stores/auth';
	import { getBancaFilterData } from '$lib/stores/bancaFilterCache';
	import mockTicketPayload from '$lib/mocks/tickets.json';
	import TicketAuditHeader from '$lib/components/tiquetes/TicketAuditHeader.svelte';
	import TicketFilters from '$lib/components/tiquetes/TicketFilters.svelte';
	import TicketResultsTable from '$lib/components/tiquetes/TicketResultsTable.svelte';
	import type { Ticket } from '$lib/components/tiquetes/ticketTypes';

	const USE_MOCK_DATA = import.meta.env.DEV;
	const MOCK_BRANCHES = [
		{ value: 1, label: 'Puesto Central' },
		{ value: 2, label: 'Puesto Norte' },
		{ value: 3, label: 'Puesto Escazú' }
	];
	const MOCK_SCHEDULES = [
		{ value: 11, label: 'Tarde - 3:00 PM' },
		{ value: 12, label: 'Noche - 8:00 PM' }
	];
	const MOCK_TICKETS: Ticket[] = [
		{
			id: 101,
			relative_id: 24,
			username: 'maria.rojas',
			serial: 'TK-20261109-0024',
			amount: 2500,
			date: '2026-11-09',
			time: '14:42:18',
			printed_at: '2026-11-09 14:42:20',
			detail: '04, 17, 32',
			enabled: true,
			deleted_by: null,
			deleted_at: null,
			branch_name: 'Puesto Central',
			draw_name: 'Tarde',
			draw_schedule_name: '3:00 PM'
		},
		{
			id: 100,
			relative_id: 23,
			username: 'carlos.mora',
			serial: 'TK-20261109-0023',
			amount: 5000,
			date: '2026-11-09',
			time: '14:37:05',
			printed_at: '2026-11-09 14:37:07',
			detail: '08, 19, 44',
			enabled: false,
			deleted_by: 7,
			deleted_by_name: 'ana.admin',
			deleted_at: '2026-11-09 14:39:12',
			branch_name: 'Puesto Norte',
			draw_name: 'Tarde',
			draw_schedule_name: '3:00 PM'
		},
		{
			id: 99,
			relative_id: 22,
			username: 'maria.rojas',
			serial: 'TK-20261109-0022',
			amount: 1250,
			date: '2026-11-09',
			time: '13:58:43',
			printed_at: '2026-11-09 13:58:45',
			detail: '11, 25',
			enabled: true,
			deleted_by: null,
			deleted_at: null,
			branch_name: 'Puesto Central',
			draw_name: 'Noche',
			draw_schedule_name: '8:00 PM'
		},
		{
			id: 98,
			relative_id: 21,
			username: 'jose.vargas',
			serial: 'TK-20261108-0021',
			amount: 7500,
			date: '2026-11-08',
			time: '19:22:11',
			printed_at: '2026-11-08 19:22:13',
			detail: '02, 14, 33, 48',
			enabled: false,
			deleted_by: 7,
			deleted_by_name: 'ana.admin',
			deleted_at: '2026-11-08 19:25:02',
			branch_name: 'Puesto Escazú',
			draw_name: 'Noche',
			draw_schedule_name: '8:00 PM'
		}
	];

	function buildMockTickets() {
		const sourceTickets = mockTicketPayload.items as Ticket[];
		const currentDate = today();

		return Array.from({ length: 36 }, (_, index) => {
			const source = sourceTickets[index % sourceTickets.length];
			const isDeletedTicket = index % 5 === 1;
			const hour = String(8 + (index % 12)).padStart(2, '0');
			const minute = String((index * 7) % 60).padStart(2, '0');
			const second = String((index * 13) % 60).padStart(2, '0');
			const saleTime = `${hour}:${minute}:${second}`;

			return {
				...source,
				id: 1000 + index,
				relative_id: 100 + index,
				serial: `TK-${currentDate.replaceAll('-', '')}-${String(index + 1).padStart(4, '0')}`,
				amount: 1250 + (index % 7) * 1250,
				date: index % 9 === 0 ? '2026-11-08' : currentDate,
				time: saleTime,
				printed_at: `${currentDate} ${saleTime}`,
				enabled: !isDeletedTicket,
				deleted_by: isDeletedTicket ? 7 : null,
				deleted_by_name: isDeletedTicket ? 'ana.admin' : null,
				deleted_at: isDeletedTicket ? `${currentDate} ${hour}:${minute}:${String((Number(second) + 3) % 60).padStart(2, '0')}` : null
			};
		});
	}

	let { data } = $props();
	let branchNames = $state<{ value: number; label: string }[]>([]);
	let drawScheduleNames = $state<{ value: number; label: string }[]>([]);
	let from = $state('');
	let to = $state('');
	let selectedBranches = $state<number[]>([]);
	let selectedDrawSchedules = $state<number[]>([]);
	let tickets = $state<Ticket[]>([]);
	let ticketNumbers = $state<Record<string, number>>({});
	let isLoading = $state(false);
	let errorMessage = $state('');
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

	function formatDateTime(value: string | null) {
		return value ? `${formatDate(value)} ${formatTime(value)}` : '-';
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
		if (USE_MOCK_DATA) {
			branchNames = branchNames.length > 0 ? branchNames : MOCK_BRANCHES;
			drawScheduleNames = drawScheduleNames.length > 0 ? drawScheduleNames : MOCK_SCHEDULES;
		}

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
			if (USE_MOCK_DATA) {
				const mockTickets = buildMockTickets();
				tickets = mockTickets.filter((ticket) =>
					ticket.date >= from &&
					ticket.date <= to &&
					selectedBranches.some((branchId) => branchNames.find((branch) => branch.value === branchId)?.label === ticket.branch_name) &&
					selectedDrawSchedules.some((scheduleId) => drawScheduleNames.find((schedule) => schedule.value === scheduleId)?.label.endsWith(ticket.draw_schedule_name ?? ''))
				);
				ticketNumbers = Object.fromEntries(tickets.map((ticket) => [ticket.serial, ticket.detail?.split(',').length ?? 0]));
				return;
			}
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
</script>

<svelte:head>
	<title>Tiquetes vendidos</title>
</svelte:head>


{#if $auth.user?.role === 'banking'}
	<section class="tickets-page">
		<TicketAuditHeader />
		<TicketFilters
			from={from}
			to={to}
			selectedBranches={selectedBranches}
			selectedDrawSchedules={selectedDrawSchedules}
			branchOptions={branchNames}
			scheduleOptions={drawScheduleNames}
			onApply={fetchTickets}
		/>

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
		{:else if tickets.length === 0}
			<div class="state-message" role="status">
				<strong>No hay tiquetes para los filtros seleccionados.</strong>
				<p>Prueba con otro periodo, puesto u horario.</p>
			</div>
		{:else}
			<TicketResultsTable
				tickets={tickets}
				ticketNumbers={ticketNumbers}
				{formatDate}
				{formatTime}
				{formatDateTime}
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
		max-width: 1500px;
		margin: 0 auto;
		padding: 0.5rem 1rem 2rem;
	}

	.page-header,
	.summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	h1 {
		margin: 0.15rem 0 0;
		font-size: clamp(1.7rem, 3vw, 2.4rem);
		font-weight: 700;
		text-align: left;
		color: #172b4d;
	}

	.eyebrow {
		color: var(--color-theme-1);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.page-header p {
		margin: 0.45rem 0 0;
		color: var(--color-text-secondary, #666);
	}

	.filter-button {
		min-width: 150px;
		font-weight: 700;
	}

	.filter-button span {
		font-size: 1.2rem;
	}

	.filter-strip,
	.summary-grid {
		display: grid;
		gap: 0.75rem;
		margin: 1.5rem 0 0;
	}

	.filter-strip {
		grid-template-columns: repeat(3, minmax(0, 1fr));
		padding: 0.85rem 1rem;
		border: 1px solid #d5e0ec;
		border-left: 4px solid var(--color-theme-1);
		background: rgba(255, 255, 255, 0.72);
	}

	.filter-strip div,
	.summary-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.filter-strip span,
	.summary-card span,
	.summary-card small,
	td small {
		color: #68778d;
		font-size: 0.75rem;
	}

	.filter-strip strong {
		font-size: 0.9rem;
		font-weight: 600;
	}

	.filter-strip small {
		color: var(--color-theme-1);
	}

	.summary-grid {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	.summary-card {
		min-height: 94px;
		box-sizing: border-box;
		padding: 1rem;
		border: 1px solid #dbe3ec;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.84);
	}

	.summary-card strong {
		color: #172b4d;
		font-size: 1.35rem;
	}

	.summary-card.warning {
		border-top: 3px solid #d97706;
	}

	.table-container {
		margin-top: 1.5rem;
		overflow: auto;
		max-height: calc(100vh - 360px);
		border: 1px solid #cbd6e2;
		border-radius: 6px;
		box-shadow: 0 5px 18px rgba(30, 55, 90, 0.08);
	}

	table {
		width: 100%;
		min-width: 1120px;
		border-collapse: collapse;
		background: white;
	}

	th,
	td {
		padding: 0.8rem 0.9rem;
		border-bottom: 1px solid #e4e9ef;
		text-align: left;
		white-space: nowrap;
	}

	td strong,
	td small {
		display: block;
	}

	td strong {
		color: #23395d;
		font-size: 0.88rem;
	}

	.ticket-id {
		color: var(--color-theme-1);
		font-size: 1rem;
	}

	.numeric {
		text-align: right;
	}

	th {
		position: sticky;
		top: 0;
		background: #eef3f8;
		color: #53647b;
		font-size: 0.72rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		z-index: 1;
	}

	tbody tr:hover {
		background: #f7fbff;
	}

	tr.deleted {
		background: #fff8f5;
	}

	tr.deleted td strong {
		color: #8f3d2c;
	}

	.status {
		display: inline-block;
		padding: 0.3rem 0.55rem;
		border-radius: 999px;
		background: #e6f5eb;
		color: #19713a;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.status-deleted {
		background: #ffebe5;
		color: #a33b27;
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

	@media (max-width: 760px) {
		.page-header,
		.filter-strip {
			align-items: stretch;
			grid-template-columns: 1fr;
			flex-direction: column;
		}

		.page-header {
			display: flex;
		}

		.filter-button {
			width: 100%;
		}

		.summary-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
