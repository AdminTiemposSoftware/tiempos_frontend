<script lang="ts">
	import TicketPreviewModal from '../venta/TicketPreviewModal.svelte';

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

	type SortKey = 'ticket' | 'sale' | 'location' | 'seller' | 'status' | 'deletedBy';

	let {
		tickets,
		ticketNumbers,
		searchTerm = '',
		databaseTicket = null,
		databaseTicketNumbers = [],
		isDatabaseSearching = false,
		databaseSearchError = '',
		onSearchDatabase,
		formatDate,
		formatTime,
		isDeleted
	}: {
		tickets: Ticket[];
		ticketNumbers: TicketNumber[];
		searchTerm?: string;
		databaseTicket?: Ticket | null;
		databaseTicketNumbers?: TicketNumber[];
		isDatabaseSearching?: boolean;
		databaseSearchError?: string;
		onSearchDatabase?: (serial: string) => void;
		formatDate: (value: string | null) => string;
		formatTime: (value: string | null) => string;
		isDeleted: (ticket: Ticket) => boolean;
	} = $props();

	let sortKey = $state<SortKey>('sale');
	let sortDirection = $state<'asc' | 'desc'>('desc');
	let resultsTable: HTMLElement;
	let selectedTicket = $state<Record<string, unknown> | null>(null);
	let showTicketPreviewModal = $state(false);

	function handleView(ticket: Ticket) {
		const numbers = ticket === databaseTicket ? databaseTicketNumbers : ticketNumbers;
		const numbersSold: Record<number, number> = {};
		const amountNames: Record<number, string | null> = {};

		for (const item of numbers) {
			if (item.ticket_header_serial !== ticket.serial || item.number == null) {
				continue;
			}

			const number = Number(item.number);
			if (!Number.isFinite(number)) {
				continue;
			}

			numbersSold[number] = (numbersSold[number] ?? 0) + (Number(item.amount) || 0);
			amountNames[number] = item.amount_name ?? null;
		}

		selectedTicket = {
			...ticket,
			details: ticket.detail ?? '',
			branch_name: ticket.branch_name ?? '',
			draw_name: ticket.draw_name ?? '',
			draw_schedule_name: ticket.draw_schedule_name ?? '',
			time: ticket.time ?? '',
			username: ticket.username ?? '',
			numbersSold,
			amountNames
		};
		showTicketPreviewModal = true;
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDirection = 'asc';
		}

		resultsTable?.scrollTo({ top: 0 });
	}

	function sortValue(ticket: Ticket, key: SortKey): string | number {
		switch (key) {
			case 'ticket':
				return ticket.relative_id;
			case 'sale':
				return `${ticket.date} ${ticket.time ?? ''}`;
			case 'location':
				return `${ticket.branch_name ?? ''} ${ticket.draw_name ?? ''} ${ticket.draw_schedule_name ?? ''}`;
			case 'seller':
				return ticket.username ?? '';
			case 'status':
				return isDeleted(ticket) ? 1 : 0;
			case 'deletedBy':
				return ticket.deleted_by_name ?? '';
		}
	}

	function compareTickets(left: Ticket, right: Ticket) {
		const leftValue = sortValue(left, sortKey);
		const rightValue = sortValue(right, sortKey);
		let comparison: number;

		if (typeof leftValue === 'number' && typeof rightValue === 'number') {
			comparison = leftValue - rightValue;
		} else {
			comparison = String(leftValue).localeCompare(String(rightValue), undefined, {
				numeric: true,
				sensitivity: 'base'
			});
		}

		return sortDirection === 'asc' ? comparison : -comparison;
	}

	let sortedTickets = $derived.by(() => {
		const query = searchTerm.trim().toLowerCase();
		const matchingTickets = query
			? tickets.filter((ticket) => ticket.serial.toLowerCase().includes(query))
			: tickets;
		const databaseMatch =
			query && databaseTicket?.serial.toLowerCase() === query ? [databaseTicket] : [];

		return [...(matchingTickets.length > 0 ? matchingTickets : databaseMatch)].sort(compareTickets);
	});

	let hasSearchResults = $derived(sortedTickets.length > 0);
	let visibleTicketNumbers = $derived([...ticketNumbers, ...databaseTicketNumbers]);
</script>

<section class="results" bind:this={resultsTable} aria-label="Tiquetes encontrados">
	{#if hasSearchResults}
	<table>
		<thead>
			<tr>
				<th aria-sort={sortKey === 'ticket' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
					<button type="button" onclick={() => toggleSort('ticket')}>
						Tiquete <span class="sort-indicator">{sortKey === 'ticket' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
					</button>
				</th>
				<th aria-sort={sortKey === 'sale' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
					<button type="button" onclick={() => toggleSort('sale')}>
						Venta <span class="sort-indicator">{sortKey === 'sale' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
					</button>
				</th>
				<th aria-sort={sortKey === 'location' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
					<button type="button" onclick={() => toggleSort('location')}>
						Puesto / sorteo <span class="sort-indicator">{sortKey === 'location' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
					</button>
				</th>
				<th aria-sort={sortKey === 'seller' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
					<button type="button" onclick={() => toggleSort('seller')}>
						Vendedor <span class="sort-indicator">{sortKey === 'seller' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
					</button>
				</th>
				<th aria-sort={sortKey === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
					<button type="button" onclick={() => toggleSort('status')}>
						Estado <span class="sort-indicator">{sortKey === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
					</button>
				</th>
				<th aria-sort={sortKey === 'deletedBy' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
					<button type="button" onclick={() => toggleSort('deletedBy')}>
						Eliminado por <span class="sort-indicator">{sortKey === 'deletedBy' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
					</button>
				</th>
			</tr>
		</thead>
		<tbody>
		{#each sortedTickets as ticket (ticket.id)}
			<tr
				class:deleted={isDeleted(ticket)}
				role="button"
				tabindex="0"
				onclick={() => handleView(ticket)}
				onkeydown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						handleView(ticket);
					}
				}}
			>
				<td>
					<strong class="ticket-id">#{String(ticket.relative_id).padStart(3, '0')}</strong>
					<small>{ticket.serial}</small>
				</td>
				<td>
					<strong>{formatDate(ticket.date)} · {formatTime(ticket.time)}</strong>
					<small>{visibleTicketNumbers.filter((item) => item.ticket_header_serial === ticket.serial).length} números</small>
				</td>
				<td>
					<strong>{ticket.branch_name || '-'}</strong>
					<small>{ticket.draw_name || '-'} · {ticket.draw_schedule_name || '-'}</small>
				</td>
				<td>
					<strong>{ticket.username || '-'}</strong>
					<small>{ticket.detail || 'Sin detalle'}</small>
				</td>
				<td>
					<span class:status-deleted={isDeleted(ticket)} class="status">
						{isDeleted(ticket) ? 'Anulado' : 'Activo'}
					</span>
				</td>
				<td>
					<strong>{isDeleted(ticket) ? ticket.deleted_by_name || `Usuario #${ticket.deleted_by ?? '-'}` : '-'}</strong>
					{#if isDeleted(ticket)}
						<small>{formatDate(ticket.deleted_at)} · {formatTime(ticket.deleted_at)}</small>
					{/if}
				</td>
			</tr>
		{/each}
		</tbody>
	</table>
	{:else}
		<div class="empty-results" role={databaseSearchError ? 'alert' : 'status'}>
			{#if databaseSearchError}
				<p>{databaseSearchError}</p>
			{:else if searchTerm.trim()}
				<p>No se encontraron tiquetes. ¿Desea buscar este serial en la base de datos?</p>
				<button
					type="button"
					disabled={isDatabaseSearching}
					onclick={() => onSearchDatabase?.(searchTerm.trim())}
				>
					{isDatabaseSearching ? 'Buscando...' : 'Buscar en la base de datos'}
				</button>
			{:else}
				<p>No hay tiquetes para los filtros seleccionados.</p>
			{/if}
		</div>
	{/if}
</section>

<TicketPreviewModal
	bind:showTicketPreviewModal={showTicketPreviewModal}
	winnerTicket={selectedTicket}
	showPrintButton={false}
/>

<style>
	.results {
		display: block;
		width: 100%;
		margin-top: 1.5rem;
		max-height: min(70vh, 620px);
		overflow: auto;
	}

	table {
		min-width: 980px;
		background: #fff;
	}

	th {
		position: sticky;
		top: 0;
		z-index: 1;
		box-shadow: 0 1px 0 var(--color-border);
		background-color: var(--color-bg-2);
		color: rgba(0, 0, 0, 0.6);
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	th button {
		display: flex;
		width: max-content;
		min-width: 100%;
		align-items: center;
		justify-content: flex-start;
		gap: 0.3rem;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		letter-spacing: inherit;
		text-align: left;
		white-space: nowrap;
		cursor: pointer;
	}

	th button:hover,
	th button:focus-visible {
		color: var(--color-theme-1);
	}

	.sort-indicator {
		font-size: 1.35rem;
		font-weight: 800;
		line-height: 0.8;
	}

	td {
		font-size: 0.9rem;
		vertical-align: top;
	}

	tbody tr {
		background-color: #fff;
	}

	tbody tr:hover {
	    outline: 2px solid #2563eb;
        outline-offset: -2px;
	}

	tbody tr:focus-visible {
		outline: 2px solid var(--color-theme-1);
		outline-offset: -2px;
	}

	tr.deleted {
		background-color: #fdecec;
		color: #7a1e1e;
	}

	tr.deleted td strong,
	tr.deleted td small {
		color: #7a1e1e;
	}

	td strong,
	td small {
		display: block;
	}

	td strong {
		color: rgba(0, 0, 0, 0.85);
		line-height: 1.3;
	}

	td small {
		margin-top: 0.2rem;
		color: rgba(0, 0, 0, 0.55);
		font-size: 0.78rem;
		line-height: 1.35;
	}

	.ticket-id {
		font-size: 1rem;
	}

	.status {
		display: inline-block;
		font-weight: 600;
		white-space: nowrap;
	}

	.status-deleted {
		color: rgba(0, 0, 0, 0.6);
	}

	.empty-results {
		display: flex;
		min-height: 180px;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 0.75rem;
		padding: 2rem;
		border: 1px solid #dbe3ec;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.78);
		color: #66758a;
		text-align: center;
	}

	.empty-results p {
		margin: 0;
	}

	.empty-results button {
		padding: 0.45rem 0.8rem;
		border: 0;
		border-radius: 4px;
		background: var(--color-theme-1);
		color: #fff;
		cursor: pointer;
	}

	.empty-results button:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	@media (max-width: 640px) {
		.results {
			max-height: calc(100vh - 260px);
		}
	}
</style>
