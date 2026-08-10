<script lang="ts">
	type ReportItem = {
		branch_id: number;
		branch_name: string;
		draw_schedule_id: number;
		draw_schedule_name: string;
		draw_id: number;
		draw_name: string;
		number: number;
		amount: number;
		branch_commission_percentage?: number;
		commission_percentage?: number;
		is_reventado: boolean;
		is_megareventado: boolean;
		date: string;
	};

	type ReportView = 'date-schedule' | 'date-branch' | 'branch-date' | 'date-draw' | 'draw-date';

	type GroupRow = {
		id: string;
		label: string;
		total: number;
		commission: number;
	};

	type GroupSection = {
		id: string;
		label: string;
		rows: GroupRow[];
		total: number;
		commission: number;
	};

	let { report = [], showModal = $bindable(false) } = $props<{
		report: ReportItem[];
		showModal: boolean;
	}>();

	let activeView = $state<ReportView>('date-branch');

	const currencyFormatter = new Intl.NumberFormat('es-CR', {
		style: 'currency',
		currency: 'CRC',
		maximumFractionDigits: 0
	});

	function normalizeDateLabel(value: string) {
		if (!value) return '-';
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return value;
		return new Intl.DateTimeFormat('es-CR').format(d);
	}

	function formatCurrency(value: number) {
		return currencyFormatter.format(value);
	}

	function getCommissionPercentage(item: ReportItem) {
		const percentage = Number(item.branch_commission_percentage ?? item.commission_percentage ?? 0);
		return Number.isFinite(percentage) ? percentage : 0;
	}

	function buildGroups(
		items: ReportItem[],
		config: {
			primaryId: (item: ReportItem) => string;
			primaryLabel: (item: ReportItem) => string;
			secondaryId: (item: ReportItem) => string;
			secondaryLabel: (item: ReportItem) => string;
		}
	): GroupSection[] {
		const primaryMap = new Map<string, { label: string; secondary: Map<string, GroupRow> }>();

		for (const item of items) {
			const pId = config.primaryId(item);
			const pLabel = config.primaryLabel(item);
			const sId = config.secondaryId(item);
			const sLabel = config.secondaryLabel(item);
			const commission = item.amount * (getCommissionPercentage(item) / 100);

			if (!primaryMap.has(pId)) {
				primaryMap.set(pId, { label: pLabel, secondary: new Map<string, GroupRow>() });
			}

			const primary = primaryMap.get(pId)!;
			const current = primary.secondary.get(sId);

			if (current) {
				current.total += item.amount;
				current.commission += commission;
			} else {
				primary.secondary.set(sId, {
					id: sId,
					label: sLabel,
					total: item.amount,
					commission
				});
			}
		}

		return Array.from(primaryMap.entries())
			.map(([id, value]) => {
				const rows = Array.from(value.secondary.values()).sort((a, b) => b.total - a.total);
				const total = rows.reduce((sum, row) => sum + row.total, 0);
				const commission = rows.reduce((sum, row) => sum + row.commission, 0);
				return { id, label: value.label, rows, total, commission };
			})
			.sort((a, b) => a.label.localeCompare(b.label));
	}

	const groupedDateSchedule = $derived(
		buildGroups(report, {
			primaryId: (item) => item.date || '-',
			primaryLabel: (item) => normalizeDateLabel(item.date),
			secondaryId: (item) => `${item.draw_schedule_id}`,
			secondaryLabel: (item) => `${item.draw_schedule_name} ${item.draw_name}`
		})
	);

	const groupedDateBranch = $derived(
		buildGroups(report, {
			primaryId: (item) => item.date || '-',
			primaryLabel: (item) => normalizeDateLabel(item.date),
			secondaryId: (item) => `${item.branch_id}`,
			secondaryLabel: (item) => item.branch_name
		})
	);

	const groupedBranchDate = $derived(
		buildGroups(report, {
			primaryId: (item) => `${item.branch_id}`,
			primaryLabel: (item) => item.branch_name,
			secondaryId: (item) => item.date || '-',
			secondaryLabel: (item) => normalizeDateLabel(item.date)
		})
	);

	const groupedDateDraw = $derived(
		buildGroups(report, {
			primaryId: (item) => item.date || '-',
			primaryLabel: (item) => normalizeDateLabel(item.date),
			secondaryId: (item) => `${item.draw_id}`,
			secondaryLabel: (item) => item.draw_name
		})
	);

	const groupedDrawDate = $derived(
		buildGroups(report, {
			primaryId: (item) => `${item.draw_id}`,
			primaryLabel: (item) => item.draw_name,
			secondaryId: (item) => item.date || '-',
			secondaryLabel: (item) => normalizeDateLabel(item.date)
		})
	);

	const visibleGroups = $derived(
		activeView === 'date-schedule'
			? groupedDateSchedule
			: activeView === 'date-branch'
				? groupedDateBranch
				: activeView === 'branch-date'
					? groupedBranchDate
					: activeView === 'date-draw'
						? groupedDateDraw
						: groupedDrawDate
	);

	const grandTotal = $derived(visibleGroups.reduce((sum, group) => sum + group.total, 0));
	const grandCommissionTotal = $derived(
		visibleGroups.reduce((sum, group) => sum + group.commission, 0)
	);

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
    			<div class="row">

     			<button
        				type="button"
        				class:active={activeView === 'draw-date'}
        				onclick={() => (activeView = 'draw-date')}
     			>
        				Por sorteo y fecha
     			</button>
     			<button
        				type="button"
        				class:active={activeView === 'branch-date'}
        				onclick={() => (activeView = 'branch-date')}
     			>
        				Por puesto y fecha
     			</button>
    			</div>
    			<div class="row">
    				<button
    					type="button"
    					class:active={activeView === 'date-draw'}
    					onclick={() => (activeView = 'date-draw')}
    				>
    					Por fecha y sorteo
    				</button>
    				<button
    					type="button"
    					class:active={activeView === 'date-schedule'}
    					onclick={() => (activeView = 'date-schedule')}
    				>
    					Por fecha y horario
    				</button>
    				<button
    					type="button"
    					class:active={activeView === 'date-branch'}
    					onclick={() => (activeView = 'date-branch')}
    				>
    					Por fecha y puesto
    				</button>
    			</div>
    		</div>

			<div class="content">
				{#if visibleGroups.length === 0}
					<p class="empty">No hay datos para mostrar.</p>
				{:else}
					<div class="totals-head">
						<span>Comisión</span>
						<span>Total vendido</span>
					</div>

					{#each visibleGroups as group}
						<div class="group">
							<h3>{group.label}</h3>
							<ul>
								{#each group.rows as row}
									<li>
										<span class="label">{row.label}</span>
										<div class="totals">
											<strong>{formatCurrency(row.commission)}</strong>
											<strong>{formatCurrency(row.total)}</strong>
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
					<strong>{formatCurrency(grandCommissionTotal)}</strong>
					<strong>{formatCurrency(grandTotal)}</strong>
				</div>
			</footer>
		</div>
	</div>
{/if}

<style>
	.modal {
		width: min(780px, 92vw);
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
		width: 53%;
		margin-left: auto;
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

	.totals-head {
		display: flex;
		justify-content: space-between;
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
		flex: 1;
	}

	.totals {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.empty {
		margin: 0;
		color: #555;
	}
</style>
