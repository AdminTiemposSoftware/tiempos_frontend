<script lang="ts">
	// Available grouping options and the type representing a grouping mode.
	import { GROUPING_OPTIONS, type GroupingMode } from '../venta/grouping';
	let { report = [], showModal = $bindable(false), winners, prohibitedNumbers } = $props<{report: ReportItem[];showModal: boolean;}>();

	// Represents a single record from the report.
	type ReportItem = {
		branch_id: number;
		branch_name: string;
		draw_schedule_id: number;
		draw_schedule_name: string;
		draw_id: number;
		draw_name: string;
		number: number;
		amount: number;
		branch_comission: number;
		is_reventado: boolean;
		is_megareventado: boolean;
		date: string;
	};

	// Represents winner information associated with a position.
	type Winner = {
	    draw_id: number;
		draw_schedule_id: number;
		date: string;
		position_id: number;
		position_number: number;
		position_multiplier: number;
		winner_id: number;
		winner_number: number;
	};

	type Prohibited = {
	    banking_id: number;
        number: number;
        starter: number;
        can_sell_after_amount: boolean;
        by_amount: boolean;
        by_percentage: boolean;
        percentage: number;
        branch_id: number;
        amount: number;
        date: string;
	};

	// Represents a secondary row inside a grouped report section.
	type GroupRow = {
		id: string;
		label: string;
		winners: Winner[];
		winner_total: number;
		overageNumbers: {number: number; amount: number; overage: number; prohibited: Prohibited}[];
		devolution: number;
		total: number;
		comission: number;
	};

	// Represents a primary section of the grouped report.
	// Each section contains one or more secondary rows.
	type GroupSection = {
		id: string;
		label: string;
		rows: GroupRow[];
		winners: Winner;
		winner_total: number;
		overageNumbers: {number: number; amount: number; overage: number; prohibited: Prohibited}[];
		devolution: number;
		total: number;
		comission: number;
	};

	// Defines the active grouping hierarchy.
	// By default, reports are grouped first by date and then by branch.
	let groupingModes = $state<GroupingMode[]>(['date', 'draw_schedule']);
	let showGroupingConfig = $state(false);

	const groupingPresets: { label: string; modes: GroupingMode[] }[] = [
		{
			label: 'Fecha > Sorteo > Horario > Puesto',
			modes: ['date', 'draw', 'draw_schedule', 'branch']
		},
		{
			label: 'Fecha > Sorteo > Horario',
			modes: ['date', 'draw', 'draw_schedule']
		},
		{
			label: 'Puesto > Fecha > Sorteo > Horario',
			modes: ['branch', 'date', 'draw', 'draw_schedule']
		},
		{
			label: 'Puesto > Sorteo > Horario',
			modes: ['branch', 'draw', 'draw_schedule']
		},
		{
			label: 'Sorteo > Horario > Puesto > Fecha',
			modes: ['draw', 'draw_schedule', 'branch', 'date']
		},
		{
			label: 'Sorteo > Puesto > Fecha',
			modes: ['draw', 'branch', 'date']
		},
		{
			label: 'Sorteo > Horario > Fecha',
			modes: ['draw', 'draw_schedule', 'date']
		}
	];

	function applyGroupingPreset(modes: GroupingMode[]) {
		groupingModes = [...modes];
	}

	// Formatter used to display amounts as Costa Rican colones.
	const currencyFormatter = new Intl.NumberFormat('es-CR', {style: 'currency', currency: 'CRC', maximumFractionDigits: 0});
	function formatCurrency(value: number) {return currencyFormatter.format(value);}

	// Extracts and validates the branch commission percentage.
	// Invalid or missing values default to 0%.
	function getComissionPercentage(item: ReportItem) {
		const percentage = Number(item.branch_comission);
		return Number.isFinite(percentage) ? percentage : 0;
	}

	function getOverageAmountOnProhibited(prohibitedNumber: Prohibited, amount: number, total: number) {
		if (prohibitedNumber?.by_amount) {
			if (amount > prohibitedNumber.amount) {
				return amount - prohibitedNumber.amount;
			}
		} else if (prohibitedNumber?.by_percentage){
			if (amount && (total * prohibitedNumber.percentage*0.01) < amount && amount > prohibitedNumber.starter) {
				return amount - (total * prohibitedNumber.percentage*0.01);
			}
		}
		return 0;
	}

	function getDevolution(total: number, overageNumbers: { number: number; amount: number; overage: number; prohibited: Prohibited }[]) {
		let devolution = 0;
	    for (const overageNumber of overageNumbers) {
	        if (overageNumber.prohibited) {
	            devolution += getOverageAmountOnProhibited(overageNumber.prohibited, overageNumber.amount, total);
	        }
	    }
	    return devolution;
	}

	// Returns the unique grouping key for a report item
	// based on the selected grouping mode.
	function getGroupingValue(item: ReportItem, mode: GroupingMode) {
		switch (mode) {
			case 'branch':
				return String(item.branch_id);

			case 'draw_schedule':
				return String(item.draw_schedule_id);

			case 'draw':
				return String(item.draw_id);

			case 'date':
				return item.date || '-';
		}
	}

	// Returns the human-readable label for a grouping value.
	function getGroupingLabel(item: ReportItem, mode: GroupingMode) {
		switch (mode) {
			case 'branch':
				return item.branch_name;
			case 'draw_schedule':
				return item.draw_schedule_name;
			case 'draw':
				return item.draw_name;
			case 'date':
				return item.date || '-';
		}
	}

	// Enables or disables a grouping mode.
	// At least one grouping mode must remain selected.
	function toggleGroupingMode(mode: GroupingMode) {
		if (groupingModes.includes(mode)) {
			if (groupingModes.length === 1) {
				return;
			}
			groupingModes = groupingModes.filter((item) => item !== mode);
			return;
		}
		groupingModes = [...groupingModes, mode];
	}

	// Moves a grouping mode one position up or down in the grouping hierarchy.
	function moveGroupingMode(mode: GroupingMode, direction: -1 | 1) {
		const currentIndex = groupingModes.indexOf(mode);
		if (currentIndex === -1) {
			return;
		}
		const targetIndex = currentIndex + direction;
		// Don't move beyond the beginning or end of the list.
		if (targetIndex < 0 || targetIndex >= groupingModes.length) {
			return;
		}
		// Create a new array and swap the selected grouping with its neighbor.
		const nextModes = [...groupingModes];
		[nextModes[currentIndex], nextModes[targetIndex]] = [
			nextModes[targetIndex],
			nextModes[currentIndex]
		];
		groupingModes = nextModes;
	}

	// Converts a grouping mode into its user-facing label.
	function getGroupingModeLabel(mode: GroupingMode) {
		return (GROUPING_OPTIONS.find(
			(option: { value: GroupingMode; label: string }) => option.value === mode
		)?.label ?? mode);
	}

	// Groups report items according to the selected primary and secondary grouping modes.
	// It also calculates the total sales and commission for each group.
	function buildGroups(
		items: ReportItem[],
		config: {
			primaryId: (item: ReportItem) => string;
			primaryLabel: (item: ReportItem) => string;
			secondaryId: (item: ReportItem) => string;
			secondaryLabel: (item: ReportItem) => string;
		}
	): GroupSection[] {
		// Maps each primary group to its secondary groups.
		const primaryMap = new Map<string,{ label: string; secondary: Map<string, GroupRow> }>();
		const winnersBySchedule = new Map<string, Winner[]>();
		const prohibitedByNumber = new Map<string, Prohibited>();

		for (const winner of winners) {
			const key = `${winner.date}|${winner.schedule_id}`;
			const existing = winnersBySchedule.get(key) ?? [];

			existing.push(winner);
			winnersBySchedule.set(key, existing);
		}

		for (const prohibitedNumber of prohibitedNumbers) {
			const key = `${prohibitedNumber.date.split('T')[0]}|${prohibitedNumber.branch_id}|${prohibitedNumber.number}`;
			prohibitedByNumber.set(key, prohibitedNumber);
		}

		for (const item of items) {
			const pId = config.primaryId(item);
			const pLabel = config.primaryLabel(item);
			const sId = config.secondaryId(item);
			const sLabel = config.secondaryLabel(item);
			const winnerKey = `${item.date}|${item.draw_schedule_id}`;
			const prohibitedKey = `${item.date}|${item.branch_id}|${item.number}`;

			// Create the primary group if it doesn't exist.
			if (!primaryMap.has(pId)) {
				primaryMap.set(pId, {
					label: pLabel,
					secondary: new Map<string, GroupRow>()
				});
			}

			const primary = primaryMap.get(pId)!;
			const current = primary.secondary.get(sId);
			const rowWinners = winnersBySchedule.get(winnerKey) ?? [];
			const prohibitedNumber = prohibitedByNumber.get(prohibitedKey);
			let winner = 0;
			let devolution = 0;
			let overageNumber: { number: number; amount: number; overage: number; prohibited: Prohibited } | null = null;

			// If current reportItem is a winner
			if (item.number === rowWinners[0].winner_number) {
				winner += item.amount * rowWinners[0].position_multiplier;
			}

			// If current number is prohibited push to overageNumbers
			if (prohibitedNumber) {
				overageNumber = { number: item.number, amount: item.amount, overage: 0, prohibited: prohibitedNumber };
			}

			if (current) {
				// Add the current item's amount and commission
				// to an already existing secondary group.
				current.total += item.amount;
				if (!current.winners.find(w => rowWinners.includes(w))) {
					current.winners.push(...rowWinners);
				}
				current.winner_total += winner;

				if (overageNumber) {
					current.overageNumbers.push(overageNumber);
				}

				// We have to calculate devolution after the current item is added to the group.
				current.devolution = getDevolution(current.total, current.overageNumbers);
				current.comission = (current.total - current.devolution) * getComissionPercentage(item)*0.01;
			} else {
				// Create a new secondary group for this item.
				devolution = getDevolution(item.amount, overageNumber ? [overageNumber] : []);
				primary.secondary.set(sId, {
					id: sId,
					label: `${sLabel}`,
					winners: rowWinners,
					winner_total: winner,
					overageNumbers: overageNumber ? [overageNumber] : [],
					total: item.amount,
					devolution,
					comission: (item.amount - devolution) * getComissionPercentage(item) * 0.01,
				});
			}
		}

		// Convert the Map structure into arrays suitable for rendering.
		return Array.from(primaryMap.entries())
			.map(([id, value]) => {
				const rows = Array.from(value.secondary.values()).sort(
					(a, b) => b.total - a.total
				);

				// Calculate totals across all secondary rows.
				const total = rows.reduce((sum, row) => sum + row.total, 0);
				const comission = rows.reduce((sum, row) => sum + row.comission, 0);
				const winner_total = rows.reduce((sum, row) => sum + row.winner_total, 0);
				const devolution = rows.reduce((sum, row) => sum + row.devolution, 0);

				return {
					id,
					label: value.label,
					rows,
					winner_total,
					devolution,
					total,
					comission
				};
			})
			.sort((a, b) => a.label.localeCompare(b.label));
	}

	// Rebuilds the grouped report whenever the report or grouping modes change.
	const visibleGroups = $derived.by(() => {
		// The first selected mode is the primary grouping.
		// All remaining modes form the secondary grouping path.
		// If only one mode is selected, it is used for both.
		const [primaryMode, ...remainingModes] = groupingModes;
		const secondaryModes = remainingModes.length > 0 ? remainingModes : [primaryMode];

		return buildGroups(report, {
			primaryId: (item) => getGroupingValue(item, primaryMode),
			primaryLabel: (item) => getGroupingLabel(item, primaryMode),

			secondaryId: (item) => secondaryModes
				.map((mode) => getGroupingValue(item, mode))
				.join('|'),
			secondaryLabel: (item) => secondaryModes
				.map((mode) => getGroupingLabel(item, mode))
				.join(' - ')
		});
	});


	const grandTotal = $derived(visibleGroups.reduce((sum, group) => sum + group.total, 0));
	const grandcomissionTotal = $derived(visibleGroups.reduce((sum, group) => sum + group.comission, 0));
	const granWinnerTotal = $derived(visibleGroups.reduce((sum, group) => sum + group.winner_total, 0));
	const grandDevolutionTotal = $derived(visibleGroups.reduce((sum, group) => sum + group.devolution, 0));

	function onClose() {
		showModal = false;
	}
</script>

{#if showModal}
<div
	class="modal-backdrop"
	role="button"
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	tabindex="0"
>
<div class="modal" onclick={(e) => e.stopPropagation()} role="presentation">
	<div class="content">
		{#if visibleGroups.length === 0}
			<p class="empty">No hay datos para mostrar.</p>
		{:else}
			<div class="totals-head">
			    <span>Total vendido</span>
				<span>Comisión</span>
				<span>Devolución</span>
				<span>Premio</span>
				<span>Numero ganador</span>
				<span>Neto</span>
			</div>

			{#each visibleGroups as group}
				<div class="group">
					<ul>
						{#each group.rows as row}
							<li>
								<span class="label">{group.label} - {row.label}</span>
								<div class="totals">
								    <strong>{formatCurrency(row.total)}</strong>
									<strong>{formatCurrency(row.comission)}</strong>
									<strong>{formatCurrency(row.devolution)}</strong>
									<strong>{formatCurrency(row.winner_total)}</strong>
									<strong>
									{#each row.winners.filter((winner) => winner.winner_number != null) as winner, index}
										{winner.winner_number}{index < row.winners.filter((w) => w.winner_number != null).length - 1 ? ', ' : ''}
									{/each}
									</strong>
									<strong>{formatCurrency(row.total - row.devolution - row.comission - row.winner_total)}</strong>
								</div>
							</li>
						{/each}
					</ul>
					<div class="sub totals">
					    <strong>{formatCurrency(group.total)}</strong>
						<strong>{formatCurrency(group.comission)}</strong>
						<strong>{formatCurrency(group.devolution)}</strong>
						<strong>{formatCurrency(group.winner_total)}</strong>
						<strong></strong>
						<strong>{formatCurrency(group.total - group.devolution - group.comission - group.winner_total)}</strong>
					</div>
				</div>
			{/each}
		{/if}
		<footer class="modal-footer">
			<span class="label">Total</span>
			<div class="totals footer">
			    <strong>{formatCurrency(grandTotal)}</strong>
				<strong>{formatCurrency(grandcomissionTotal)}</strong>
				<strong>{formatCurrency(grandDevolutionTotal)}</strong>
				<strong>{formatCurrency(granWinnerTotal)}</strong>
				<strong>
 			</strong>
				<strong>{formatCurrency(grandTotal - grandcomissionTotal - granWinnerTotal)}</strong>
			</div>
		</footer>
	</div>
	<div class="field grouping-field">
  		<div class="grouping-presets">
       	    <span class="grouping-config-toggle">Agrupar por</span>
			{#each GROUPING_OPTIONS as option}
				{@const presetsForMode = groupingPresets.filter((preset) => preset.modes[0] === option.value)}
				{#if presetsForMode.length > 0}
					<span class="grouping-preset-subtitle">Por {option.label.toLowerCase()}</span>
					{#each presetsForMode as preset}
						<button
							type="button"
							class="grouping-preset"
							onclick={() => applyGroupingPreset(preset.modes)}
							title={preset.label}
						>
							{preset.label}
						</button>
					{/each}
				{/if}
			{/each}
		</div>
  		<button
     			type="button"
     			class="grouping-config-toggle"
     			aria-expanded={showGroupingConfig}
     			onclick={() => showGroupingConfig = !showGroupingConfig}
  		>
     			<span>Configurar</span>
     			<span aria-hidden="true">{showGroupingConfig ? '^' : '>'}</span>
  		</button>
  		{#if showGroupingConfig}
 			<div class="grouping-config">
				<div class="grouping-options">
				{#each GROUPING_OPTIONS as option}
				<button
 							type="button"
 							class={`grouping-option ${groupingModes.includes(option.value) ? 'selected' : ''}`}
 							onclick={() => toggleGroupingMode(option.value)}
				>
 							<input type="checkbox" checked={groupingModes.includes(option.value)} readonly />
 							<span>{option.label}</span>
				</button>
				{/each}
				</div>
				<div class="grouping-order">
				<div class="grouping-chip-list">
				{#each groupingModes as mode, index}
 							<div class="chip">
								<span>{index + 1}. {getGroupingModeLabel(mode)}</span>
								<div class="grouping-chip-actions">
								<button type="button" onclick={() => moveGroupingMode(mode, -1)} disabled={index === 0}>↑</button>
								<button type="button" onclick={() => moveGroupingMode(mode, 1)} disabled={index === groupingModes.length - 1}>↓</button>
								</div>
 							</div>
				{/each}
				</div>
				</div>
 			</div>
  		{/if}
        <button>Ver pdf</button>
   	</div>
</div>
</div>
{/if}

<style>
	.modal {
        margin-left: 13vw;
		width: 80vw;
		max-height: 90vh;
		display: flex;
		flex-direction: row;
		gap: 1rem;
	}

	.modal-footer {
		padding: 0.7rem !important;
	}

	.totals-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
		opacity: 0.85;
		width: 61%;
		margin-left: auto;
		padding: 0 1rem;
	}

	.content {
		overflow: auto;
		display: flex;
		flex: 4;
		flex-direction: column;
	}

	.group {
		padding: 0.5rem 1rem;
		font-size: 1rem;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li, .modal-footer {
		display: flex;
		justify-content: space-between;
		padding: 0.15rem 0;
		border-top: 1px solid var(--color-border);
	}

	.label {
	    width: 40%;
	}

	.totals {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.totals strong, .totals-head span {
		flex: 1;
		text-align: center;
	}

	.modal-footer .totals {
		width: 60%;
		margin-left: auto;
		flex: initial;
	}

	.empty {
		margin: 0;
		color: #555;
	}

	.grouping-options {
		display: flex;
		flex-direction: column;
		flex-wrap: unset;
	}

	.grouping-presets {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 0.75rem;
	}

	.grouping-presets-label {
		font-size: 0.8rem;
		font-weight: 600;
		opacity: 0.8;
	}

	.grouping-preset {
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		background: transparent;
		color: inherit;
		cursor: pointer;
		text-align: left;
		justify-content: left;
	}

	.grouping-preset-subtitle {
		margin-top: 0.25rem;
		font-size: 0.8rem;
		font-weight: 600;
		opacity: 0.8;
	}

	.grouping-preset:hover {
		background: var(--color-border);
	}

	.grouping-config-toggle {
		display: flex;
		justify-content: space-between;
		width: 100%;
		padding: 0.25rem 0;
		border: 0;
		background: transparent;
		color: inherit;
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		opacity: 0.7;
	}

	.grouping-config-toggle:hover {
		opacity: 1;
	}

	.grouping-config {
		margin-top: 0.5rem;
	}

	.grouping-config-label {
		display: block;
		margin-bottom: 0.35rem;
		font-size: 0.8rem;
		font-weight: 600;
		opacity: 0.8;
	}

	.grouping-field {
        flex: 1;
        position: relative;
        overflow-y: auto;
   	}

    .grouping-chip-list {
        flex-direction: column;
    }

    .sub.totals {
        width: 60%;
        margin-left: auto;
        border-top: 1px solid var(--color-border);
    }
</style>
