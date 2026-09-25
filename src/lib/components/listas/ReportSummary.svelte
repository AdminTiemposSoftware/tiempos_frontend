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
		branch_id?: number;
		date: string;
	};

	type WinnerItem = {
		winner_number: number | null;
		date: string;
		schedule_id: number;
		position_multiplier: number;
	};

	let {
		report = [],
		prohibitedNumbers = [],
		winners = []
	} = $props<{
		report?: ReportItem[];
		prohibitedNumbers?: ProhibitedItem[];
		winners?: WinnerItem[];
	}>();

	function dateKey(value: string) {
		return String(value).split('T')[0];
	}

	function scopeKey(item: ReportItem) {
		return `${dateKey(item.date)}|${item.branch_id}|${item.draw_schedule_id}`;
	}

	function getProhibited(item: ReportItem) {
		return prohibitedNumbers.find((candidate) =>
			Number(candidate.number) === Number(item.number) &&
			(candidate.branch_id == null || Number(candidate.branch_id) === Number(item.branch_id)) &&
			dateKey(candidate.date) === dateKey(item.date)
		);
	}

	function getItemDevolution(item: ReportItem, totalByScope: Map<string, number>) {
		const prohibited = getProhibited(item);
		if (!prohibited) {
			return 0;
		}

		const amount = Number(item.amount);
		const limit = Number(prohibited.amount);
		const starter = Number(prohibited.starter);
		const scopeTotal = totalByScope.get(scopeKey(item)) ?? 0;

		if (prohibited.by_amount && Number.isFinite(limit) && amount > limit) {
			return amount - limit;
		}

		if (
			prohibited.by_percentage &&
			Number.isFinite(starter) &&
			Number.isFinite(Number(prohibited.percentage)) &&
			amount > starter &&
			amount > scopeTotal * Number(prohibited.percentage) * 0.01
		) {
			return amount - scopeTotal * Number(prohibited.percentage) * 0.01;
		}

		return 0;
	}

	function getMatchingWinners(item: ReportItem) {
		return winners.filter((winner) =>
			winner.winner_number != null &&
			Number(winner.winner_number) === Number(item.number) &&
			dateKey(winner.date) === dateKey(item.date) &&
			Number(winner.schedule_id) === Number(item.draw_schedule_id)
		);
	}

	const total = $derived(report.reduce((sum, item) => sum + Number(item.amount), 0));

	const devolution = $derived.by(() => {
		const totalsByScope = new Map<string, number>();

		for (const item of report) {
			totalsByScope.set(
				scopeKey(item),
				(totalsByScope.get(scopeKey(item)) ?? 0) + Number(item.amount)
			);
		}

		return report.reduce((sum, item) => {
			return sum + getItemDevolution(item, totalsByScope);
		}, 0);
	});

	const winnerTotal = $derived.by(() => {
		const totalsByScope = new Map<string, number>();
		for (const item of report) {
			totalsByScope.set(
				scopeKey(item),
				(totalsByScope.get(scopeKey(item)) ?? 0) + Number(item.amount)
			);
		}

		return report.reduce((sum, item) => {
			const itemDevolution = getItemDevolution(item, totalsByScope);
			const matchingWinners = getMatchingWinners(item);

			return sum + matchingWinners.reduce((winnerSum, winner) => {
				return winnerSum + (Number(item.amount) - itemDevolution) * Number(winner.position_multiplier);
			}, 0);
		}, 0);
	});

	const devolutionWinnerTotal = $derived.by(() => {
		const totalsByScope = new Map<string, number>();
		for (const item of report) {
			totalsByScope.set(
				scopeKey(item),
				(totalsByScope.get(scopeKey(item)) ?? 0) + Number(item.amount)
			);
		}

		return report.reduce((sum, item) => {
			const itemDevolution = getItemDevolution(item, totalsByScope);
			const branchBuyFirstPlace = Number(item.branch_buy_first_place);

			if (!Number.isFinite(branchBuyFirstPlace)) {
				return sum;
			}

			return getMatchingWinners(item).length > 0
				? sum + itemDevolution * branchBuyFirstPlace
				: sum;
		}, 0);
	});

	const devolutionBuyTotal = $derived.by(() => {
		const totalsByScope = new Map<string, number>();
		for (const item of report) {
			totalsByScope.set(
				scopeKey(item),
				(totalsByScope.get(scopeKey(item)) ?? 0) + Number(item.amount)
			);
		}

		return report.reduce((sum, item) => {
			const branchBuy = Number(item.branch_buy);
			if (!Number.isFinite(branchBuy)) {
				return sum;
			}

			return sum + getItemDevolution(item, totalsByScope) * branchBuy * 0.01;
		}, 0);
	});

	const netDevolutionTotal = $derived(devolution - devolutionWinnerTotal);


	const adjustedTotal = $derived(total - devolution);
	const commissionRate = $derived(total === 0 ? 0 : report.reduce(
		(sum, item) => sum + (Number(item.amount) / total) * Number(item.branch_comission),
		0
	));
	const commission = $derived(adjustedTotal * commissionRate * 0.01);
	const netTotal = $derived(adjustedTotal - commission - winnerTotal);
</script>

<div class="report-summary">
	<table>
		<colgroup>
			<col class="label-column" />
			<col span="4" class="data-column" />
		</colgroup>
		<thead>
			<tr>
				<th class="corner"></th>
				<th scope="col">Total</th>
				<th scope="col">Comisión</th>
				<th scope="col">Premio</th>
				<th scope="col">Saldo</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<th scope="row">Devolución</th>
				<td>₡{formatAmount(Math.round(devolution))}</td>
				<td>₡{formatAmount(Math.round(devolutionBuyTotal))}</td>
				<td>₡{formatAmount(Math.round(devolutionWinnerTotal))}</td>
				<td>₡{formatAmount(Math.round(netDevolutionTotal))}</td>
			</tr>
			<tr>
				<th scope="row">Venta ajustada</th>
				<td>₡{formatAmount(Math.round(adjustedTotal))}</td>
				<td>₡{formatAmount(Math.round(commission))}</td>
				<td>₡{formatAmount(Math.round(winnerTotal))}</td>
				<td>₡{formatAmount(Math.round(netTotal))}</td>
			</tr>
			<tr>
				<th scope="row">Real</th>
				<td>₡{formatAmount(Math.round(total))}</td>
				<td>₡{formatAmount(Math.round(commission + devolutionBuyTotal))}</td>
				<td>₡{formatAmount(Math.round(winnerTotal + devolutionWinnerTotal))}</td>
				<td>₡{formatAmount(Math.round(netTotal + netDevolutionTotal))}</td>
			</tr>
		</tbody>
	</table>
</div>

<style>
	.report-summary {
		width: 75%;
		margin-top: 0.75rem;
	}

	table {
		font-size: 1rem;
		width: 100%;
		table-layout: fixed;
		border-collapse: collapse;
		background: #fff;
	}

	.label-column {
		width: 18%;
	}

	.data-column {
		width: 20%;
	}

	th,
	td {
		padding: 0.45rem 0.75rem;
		border: 2px solid var(--color-border);
	}

	thead th {
		text-align: center;
	}

	tbody th {
		font-weight: 600;
		text-align: left;
	}

	td {
		text-align: right;
	}

	.corner {
		border-top: 2px solid var(--color-box-background);
		border-left: 2px solid var(--color-box-background);
		background: var(--color-box-background);
	}
</style>
