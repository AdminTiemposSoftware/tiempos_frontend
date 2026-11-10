<script lang="ts">
	import type { Ticket } from './ticketTypes';

	let {
		tickets,
		ticketNumbers,
		formatDate,
		formatTime,
		formatDateTime,
		isDeleted
	}: {
		tickets: Ticket[];
		ticketNumbers: Record<string, number>;
		formatDate: (value: string | null) => string;
		formatTime: (value: string | null) => string;
		formatDateTime: (value: string | null) => string;
		isDeleted: (ticket: Ticket) => boolean;
	} = $props();
</script>

<section class="table-scroll table-scroll--rows results" aria-label="Tiquetes encontrados">
	<table>
		<thead>
			<tr>
				<th>Tiquete</th>
				<th>Venta</th>
				<th>Puesto / sorteo</th>
				<th>Vendedor</th>
				<th>Estado</th>
				<th>Eliminado por</th>
			</tr>
		</thead>
		<tbody>
		{#each tickets as ticket (ticket.id)}
			<tr class:deleted={isDeleted(ticket)}>
				<td>
					<strong class="ticket-id">#{String(ticket.relative_id).padStart(3, '0')}</strong>
					<small>{ticket.serial}</small>
				</td>
				<td>
					<strong>{formatDate(ticket.date)} · {formatTime(ticket.time)}</strong>
					<small>{ticketNumbers[ticket.serial] ?? 0} números · impreso {formatDateTime(ticket.printed_at ?? ticket.time)}</small>
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
						<small>{formatDateTime(ticket.deleted_at)}</small>
					{/if}
				</td>
			</tr>
		{/each}
		</tbody>
	</table>
</section>

<style>
	.results {
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
