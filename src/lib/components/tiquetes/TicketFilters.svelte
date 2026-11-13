<script lang="ts">
	import SelectModal from '$lib/components/SelectModal.svelte';

	let {
		from = $bindable(''),
		to = $bindable(''),
		selectedBranches = $bindable<number[]>([]),
		selectedDrawSchedules = $bindable<number[]>([]),
		branchOptions = [],
		scheduleOptions = [],
		onApply
	}: {
		from?: string;
		to?: string;
		selectedBranches?: number[];
		selectedDrawSchedules?: number[];
		branchOptions: { value: number; label: string }[];
		scheduleOptions: { value: number; label: string }[];
		onApply: () => void;
	} = $props();
</script>

<form class="filters" onsubmit={(event) => { event.preventDefault(); onApply(); }}>
	<div class="field date-field">
		<label for="tickets-from">Desde</label>
		<input id="tickets-from" type="date" bind:value={from} required />
	</div>
	<div class="field date-field">
		<label for="tickets-to">Hasta</label>
		<input id="tickets-to" type="date" bind:value={to} required />
	</div>
	<div class="field selection-field">
		<label for="tickets-branch">Puesto</label>
		<SelectModal
			options={branchOptions}
			bind:selected={selectedBranches}
			placeholder="Seleccione un puesto"
		/>
	</div>
	<div class="field selection-field">
		<label for="tickets-schedule">Sorteo</label>
		<SelectModal
			options={scheduleOptions}
			bind:selected={selectedDrawSchedules}
			placeholder="Seleccione un sorteo"
		/>
	</div>
	<button type="submit">Aplicar filtros</button>
</form>

<style>
	.filters {
		display: grid;
		grid-template-columns: minmax(8rem, 0.65fr) minmax(8rem, 0.65fr) minmax(14rem, 1.5fr) minmax(14rem, 1.5fr) auto;
		align-items: end;
		gap: 1rem;
		margin-top: 1.5rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		background: var(--color-box-background);
	}

	.field {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.35rem;
	}

	label {
		color: var(--color-text);
		font-size: 0.95rem;
	}

	input {
		box-sizing: border-box;
		width: 100%;
		min-height: 2.2rem;
		padding: 0.3rem 0.5rem;
	}

	.selection-field :global(.multi-select) {
		width: 100%;
		max-width: none;
		box-sizing: border-box;
		min-height: 2.2rem;
	}

	.selection-field :global(.trigger) {
		min-height: 2.2rem;
	}

	.filters > button {
		min-height: 2.2rem;
		padding: 0.3rem 0.75rem;
		white-space: nowrap;
	}

	@media (max-width: 1050px) {
		.filters {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.filters > button {
			grid-column: 1 / -1;
			justify-self: start;
		}
	}

	@media (max-width: 640px) {
		.filters {
			grid-template-columns: 1fr;
			gap: 0.75rem;
			padding: 0.75rem;
		}

		.filters > button {
			width: 100%;
		}
	}
</style>
