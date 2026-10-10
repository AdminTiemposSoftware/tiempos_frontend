<script lang="ts">
	import { formatAmount } from '../../printing/printing';
	import type { ReportItem } from '../venta/grouping';

	type ProhibitedItem = {
		number: number;
		amount: number | string;
		starter: number | string;
		by_amount: boolean;
		by_percentage: boolean;
		percentage?: number | string;
		branch_id?: number | string | null;
		date: string;
	};

	type BreakdownRow = {
		number: number;
		date: string;
		branch: string;
		schedule: string;
		amount: number;
		limit: number;
		percentageLimit: number;
		percentage: number | null;
		devolution: number;
		mode: 'amount' | 'percentage' | 'mixed' | 'none';
	};

	let {
		report = [],
		prohibitedNumbers = []
	} = $props<{
		report?: ReportItem[];
		prohibitedNumbers?: ProhibitedItem[];
	}>();

	function dateKey(value: string) {
		return String(value).split('T')[0];
	}

	function scopeKey(item: ReportItem) {
		return `${dateKey(item.date)}|${item.branch_id}|${item.draw_schedule_id}`;
	}

	function matchesProhibited(item: ReportItem, prohibited: ProhibitedItem) {
		return Number(item.number) === Number(prohibited.number) &&
			(prohibited.branch_id == null || Number(prohibited.branch_id) === Number(item.branch_id)) &&
			dateKey(item.date) === dateKey(prohibited.date);
	}

	function getDevolution(item: ReportItem, prohibited: ProhibitedItem, scopeTotal: number) {
		const amount = Number(item.amount);
		if (!Number.isFinite(amount)) {
			return 0;
		}

		if (prohibited.by_amount) {
			const limit = Number(prohibited.amount);
			return Number.isFinite(limit) && amount > limit ? amount - limit : 0;
		}

		if (prohibited.by_percentage) {
			const starter = Number(prohibited.starter);
			const percentage = Number(prohibited.percentage);
			const limit = scopeTotal * percentage * 0.01;

			return Number.isFinite(starter) &&
				Number.isFinite(percentage) &&
				amount > starter &&
				amount > limit
				? amount - limit
				: 0;
		}

		return 0;
	}

	const totalsByScope = $derived.by(() => {
		const totals = new Map<string, number>();
		for (const item of report) {
			totals.set(scopeKey(item), (totals.get(scopeKey(item)) ?? 0) + Number(item.amount));
		}
		return totals;
	});

	const rows = $derived.by<BreakdownRow[]>(() => {
		const calculatedRows = prohibitedNumbers.flatMap((prohibited) => {
			const matchingItems = report.filter((item) => matchesProhibited(item, prohibited));
			const grouped = new Map<string, { items: ReportItem[]; branch: string }>();

			for (const item of matchingItems) {
				const key = scopeKey(item);
				const existing = grouped.get(key);
				if (existing) {
					existing.items.push(item);
				} else {
					grouped.set(key, { items: [item], branch: item.branch_name });
				}
			}

			const groups = grouped.size > 0
				? Array.from(grouped.values())
				: [{ items: [], branch: '-' }];

			return groups.map(({ items, branch }) => {
				const firstItem = items[0];
				const scopeTotal = firstItem ? totalsByScope.get(scopeKey(firstItem)) ?? 0 : 0;
				const percentage = Number(prohibited.percentage);
				const configuredAmount = Number(prohibited.amount);
				const limit = prohibited.by_percentage && Number.isFinite(percentage)
					? scopeTotal * percentage * 0.01
					: configuredAmount;
				const devolution = items.reduce(
					(sum, item) => sum + getDevolution(item, prohibited, totalsByScope.get(scopeKey(item)) ?? 0),
					0
				);

				return {
					number: Number(prohibited.number),
					date: firstItem ? dateKey(firstItem.date) : dateKey(prohibited.date),
					branch,
					schedule: firstItem?.draw_schedule_name ?? '-',
					amount: items.reduce((sum, item) => sum + Number(item.amount), 0),
					limit: Number.isFinite(limit) ? limit : 0,
					percentageLimit: prohibited.by_percentage && Number.isFinite(limit) ? limit : 0,
					percentage: Number.isFinite(percentage) ? percentage : null,
					devolution,
					mode: prohibited.by_percentage
						? 'percentage'
						: prohibited.by_amount
							? 'amount'
							: 'none'
				};
			}).filter((row) => row.devolution > 0);
		});

		const uniqueRows = new Map<string, BreakdownRow>();
		for (const row of calculatedRows) {
			const key = `${row.number}|${row.date}|${row.branch}|${row.schedule}`;
			if (!uniqueRows.has(key)) {
				uniqueRows.set(key, row);
			}
		}

		const rowsByNumber = new Map<number, BreakdownRow>();
		for (const row of uniqueRows.values()) {
			const existing = rowsByNumber.get(row.number);
			if (!existing) {
				rowsByNumber.set(row.number, { ...row });
				continue;
			}

			const sameMode = existing.mode === row.mode;
			const samePercentage = existing.percentage === row.percentage;
			existing.amount += row.amount;
			existing.limit += row.limit;
			existing.percentageLimit += row.percentageLimit;
			existing.devolution += row.devolution;
			existing.mode = sameMode ? existing.mode : 'mixed';
			existing.percentage = sameMode && samePercentage ? existing.percentage : null;
		}

		return Array.from(rowsByNumber.values());
	});

	const totalDevolution = $derived(rows.reduce((sum, row) => sum + row.devolution, 0));
	const totalPercentageLimit = $derived(
		rows.reduce((sum, row) => sum + row.percentageLimit, 0)
	);
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
					<span>Fecha: {row.date}</span>
					<span>Puesto: {row.branch}</span>
					<span>Horario: {row.schedule}</span>
					<span>Venta: ₡{formatAmount(Math.round(row.amount))}</span>
					<span>
						Límite:
						{#if row.mode === 'percentage'}
							₡{formatAmount(Math.round(row.limit))} ({row.percentage}%)
						{:else if row.mode === 'amount'}
							₡{formatAmount(Math.round(row.limit))}
						{:else}
							-
						{/if}
					</span>
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

	.number-badge:hover .number-info,
	.number-badge:focus-visible .number-info {
		display: flex;
	}

	.empty {
		padding: 0.5rem 0;
	}
</style>
