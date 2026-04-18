<script lang="ts">
	let {
		showModal = $bindable(),
		sorteo = $bindable({
			name: '',
			type: 'Tiempos',
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
			type: sorteo.type?.trim(),
			days: selectedDays.join(', ')
		};

		if (!payload.name || !payload.type || !payload.days) {
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
			<h2>{sorteo?.id ? 'Editar Sorteo' : 'Agregar Nuevo Sorteo'}</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<label for="sorteo-name">Nombre</label>
				<input id="sorteo-name" type="text" bind:value={sorteo.name} required />

				<label for="sorteo-type">Tipo</label>
				<select id="sorteo-type" bind:value={sorteo.type}>
					<option value="Tiempos">Tiempos</option>
					<option value="Reventado">Reventado</option>
				</select>

				<label for="sorteo-days">Dias</label>
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
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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
