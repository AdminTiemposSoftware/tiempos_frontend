<script lang="ts">
	import { formatAmount } from '../../printing/printing';
	let {rows = []} = $props();
</script>

<div class="devolution-breakdown" aria-labelledby="devolution-breakdown-title">
    <span>Numeros pasados:</span>

	{#if rows.length === 0}
		<p class="empty">No hay números pasados en este reporte.</p>
	{:else}
		<div class="number-list" aria-label="Números con devolución">
		{#each rows as row}
			<div
				class="number-badge"
				aria-label={`Mostrar detalles del número ${row.number}`}
			>
				<div class="number-info" role="tooltip">
					<strong>Número {row.number}</strong>
					{#each row.details as detail}
						<div class="number-detail">
							<span>Fecha: {detail.date}</span>
							<span>Puesto: {detail.branch}</span>
							<span>Horario: {detail.schedule}</span>
							<span>Venta: ₡{formatAmount(Math.round(detail.amount))}</span>
							<span>
								Límite:
								{#if detail.mode === 'percentage'}
									₡{formatAmount(Math.round(detail.limit))} ({detail.percentage}%)
								{:else if detail.mode === 'amount'}
									₡{formatAmount(Math.round(detail.limit))}
								{:else}
									-
								{/if}
							</span>
							<strong>Devolución: ₡{formatAmount(Math.round(detail.devolution))}</strong>
						</div>
					{/each}
					<strong>Total devolución: ₡{formatAmount(Math.round(row.devolution))}</strong>
				</div>
				<p class="number">{row.number}</p>
				<p>₡{formatAmount(Math.round(row.devolution))}</p>
			</div>
		{/each}
		</div>
	{/if}
</div>

<style>
	.devolution-breakdown {
		width: 40%;
		padding: 1rem;
		border: 1px solid var(--color-border);
	}

	p {
		margin: 0.25rem 0 0;
		color: var(--color-text);
		font-size: 0.85rem;
	}

	.number-list {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		padding-top: 0.5rem;
	}

	.number-badge {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--color-border);
		border-radius: 1rem;
		padding: 0.4rem;
		padding-top: 0.2rem;
		background: #fff;
		cursor: pointer;
		outline: none;
		color: inherit;
	}

	.number {
	    font-weight: 600;
		font-size: 0.9rem;
	}

	.number-info {
		position: absolute;
		z-index: 2;
		bottom: calc(100% + 0.5rem);
		left: 50%;
		display: none;
		min-width: 13rem;
		padding: 0.65rem;
		transform: translateX(-50%);
		flex-direction: column;
		gap: 0.2rem;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		background: #fff;
		box-shadow: 0 0.25rem 0.75rem rgb(0 0 0 / 15%);
		font-size: 0.78rem;
		text-align: left;
	}

	.number-detail {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.35rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.number-detail:last-of-type {
		border-bottom: 0;
	}

	.number-badge:hover .number-info,
	.number-badge:focus-visible .number-info {
		display: flex;
	}

	.empty {
		padding: 0.5rem 0;
	}
</style>
