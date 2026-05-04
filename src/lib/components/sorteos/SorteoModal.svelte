<script lang="ts">
	let {
		showModal = $bindable(),
		sorteo = $bindable({
			name: '',
			is_reventado: false,
			is_megareventado: false,
			days: ''
		}),
		addSorteo = $bindable(),
		updateSorteo = $bindable()
	} = $props();

	const dayOptions = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
	let selectedDays = $derived(
		sorteo.days ? sorteo.days.split(',').map((day) => day.trim()).filter(Boolean) : []
	);


	function onClose() {
		showModal = false;
	}

	function handleSubmit() {
		const payload = {
			...sorteo,
			name: sorteo.name?.trim(),
			days: selectedDays.join(', ')
		};

		if (!payload.name || !payload.days) {
			return;
		}

		if (payload.id) {
			updateSorteo(payload);
		} else {
			addSorteo(payload);
		}
		onClose();
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
			<h2 class="modal-title">{sorteo?.id ? 'Editar Sorteo' : 'Agregar Nuevo Sorteo'}</h2>
			<form class="modal-form"
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<label class="modal-label" for="sorteo-name">Nombre</label>
				<input class="modal-input" id="sorteo-name" type="text" bind:value={sorteo.name} required />

				<div class="switch-grid">
					<label class="switch-row">
						<span>Reventado</span>
						<input class="switch-input" type="checkbox" bind:checked={sorteo.is_reventado} />
					</label>
					<label class="switch-row">
						<span>Megareventado</span>
						<input class="switch-input" type="checkbox" bind:checked={sorteo.is_megareventado} />
					</label>
				</div>

				<label class="modal-label" for="sorteo-days">Dias</label>
				<div class="days-grid">
					{#each dayOptions as day}
						<label class="day-option">
							<input id="sorteo-days" type="checkbox" value={day} bind:group={selectedDays} />
							<span>{day}</span>
						</label>
					{/each}
				</div>

				<div class="modal-actions">
					<button type="button" onclick={onClose}>Cancelar</button>
					<button type="submit">Guardar</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.switch-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem 1rem;
	}
	.switch-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.45rem 0.6rem;
		border-radius: 0.5rem;
		background: #f5f5f5;
		font-weight: 500;
	}
	.switch-input {
		appearance: none;
		width: 44px;
		height: 24px;
		border-radius: 999px;
		background: #d1d5db;
		position: relative;
		cursor: pointer;
		transition: background 160ms ease;
		border: 1px solid #cbd5f5;
	}
	.switch-input::after {
		content: '';
		position: absolute;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #fff;
		top: 2px;
		left: 2px;
		transition: transform 160ms ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}
	.switch-input:checked {
		background: var(--color-theme-1);
	}
	.switch-input:checked::after {
		transform: translateX(20px);
	}
	.switch-input:focus-visible {
		outline: 2px solid var(--color-theme-1);
		outline-offset: 2px;
	}
	.days-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.5rem 1rem;
	}
	.day-option {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		background: #f5f5f5;
	}
</style>
