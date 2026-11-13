<script lang="ts">
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

	type SortKey = 'ticket' | 'sale' | 'location' | 'seller' | 'status' | 'deletedBy';

	let {
		tickets,
		ticketNumbers,
		searchTerm = '',
		formatDate,
		formatTime,
		isDeleted
	}: {
		tickets: Ticket[];
		ticketNumbers: Record<string, number>;
		searchTerm?: string;
		formatDate: (value: string | null) => string;
		formatTime: (value: string | null) => string;
		isDeleted: (ticket: Ticket) => boolean;
	} = $props();

	let sortKey = $state<SortKey>('sale');
	let sortDirection = $state<'asc' | 'desc'>('desc');
	let resultsTable: HTMLElement;

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

		return [...matchingTickets].sort(compareTickets);
	});
</script>

<section class="results" bind:this={resultsTable} aria-label="Tiquetes encontrados">
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
			<tr class:deleted={isDeleted(ticket)}>
				<td>
					<strong class="ticket-id">#{String(ticket.relative_id).padStart(3, '0')}</strong>
					<small>{ticket.serial}</small>
				</td>
				<td>
					<strong>{formatDate(ticket.date)} · {formatTime(ticket.time)}</strong>
					<small>{ticketNumbers[ticket.serial] ?? 0} números</small>
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
</section>

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
		background: var(--color-bg-2);
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

	@media (max-width: 640px) {
		.results {
			max-height: calc(100vh - 260px);
		}
	}
</style>
