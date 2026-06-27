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

    $effect(() => {
        if (selected.length === 0 && options.length > 0) {
            selected = [options[0].value];
        }
    });

	let open = $state(false);

	function toggle(value: string | number) {
		const allValue = options[0].value;

		// Clicked "All Selected"
		if (value === allValue) {
			const allSelected = selected.length === options.length;
			selected = allSelected ? [] : options.map((o : Option) => o.value);
			return;
		}

		// Toggle normal option
		if (selected.includes(value)) {
			selected = selected.filter((x : number) => x !== value);
		} else {
			selected = [...selected, value];
		}

		// Remove "All Selected"
		selected = selected.filter((x : number) => x !== allValue);

		// If every normal option selected → select All
		const allNormalSelected = options.slice(1).every((o : Option) => selected.includes(o.value));
			
		if (allNormalSelected) 
			selected = selected.filter((x : number) => x === allValue);
	}

	function isSelected(value: number) {
		return selected.includes(value);
	}
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
				{#each options.filter((x : Option) => selected.includes(x.value)) as item}
					<span class="chip">
						{item.label}
					</span>
				{/each}
			</div>
		{:else}
			<span class="placeholder">
				{placeholder}
			</span>
		{/if}
	</button>

	{#if open}
		<div class="dropdown">
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
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.chip {
        border-radius: 0.25rem;
        background-color: transparent;
        color: var(--color-text);
        border: 1px solid var(--color-border);
		padding: .2rem .5rem;
		font-size: 0.85rem;
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

	.option:hover {
		background:
			color-mix(
				in srgb,
				var(--color-theme-2) 5%,
				transparent
			);
	}
</style>