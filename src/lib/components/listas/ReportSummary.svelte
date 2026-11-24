<script lang="ts">
	import { formatAmount } from '../../printing/printing';
	let {
		summary = {}
	} = $props();
	const value = (key: string) => Number(summary[key] ?? 0);
	const total = $derived(value('total'));
	const devolution = $derived(value('devolution'));
	const devolutionBuyTotal = $derived(value('devolution_buy'));
	const devolutionWinnerTotal = $derived(value('devolution_winner_total'));
	const netDevolutionTotal = $derived(value('net_devolution'));
	const adjustedTotal = $derived(value('adjusted_total'));
	const commission = $derived(value('commission'));
	const winnerTotal = $derived(value('winner_total'));
	const netTotal = $derived(value('net_total'));
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
		width: 80%;
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
		width: 20%;
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
