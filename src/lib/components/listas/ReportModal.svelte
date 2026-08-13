<script lang="ts">
	// Available grouping options and the type representing a grouping mode.
	import { GROUPING_OPTIONS, type GroupingMode } from '../venta/grouping';
	let { report = [], showModal = $bindable(false), winners } = $props<{report: ReportItem[];showModal: boolean;}>();

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

	// Represents a secondary row inside a grouped report section.
	type GroupRow = {
		id: string;
		label: string;
		winners: Winner[];
		winner_total: number;
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
		total: number;
		comission: number;
	};

	// Defines the active grouping hierarchy.
	// By default, reports are grouped first by date and then by branch.
	let groupingModes = $state<GroupingMode[]>(['date', 'branch']);

	// Formatter used to display amounts as Costa Rican colones.
	const currencyFormatter = new Intl.NumberFormat('es-CR', {style: 'currency', currency: 'CRC', maximumFractionDigits: 0});
	function formatCurrency(value: number) {return currencyFormatter.format(value);}

	// Converts a date string into a localized date label.
	// Returns '-' for empty values and the original value if parsing fails.
	function normalizeDateLabel(value: string) {
		if (!value) return '-';
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) {
			return value;
		}
		return new Intl.DateTimeFormat('es-CR').format(d);
	}

	// Extracts and validates the branch commission percentage.
	// Invalid or missing values default to 0%.
	function getcomissionPercentage(item: ReportItem) {
		const percentage = Number(item.branch_comission);
		return Number.isFinite(percentage) ? percentage : 0;
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

	// TODO: Retrieves winner information for a grouped row.
	function getWinnerForRow(row: GroupRow) {
		console.log(row);
		console.log(report);
		console.log(winners);

		return;
	}

	// Returns the human-readable label for a grouping value.
	function getGroupingLabel(item: ReportItem, mode: GroupingMode) {
		switch (mode) {
			case 'branch':
				return item.branch_name;
			case 'draw_schedule':
				return `${item.draw_name} ${item.draw_schedule_name}`;
			case 'draw':
				return item.draw_name;
			case 'date':
				return normalizeDateLabel(item.date);
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

		for (const winner of winners) {
			const key = `${winner.date}|${winner.schedule_id}`;
			const existing = winnersBySchedule.get(key) ?? [];

			existing.push(winner);
			winnersBySchedule.set(key, existing);
		}

		for (const item of items) {
			const pId = config.primaryId(item);
			const pLabel = config.primaryLabel(item);
			const sId = config.secondaryId(item);
			const sLabel = config.secondaryLabel(item);
			const winnerKey = `${item.date}|${item.draw_schedule_id}`;

			// Calculate the commission for this individual report item.
			const comission = item.amount * (getcomissionPercentage(item) / 100);
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
			let winner = 0;
			// If current reportItem is a winner
			if (item.number === rowWinners[0].winner_number) {
				winner += item.amount;
			}

			if (current) {
				// Add the current item's amount and commission
				// to an already existing secondary group.
				current.total += item.amount;
				current.comission += comission;
				if (!current.winners.find(w => rowWinners.includes(w))) {
					current.winners.push(...rowWinners);
				}
				current.winner_total += winner;
			} else {
				// Create a new secondary group for this item.
				primary.secondary.set(sId, {
					id: sId,
					label: sLabel,
					winners: rowWinners,
					winner_total: winner,
					total: item.amount,
					comission
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
				const comission = rows.reduce(
					(sum, row) => sum + row.comission,
					0
				);

				return {
					id,
					label: value.label,
					rows,
					winner_total: rows.reduce((sum, row) => sum + row.winner_total, 0),
					total,
					comission
				};
			})
			.sort((a, b) => a.label.localeCompare(b.label));
	}

	// Rebuilds the grouped report whenever the report or grouping modes change.
	const visibleGroups = $derived.by(() => {
		// The first selected mode is the primary grouping.
		// The second selected mode is the secondary grouping.
		// If only one mode is selected, it is used for both.
		const [primaryMode, secondaryMode = primaryMode] = groupingModes;

		return buildGroups(report, {
			primaryId: (item) => getGroupingValue(item, primaryMode),
			primaryLabel: (item) => getGroupingLabel(item, primaryMode),

			secondaryId: (item) => getGroupingValue(item, secondaryMode),
			secondaryLabel: (item) => getGroupingLabel(item, secondaryMode)
		});
	});


	const grandTotal = $derived(visibleGroups.reduce((sum, group) => sum + group.total, 0));
	const grandcomissionTotal = $derived(visibleGroups.reduce((sum, group) => sum + group.comission, 0));
	//const allWinners = $derived(visibleGroups.flatMap((group) => group.winners));
	const allWinners = $derived(visibleGroups.flatMap((group) => group.rows.flatMap((row) => row.winners)));
	const granWinnerTotal = $derived(visibleGroups.reduce((sum, group) => sum + group.winner_total, 0));
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
    		<div class="tabs">
				<div class="field grouping-field">
					<label for="agrupacion">Agrupar por</label>
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
    		</div>

			<div class="content">
				{#if visibleGroups.length === 0}
					<p class="empty">No hay datos para mostrar.</p>
				{:else}
					<div class="totals-head">
					    <span>Total vendido</span>
						<span>Comisión</span>
						<span>Premio</span>
						<span>Numero ganador</span>
						<span>Neto</span>
					</div>

					{#each visibleGroups as group}
						<div class="group">
							<h3>{group.label}</h3>
							<ul>
								{#each group.rows as row}
									<li>
										<span class="label">{row.label}</span>
										<div class="totals">
										    <strong>{formatCurrency(row.total)}</strong>
											<strong>{formatCurrency(row.comission)}</strong>
											<strong>{formatCurrency(row.winner_total)}</strong>
											<strong>
											{#each row.winners as winner, index}
											    {`${winner.winner_number ? `${winner.winner_number}${index < row.winners.length - 1 ? ', ' : ''}` : ''}`}
											{/each}
											</strong>
											<strong>{formatCurrency(row.total - row.comission)}</strong>
										</div>
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				{/if}
			</div>

			<footer class="modal-footer">
				<span class="label">Total</span>
				<div class="totals">
				    <strong>{formatCurrency(grandTotal)}</strong>
					<strong>{formatCurrency(grandcomissionTotal)}</strong>
					<strong>{formatCurrency(granWinnerTotal)}</strong>
					{#each allWinners as winner, index}
					    {`${winner.winner_number ? `${winner.winner_number}${index < allWinners.length - 1 ? ', ' : ''}` : ''}`}
					{/each}
					<strong>{formatCurrency(grandTotal - grandcomissionTotal)}</strong>
				</div>
			</footer>
		</div>
	</div>
{/if}

<style>
	.modal {
		width: 68vw;
		max-height: 88vh;
		display: flex;
		flex-direction: column;
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
		width: 60%;
		margin-left: auto;
		padding: 0 0.75rem;
	}

	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
		width: 100%;
	}

	.tabs .row {
	    width: 100%;
	}

	.tabs button {
        width: 100%;
		border: 1px solid var(--color-border);
		color: var(--color-text);
		background: #fff;
	}

	.tabs button.active {
		background: var(--color-theme-8);
		border-color: var(--color-theme-2);
	}

	.content {
		padding: 1rem 0;
		overflow: auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.group {
		border: 1px solid var(--color-border);
		padding: 0.75rem;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li, .modal-footer {
		display: flex;
		justify-content: space-between;
		padding: 0.35rem 0;
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

	.empty {
		margin: 0;
		color: #555;
	}

	.grouping-options {
		display: flex;
		flex-direction: row;
		flex-wrap: unset;

	}
</style>
