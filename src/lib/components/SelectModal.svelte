<script lang="ts">
	let {
		options,
		selected = $bindable<number[]>([]),
		placeholder = 'Seleccionar...'
	} = $props();

	type Option = {
		value: string | number;
		label: string;
	};

	let open = $state(false);
	const MAX_VISIBLE_LABELS = 2;

	function toggle(value: string | number) {
		if (selected.includes(value)) {
			selected = selected.filter((x : number) => x !== value);
		} else {
			selected = [...selected, value];
		}
	}

	function isSelected(value: number) {
		return selected.includes(value);
	}

	function toggleAll() {
		if (selected.length === options.length) {
			selected = [];
			return;
		}

		selected = options.map((o: Option) => o.value);
	}

	const selectedItems = $derived(options.filter((x: Option) => selected.includes(x.value)));
	const visibleSelectedItems = $derived(selectedItems.slice(0, MAX_VISIBLE_LABELS));
	const remainingSelectedCount = $derived(Math.max(0, selectedItems.length - MAX_VISIBLE_LABELS));
	const allSelected = $derived(options.length > 0 && selected.length === options.length);
</script>

<svelte:window
	onclick={() => (open = false)}
/>

<div
	class="multi-select"
	onclick={(e) => e.stopPropagation()}
    role="button"
    onkeydown={(e) => e.key === "Escape" && (open = false)}
    tabindex="0"
>
	<button
		type="button"
		class="trigger"
		onclick={() => (open = !open)}
	>
		{#if selected.length}
			<div class="chips">
				{#each visibleSelectedItems as item}
					<span class="chip">
						{item.label}
					</span>
				{/each}
				{#if remainingSelectedCount > 0}
					<span class="chip more-chip">
						+{remainingSelectedCount}
					</span>
				{/if}
			</div>
		{:else}
			<span class="placeholder">
				{placeholder}
			</span>
		{/if}
	</button>

	{#if open}
		<div class="dropdown">
			<button
				type="button"
				class="option select-all-option"
				onclick={toggleAll}
			>
				<input
					type="checkbox"
					checked={allSelected}
					readonly
				/>
				{allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
			</button>

			{#each options as option}
				<button
					type="button"
					class:selected={isSelected(option.value)}
					class="option"
					onclick={() => toggle(option.value)}
				>
					<input
						type="checkbox"
						checked={isSelected(option.value)}
						readonly
					/>

					{option.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.multi-select {
        background-color: #fff;
		position: relative;
		width: 100%;

		max-width: 24rem;
		border: 1px solid var(--color-border);
	}

	.trigger {
		display: flex;
        justify-content: flex-start;
		width: 100%;
		padding: 0.3rem;
		background-color: transparent;

	}

	.chips {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.3rem;
		overflow: hidden;
		white-space: nowrap;
	}

	.chip {
        border-radius: 0.25rem;
        background-color: transparent;
        color: var(--color-text);
        border: 1px solid var(--color-border);
		padding: .2rem .5rem;
		font-size: 0.85rem;
		white-space: nowrap;
	}

	.more-chip {
		flex-shrink: 0;
	}

	.dropdown {
		position: absolute;
		top: calc(100% + .25rem);
        max-width: 12rem;
		width: 100%;
		border: 1px solid var(--color-border);
		background-color: #fff;
		z-index: 10;
		max-height: 16rem;
		overflow: auto;
	}

	.option {
		display: flex;
        justify-content: flex-start;
        color: var(--color-text);
		gap: .75rem;
		width: 100%;
		padding: .75rem;
		border: none;
		background: transparent;
	}

	.option.selected {
		background:
			color-mix(
				in srgb,
				var(--color-theme-2) 10%,
				transparent
			);
	}

	.select-all-option {
		font-weight: 600;
		border-bottom: 1px solid var(--color-border);
	}

	.option:hover {
		background:
			color-mix(
				in srgb,
				var(--color-theme-2) 5%,
				transparent
			);
	}
</style>
