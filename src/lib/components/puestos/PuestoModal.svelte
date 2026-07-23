<script lang="ts">
	type Puesto = {
		id?: number;
		name: string;
		location: string;
		prohibited_percentage: number | '';
	};

	let { 
		showModal = $bindable(), 
		puesto = $bindable({ id: -1, banking_id: null, name: '', location: '', prohibited_percentage: 0, users: [] }),
		updatePuesto = $bindable(),
		addPuesto = $bindable()
	} = $props();

	function onClose() {
		showModal = false;
	}

	async function handleSubmit() {
		if (!puesto) {
			return;
		}
		
		const payload: Puesto = {
			id: puesto.id,
			name: puesto.name.trim(),
			location: puesto.location.trim(),
			prohibited_percentage: Number(puesto.prohibited_percentage || 0),
		};

		if (!payload.name || !payload.location) {
			return;
		}

		if (puesto.id && puesto.id > 0) 
			await updatePuesto(payload);
		else 
			await addPuesto(payload);
	}
</script>

{#if showModal}
	<div 
		class="modal-backdrop" 
		role="button" 
		onclick={onClose} 
		onkeydown={(e) => e.key === "Escape" && onClose()} 
		tabindex="0"
	>
		{#if puesto}
			<div
				class="modal"
				onclick={(e) => e.stopPropagation()}
				role="presentation"
			>
				<h2 class="modal-title">{puesto?.id ? 'Editar Puesto' : 'Agregar Nuevo Puesto'}</h2>
				<form class="modal-form"
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
				>
					<label class="modal-label" for="name">Nombre</label>
					<input class="modal-input" id="name" type="text" bind:value={puesto.name} required />

					<label class="modal-label" for="location">Ubicacion</label>
					<input class="modal-input" id="location" type="text" bind:value={puesto.location} required />

					<label class="modal-label" for="prohibited-percentage">Porcentaje prohibido</label>
					<input
						class="modal-input"
						id="prohibited-percentage"
						type="number"
						min="0"
						max="100"
						step="0.01"
						bind:value={puesto.prohibited_percentage}
					/>

					<div class="modal-actions">
						<button type="button" onclick={onClose} >Cancelar</button>
						<button type="submit">Guardar</button>
					</div>
				</form>
			</div>
		{/if}
	</div>
{/if}
