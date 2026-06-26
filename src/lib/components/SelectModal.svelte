<script lang="ts">
	let {
		options,
		selected = $bindable([]),
		placeholder = 'Seleccionar...'
	} = $props();

    $effect(() => {
        if (selected.length === 0 && options.length > 0) {
            selected = [options[0].value];
        }
    });
	let open = $state(false);

	function toggle(value: string | number) {
		if (selected.includes(value)) {
			selected = selected.filter((x) => x !== value);
		} else {
			selected = [...selected, value];
		}
	}

	function isSelected(value: string | number) {
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
				{#each options.filter((x) => selected.includes(x.value)) as item}
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
        max-width: 10rem;
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