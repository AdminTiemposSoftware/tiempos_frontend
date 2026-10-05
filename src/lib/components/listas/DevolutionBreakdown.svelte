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
		sales: number;
		limit: number;
		percentage: number | null;
		devolution: number;
		mode: 'amount' | 'percentage' | 'none';
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

	const rows = $derived.by<BreakdownRow[]>(() => prohibitedNumbers.flatMap((prohibited) => {
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

			return {
				number: Number(prohibited.number),
				date: firstItem ? dateKey(firstItem.date) : dateKey(prohibited.date),
				branch,
				schedule: firstItem?.draw_schedule_name ?? '-',
				sales: items.reduce((sum, item) => sum + Number(item.amount), 0),
				limit: Number.isFinite(limit) ? limit : 0,
				percentage: Number.isFinite(percentage) ? percentage : null,
				devolution: items.reduce(
					(sum, item) => sum + getDevolution(item, prohibited, totalsByScope.get(scopeKey(item)) ?? 0),
					0
				),
				mode: prohibited.by_percentage
					? 'percentage'
					: prohibited.by_amount
						? 'amount'
						: 'none'
			};
		});
	}));

	const totalDevolution = $derived(rows.reduce((sum, row) => sum + row.devolution, 0));
	const totalPercentageLimit = $derived(
		rows.reduce((sum, row) => sum + (row.mode === 'percentage' ? row.limit : 0), 0)
	);
</script>

<section class="devolution-breakdown" aria-labelledby="devolution-breakdown-title">
	<div class="breakdown-header">
		<div>
			<h2 id="devolution-breakdown-title">Justificación de devolución</h2>
			<p>La devolución se calcula por número prohibido y por alcance (fecha, puesto y horario).</p>
		</div>
		<div class="totals">
			<div class="total">
				<span>Suma total × porcentaje</span>
				<strong>₡{formatAmount(Math.round(totalPercentageLimit))}</strong>
			</div>
			<div class="total">
				<span>Total devolución</span>
				<strong>₡{formatAmount(Math.round(totalDevolution))}</strong>
			</div>
		</div>
	</div>

	{#if rows.length === 0}
		<p class="empty">No hay números prohibidos en este reporte.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Número</th>
					<th>Fecha</th>
					<th>Puesto</th>
					<th>Horario</th>
					<th>Ventas</th>
					<th>Límite aplicado</th>
					<th>Devolución</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row}
					<tr>
						<td>{row.number}</td>
						<td>{row.date}</td>
						<td>{row.branch}</td>
						<td>{row.schedule}</td>
						<td>₡{formatAmount(Math.round(row.sales))}</td>
						<td>
							{#if row.mode === 'percentage'}
								₡{formatAmount(Math.round(row.limit))}
								<span>{row.sales > 0 ? ` (total del alcance × ${row.percentage}%)` : ` (ventas del alcance × ${row.percentage}%)`}</span>
							{:else if row.mode === 'amount'}
								₡{formatAmount(Math.round(row.limit))}
							{:else}
								-
							{/if}
						</td>
						<td>₡{formatAmount(Math.round(row.devolution))}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>

<style>
	.devolution-breakdown {
		width: 100%;
		margin-top: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		background: #fff;
	}

	.breakdown-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.totals {
		display: flex;
		align-items: flex-end;
		gap: 1.25rem;
	}

	h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	p {
		margin: 0.25rem 0 0;
		color: var(--color-text);
		font-size: 0.85rem;
	}

	.total {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.15rem;
	}

	.total span {
		font-size: 0.8rem;
	}

	.total strong {
		font-size: 1.2rem;
		white-space: nowrap;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	th,
	td {
		padding: 0.45rem 0.55rem;
		border: 1px solid var(--color-border);
	}

	th {
		text-align: left;
		background: var(--color-box-background);
	}

	td:nth-child(5),
	td:nth-child(6),
	td:nth-child(7) {
		text-align: right;
	}

	td span {
		display: block;
		font-size: 0.75rem;
		color: var(--color-text);
	}

	.empty {
		padding: 0.5rem 0;
	}
</style>
